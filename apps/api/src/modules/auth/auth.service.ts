import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { CaptchaService } from './captcha.service';
import { LoginAttemptService } from './login-attempt.service';
import { safeUserSelect, SafeUser } from './user.select';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const derived = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(expected));
  } catch {
    return false;
  }
}

@Injectable()
export class AuthService {
  private readonly jwtExpiry = process.env.JWT_EXPIRES_IN ?? '1h';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly captcha: CaptchaService,
    private readonly loginAttempts: LoginAttemptService,
  ) {}

  private buildToken(user: SafeUser) {
    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        trustLevel: user.trustLevel,
      },
      { expiresIn: this.jwtExpiry },
    );
  }

  private buildAttemptKey(email: string, ip?: string) {
    return `${ip ?? 'unknown'}:${email.toLowerCase()}`;
  }

  async register(email: string, displayName: string, password: string, turnstileToken: string, remoteIp?: string) {
    if (!turnstileToken) {
      throw new BadRequestException('Captcha token is required for registration');
    }
    await this.captcha.verify(turnstileToken, remoteIp);

    const passwordHash = hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName,
        trustLevel: 'new',
        passwordHash,
      },
      select: safeUserSelect,
    });
    const accessToken = await this.buildToken(user);
    return { user, accessToken };
  }

  async login(email: string, password: string, turnstileToken: string | undefined, remoteIp?: string) {
    const attemptKey = this.buildAttemptKey(email, remoteIp);
    if (this.loginAttempts.needsCaptcha(attemptKey) && !turnstileToken) {
      throw new BadRequestException({
        message: 'Captcha required after several failed attempts',
        captchaRequired: true,
      });
    }
    if (turnstileToken) {
      await this.captcha.verify(turnstileToken, remoteIp);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...safeUserSelect, passwordHash: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      const status = this.loginAttempts.recordFailure(attemptKey);
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        captchaRequired: status.requireCaptcha,
      });
    }

    this.loginAttempts.reset(attemptKey);
    const { passwordHash, ...safeUser } = user;
    const accessToken = await this.buildToken(safeUser);
    return {
      user: safeUser,
      accessToken,
      captchaRequired: false,
    };
  }
}
