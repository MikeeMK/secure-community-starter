import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';
import { PlanService } from '../plan/plan.service';
import {
  normalizeLookingForValues,
  normalizeProfileRecord,
  PROFILE_BIO_MAX_LENGTH,
} from './profile.utils';

const PROFILE_SELECT = {
  id: true,
  age: true,
  city: true,
  gender: true,
  orientation: true,
  relationshipStatus: true,
  lookingFor: true,
  interactionType: true,
  ageMin: true,
  ageMax: true,
  interests: true,
  bio: true,
  albumPhotos: true,
  updatedAt: true,
};

function calcCompletion(emailVerifiedAt: Date | null, p: Record<string, unknown> | null): number {
  const checks = [
    !!emailVerifiedAt,
    !!(p?.age),
    !!(p?.city),
    !!(p?.gender),
    !!(p?.orientation),
    !!(p?.bio && (p.bio as string).length > 10),
    ((p?.interests as string[])?.length ?? 0) >= 3,
    ((p?.lookingFor as string[])?.length ?? 0) > 0,
  ];
  const weights = [20, 10, 10, 10, 10, 15, 15, 10];
  return checks.reduce((sum, c, i) => sum + (c ? weights[i] : 0), 0);
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly plan: PlanService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        trustLevel: true,
        emailVerifiedAt: true,
        createdAt: true,
        profile: { select: PROFILE_SELECT },
      },
    });
    if (!user) return null;
    const completionUnlocked = await this.tokens.hasProfileCompletionUnlocked(userId);
    const completion = completionUnlocked
      ? 100
      : calcCompletion(user.emailVerifiedAt, user.profile as Record<string, unknown> | null);
    return {
      ...user,
      profile: normalizeProfileRecord(user.profile),
      completion,
      completionUnlocked,
    };
  }

  async upsertProfile(
    userId: string,
    data: {
      age?: number;
      city?: string;
      gender?: string;
      orientation?: string;
      relationshipStatus?: string;
      lookingFor?: string[];
      interactionType?: string[];
      ageMin?: number;
      ageMax?: number;
      interests?: string[];
      bio?: string;
    },
  ) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { bio: true },
    });

    if (
      typeof data.bio === 'string' &&
      data.bio.length > PROFILE_BIO_MAX_LENGTH &&
      data.bio !== existing?.bio
    ) {
      throw new BadRequestException(
        `La biographie ne peut pas dépasser ${PROFILE_BIO_MAX_LENGTH} caractères.`,
      );
    }

    const payload = {
      ...data,
      ...(data.lookingFor ? { lookingFor: normalizeLookingForValues(data.lookingFor) } : {}),
    };

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: payload,
      select: PROFILE_SELECT,
    });

    // Check milestone awards after save
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    const completionUnlocked = await this.tokens.hasProfileCompletionUnlocked(userId);
    const pct = completionUnlocked
      ? 100
      : calcCompletion(user?.emailVerifiedAt ?? null, profile as Record<string, unknown>);
    if (!completionUnlocked && pct >= 100) this.tokens.awardProfileCompletion(userId).catch(() => {});

    return normalizeProfileRecord(profile);
  }

  async addAlbumPhoto(userId: string, photoBase64: string): Promise<string[]> {
    const { plan } = await this.plan.getUserPlan(userId);
    if (plan === 'free') {
      throw new BadRequestException("L'album photo est reservé aux abonnés Plus et Premium.");
    }
    const maxPhotos = plan === 'premium' ? 20 : 10;
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { albumPhotos: true },
    });
    const current = existing?.albumPhotos ?? [];
    if (current.length >= maxPhotos) {
      throw new BadRequestException(`Vous avez atteint la limite de ${maxPhotos} photos.`);
    }
    const updated = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, albumPhotos: [photoBase64] },
      update: { albumPhotos: { push: photoBase64 } },
      select: { albumPhotos: true },
    });
    return updated.albumPhotos;
  }

  async removeAlbumPhoto(userId: string, index: number): Promise<string[]> {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { albumPhotos: true },
    });
    if (!existing) return [];
    const photos = [...existing.albumPhotos];
    photos.splice(index, 1);
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: { albumPhotos: photos },
      select: { albumPhotos: true },
    });
    return updated.albumPhotos;
  }

  async listMembers(excludeUserId: string) {
    return this.prisma.user.findMany({
      where: { id: { not: excludeUserId }, accountStatus: { not: 'DELETED' } },
      orderBy: { lastActiveAt: 'desc' },
      take: 6,
      select: {
        id: true,
        displayName: true,
        trustLevel: true,
        lastActiveAt: true,
        profile: { select: { city: true, age: true, interests: true } },
      },
    });
  }
}
