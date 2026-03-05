import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from './captcha.service';
import { EmailService } from './email.service';
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
    private readonly email: EmailService,
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

    const user = await this.prisma.user.create({
      data: { email, displayName, trustLevel: 'new', passwordHash },
      select: safeUserSelect,
    });

    // Send email verification (non-blocking: don't fail register if email fails)
    const verifToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await this.prisma.emailVerificationToken.create({
      data: { token: verifToken, userId: user.id, expiresAt },
    });
    this.email.sendVerificationEmail(email, verifToken).catch(() => {});

    const accessToken = await this.buildToken(user);
    return { user, accessToken };
  }

  // -------------------------------------------------------------------------
  // verifyEmail
  // -------------------------------------------------------------------------
  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de vérification invalide ou expiré');
    }
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // changePassword (while logged in)
  // -------------------------------------------------------------------------
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const valid = await verifyHash(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Mot de passe actuel incorrect');

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // forgotPassword — send reset email
  // -------------------------------------------------------------------------
  async forgotPassword(email: string) {
    // Always respond with the same message to prevent email enumeration
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      // Invalidate existing reset tokens for this user
      await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await this.prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });
      this.email.sendPasswordResetEmail(email, token).catch(() => {});
    }
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // resetPassword — consume token and set new password
  // -------------------------------------------------------------------------
  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    });
    await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
    return { success: true };
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
