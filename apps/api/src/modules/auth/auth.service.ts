import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, timingSafeEqual, pbkdf2Sync } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from './captcha.service';
import { EmailService } from './email.service';
import { LoginAttemptService } from './login-attempt.service';
import { safeUserSelect, SafeUser } from './user.select';
import { TokenService } from '../tokens/token.service';

// Lazy-load argon2 so the app still starts if native build is missing during development.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const argon2: typeof import('argon2') = require('argon2');

const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com', 'mailinator.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.it',
  'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.at',
  'trashmail.io', 'trashmail.org', 'dispostable.com', 'temp-mail.org', 'tempmail.com',
  'throwam.com', 'throwam.net', 'maildrop.cc', 'fakeinbox.com', 'mailnull.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', '10minutemail.com',
  'tempr.email', 'discard.email', 'tempail.com', 'getairmail.com', 'filzmail.com',
  'mailnew.com', 'harakirimail.com', 'mailexpire.com',
]);

// ---------------------------------------------------------------------------
// Legacy PBKDF2 verify — for accounts created before the argon2id migration.
// Remove once all legacy hashes are gone.
// ---------------------------------------------------------------------------
function legacyVerify(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  try {
    const derived = pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
    return timingSafeEqual(Buffer.from(derived), Buffer.from(expected));
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

function legacyHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
  return `${salt}:${derived}`;
}

async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, { type: argon2.argon2id });
  } catch {
    return legacyHash(password);
  }
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
    private readonly tokens: TokenService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async ensureAccountAccess<T extends SafeUser & {
    accountStatus: string;
    moderationReason: string | null;
    suspendedUntil: Date | null;
    canReRegisterAfter: Date | null;
    moderatedAt: Date | null;
  }>(user: T): Promise<T> {
    if (user.accountStatus === 'ACTIVE') return user;

    if (user.accountStatus === 'SUSPENDED') {
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            accountStatus: 'ACTIVE',
            moderationReason: null,
            suspendedUntil: null,
            moderatedAt: null,
          },
        });
        return {
          ...user,
          accountStatus: 'ACTIVE',
          moderationReason: null,
          suspendedUntil: null,
          moderatedAt: null,
        };
      }

      throw new UnauthorizedException(
        user.moderationReason
          ? `Compte suspendu: ${user.moderationReason}`
          : 'Ce compte est actuellement suspendu.',
      );
    }

    if (user.accountStatus === 'BANNED') {
      if (user.canReRegisterAfter && user.canReRegisterAfter > new Date()) {
        throw new UnauthorizedException(
          `Compte bloqué jusqu'au ${user.canReRegisterAfter.toLocaleDateString('fr-FR')}.`,
        );
      }
      throw new UnauthorizedException(
        user.moderationReason
          ? `Compte banni: ${user.moderationReason}`
          : 'Ce compte a été banni.',
      );
    }

    throw new UnauthorizedException('Ce compte a été supprimé ou désactivé.');
  }

  /** Returns a devUrl field only in non-production environments without SMTP configured. */
  private devLink(path: string) {
    const emailEnabled = process.env.EMAIL_ENABLED !== 'false';
    const smtpHost = process.env.SMTP_HOST?.trim().toLowerCase();
    const hasRealSmtp = emailEnabled && !!smtpHost && smtpHost !== 'localhost';

    if (process.env.NODE_ENV === 'production' || hasRealSmtp) return {};
    const base = process.env.APP_URL ?? 'http://localhost:3000';
    return { devUrl: `${base}${path}` };
  }

  private buildToken(user: SafeUser) {
    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        trustLevel: user.trustLevel,
        isAdultVerified: user.isAdultVerified,
      },
      { expiresIn: this.jwtExpiry },
    );
  }

  private buildAttemptKey(email: string, ip?: string) {
    return `${ip ?? 'unknown'}:${this.normalizeEmail(email)}`;
  }

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------
  async register(
    email: string,
    displayName: string,
    password: string,
    dateOfBirth: string,
    turnstileToken: string | undefined,
    remoteIp?: string,
  ) {
    const normalizedEmail = this.normalizeEmail(email);

    // Verify age (must be 18+)
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Date de naissance invalide.');
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      throw new BadRequestException('Vous devez avoir 18 ans ou plus pour vous inscrire.');
    }

    // Verify Turnstile captcha (skipped automatically in dev when no secret is configured)
    await this.captcha.verify(turnstileToken, remoteIp);

    // Block disposable/temporary email providers
    const domain = normalizedEmail.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      throw new BadRequestException('Les adresses e-mail temporaires ne sont pas acceptées.');
    }

    const exists = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (exists) {
      throw new BadRequestException('Cette adresse e-mail est déjà utilisée');
    }

    // Hash with argon2id
    const passwordHash = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: { email: normalizedEmail, displayName, trustLevel: 'new', passwordHash, dateOfBirth: dob },
      select: safeUserSelect,
    });

    // Send email verification (non-blocking: don't fail register if email fails)
    const verifToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await this.prisma.emailVerificationToken.create({
      data: { token: verifToken, userId: user.id, expiresAt },
    });
    this.email.sendVerificationEmail(normalizedEmail, verifToken).catch(() => {});

    const devOnly = this.devLink(`/verifier-email?token=${verifToken}`);
    return {
      success: true,
      email: user.email,
      displayName: user.displayName,
      verificationRequired: true,
      ...devOnly,
    };
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
    this.tokens.awardMilestone(record.userId, 'email_verified').catch(() => {});
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

    const newHash = await hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // forgotPassword — send reset email
  // -------------------------------------------------------------------------
  async forgotPassword(email: string) {
    // Always respond with the same message to prevent email enumeration
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
    if (user) {
      // Invalidate existing reset tokens for this user
      await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await this.prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });
      this.email.sendPasswordResetEmail(user.email, token).catch(() => {});
      const devOnly = this.devLink(`/reinitialiser-mot-de-passe?token=${token}`);
      return { success: true, ...devOnly };
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
    const newHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    });
    await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // devLogin — dev-only, no password check
  // -------------------------------------------------------------------------
  async devLogin(email: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Not available in production');
    }
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: safeUserSelect,
      orderBy: { createdAt: 'asc' },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const safeUser = await this.ensureAccountAccess(user);
    const accessToken = await this.buildToken(safeUser);
    return { user: safeUser, accessToken };
  }

  async oauthLogin(input: {
    email: string;
    displayName: string;
    provider: 'google' | 'facebook';
    emailVerified?: boolean;
  }) {
    const normalizedEmail = this.normalizeEmail(input.email);
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: safeUserSelect,
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      const allowedExisting = await this.ensureAccountAccess(existing);
      if (input.emailVerified && !existing.emailVerifiedAt) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { emailVerifiedAt: new Date(), email: normalizedEmail },
        });
        this.tokens.awardMilestone(existing.id, 'email_verified').catch(() => {});
      } else if (existing.email !== normalizedEmail) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { email: normalizedEmail },
        });
      }

      const refreshedUser = await this.prisma.user.findUnique({
        where: { id: existing.id },
        select: safeUserSelect,
      });
      if (!refreshedUser) throw new NotFoundException('Utilisateur introuvable');

      const safeUser = await this.ensureAccountAccess({ ...refreshedUser, accountStatus: allowedExisting.accountStatus, moderationReason: allowedExisting.moderationReason, suspendedUntil: allowedExisting.suspendedUntil, canReRegisterAfter: allowedExisting.canReRegisterAfter, moderatedAt: allowedExisting.moderatedAt });
      const accessToken = await this.buildToken(safeUser);
      return { user: safeUser, accessToken };
    }

    const passwordHash = await hashPassword(randomBytes(32).toString('hex'));

    const createdUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: input.displayName,
        trustLevel: 'new',
        passwordHash,
        emailVerifiedAt: input.emailVerified ? new Date() : null,
      },
      select: safeUserSelect,
    });

    if (input.emailVerified) {
      this.tokens.awardMilestone(createdUser.id, 'email_verified').catch(() => {});
    }

    const safeUser = await this.ensureAccountAccess(createdUser);
    const accessToken = await this.buildToken(safeUser);
    return { user: safeUser, accessToken };
  }

  // -------------------------------------------------------------------------
  // refresh — issue a new JWT for an already-authenticated user
  // -------------------------------------------------------------------------
  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const safeUser = await this.ensureAccountAccess(user);
    const accessToken = await this.buildToken(safeUser);
    return { user: safeUser, accessToken };
  }

  // -------------------------------------------------------------------------
  // updateLastActive — throttled: only writes if stale by more than 4 minutes
  // -------------------------------------------------------------------------
  async updateLastActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true },
    });
    const threshold = new Date(Date.now() - 4 * 60 * 1000);
    if (!user || !user.lastActiveAt || user.lastActiveAt < threshold) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    }
    return { ok: true };
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
    const normalizedEmail = this.normalizeEmail(email);
    const attemptKey = this.buildAttemptKey(normalizedEmail, remoteIp);

    if (await this.loginAttempts.needsCaptcha(attemptKey)) {
      if (!turnstileToken) {
        throw new BadRequestException({
          message: 'Captcha requis après plusieurs tentatives échouées',
          captchaRequired: true,
        });
      }
      await this.captcha.verify(turnstileToken, remoteIp);
    }

    const users = await this.prisma.user.findMany({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: { ...safeUserSelect, passwordHash: true },
    });
    let user = users[0];
    let valid = false;
    for (const candidate of users) {
      if (await verifyHash(password, candidate.passwordHash)) {
        user = candidate;
        valid = true;
        break;
      }
    }

    if (!user || !valid) {
      const status = await this.loginAttempts.recordFailure(attemptKey);
      throw new UnauthorizedException({
        message: 'Identifiants incorrects',
        captchaRequired: status.requireCaptcha,
      });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Merci de confirmer votre adresse e-mail avant de vous connecter.');
    }

    await this.loginAttempts.reset(attemptKey);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    const allowedUser = await this.ensureAccountAccess(safeUser);
    const accessToken = await this.buildToken(allowedUser);
    return { user: allowedUser, accessToken };
  }
}
