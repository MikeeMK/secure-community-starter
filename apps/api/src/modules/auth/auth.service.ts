import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from './captcha.service';
import { LoginAttemptService } from './login-attempt.service';
import { safeUserSelect, SafeUser } from './user.select';

// Lazy-load argon2 so the app still starts if native build is missing during development.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const argon2: typeof import('argon2') = require('argon2');

// ---------------------------------------------------------------------------
// Legacy PBKDF2 verify — for accounts created before the argon2id migration.
// Remove once all legacy hashes are gone.
// ---------------------------------------------------------------------------
function legacyVerify(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  try {
    const derived = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function verifyHash(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('$argon2')) {
    return argon2.verify(stored, password);
  }
  // Fallback: legacy PBKDF2
  return legacyVerify(password, stored);
}

// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------
  async register(
    email: string,
    displayName: string,
    password: string,
    turnstileToken: string | undefined,
    remoteIp?: string,
  ) {
    // Verify Turnstile captcha (skipped automatically in dev when no secret is configured)
    await this.captcha.verify(turnstileToken, remoteIp);

    const exists = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      throw new BadRequestException('Cette adresse e-mail est déjà utilisée');
    }

    // Hash with argon2id
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    // TODO: EMAIL VERIFICATION
    // Generate a verification token, store it on the user record, send a
    // verification email, and mark the user inactive until they click the link.
    // For now the account is immediately active.

    const user = await this.prisma.user.create({
      data: { email, displayName, trustLevel: 'new', passwordHash },
      select: safeUserSelect,
    });

    const accessToken = await this.buildToken(user);
    return { user, accessToken };
  }

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  async login(
    email: string,
    password: string,
    turnstileToken: string | undefined,
    remoteIp?: string,
  ) {
    const attemptKey = this.buildAttemptKey(email, remoteIp);

    if (this.loginAttempts.needsCaptcha(attemptKey)) {
      if (!turnstileToken) {
        throw new BadRequestException({
          message: 'Captcha requis après plusieurs tentatives échouées',
          captchaRequired: true,
        });
      }
      await this.captcha.verify(turnstileToken, remoteIp);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...safeUserSelect, passwordHash: true },
    });

    const valid = user ? await verifyHash(password, user.passwordHash) : false;

    if (!user || !valid) {
      const status = this.loginAttempts.recordFailure(attemptKey);
      throw new UnauthorizedException({
        message: 'Identifiants incorrects',
        captchaRequired: status.requireCaptcha,
      });
    }

    this.loginAttempts.reset(attemptKey);
    const { passwordHash: _ph, ...safeUser } = user;
    const accessToken = await this.buildToken(safeUser);
    return { user: safeUser, accessToken };
  }
}
