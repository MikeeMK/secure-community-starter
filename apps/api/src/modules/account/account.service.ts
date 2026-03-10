import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';
import { safeUserSelect } from '../auth/user.select';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const argon2: typeof import('argon2') = require('argon2');

const DISPLAY_NAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async getAccount(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        displayNameUpdatedAt: true,
        isAdultVerified: true,
        adultVerifiedAt: true,
        settings: true,
      },
    });
  }

  async updateDisplayName(userId: string, displayName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayNameUpdatedAt: true },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    // First change: displayNameUpdatedAt is null — allowed
    if (user.displayNameUpdatedAt !== null) {
      const nextAllowed = new Date(user.displayNameUpdatedAt.getTime() + DISPLAY_NAME_COOLDOWN_MS);
      if (new Date() < nextAllowed) {
        throw new BadRequestException({
          message: 'Vous devez attendre 7 jours entre chaque modification du nom d\'affichage',
          nextAllowedAt: nextAllowed.toISOString(),
        });
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName, displayNameUpdatedAt: new Date() },
      select: { id: true, displayName: true, displayNameUpdatedAt: true },
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { success: true };
  }

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      // Return defaults
      return { allowChat: true, hideFromSuggestions: false, allowNotifLikes: true };
    }
    return settings;
  }

  async updateSettings(userId: string, data: {
    allowChat?: boolean;
    hideFromSuggestions?: boolean;
    allowNotifLikes?: boolean;
  }) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: { allowChat: true, hideFromSuggestions: true, allowNotifLikes: true },
    });
  }

  async markCurrentUserAsAdultVerified(userId: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Action indisponible en production');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isAdultVerified: true,
        adultVerifiedAt: new Date(),
        verificationProvider: 'dev_override',
        verificationReference: 'current-user-self-serve',
      },
      select: safeUserSelect,
    });

    this.tokens.awardMilestone(userId, 'adult_verified').catch(() => {});
    return { user };
  }
}
