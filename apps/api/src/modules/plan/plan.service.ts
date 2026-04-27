import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UserPlanType = 'free' | 'plus' | 'premium';

export const PLAN_LIMITS: Record<UserPlanType, { maxAnnouncements: number; maxPhotos: number; boostsPerMonth: number }> = {
  free:    { maxAnnouncements: 1, maxPhotos: 3, boostsPerMonth: 0 },
  plus:    { maxAnnouncements: 2, maxPhotos: 5, boostsPerMonth: 0 },
  premium: { maxAnnouncements: 3, maxPhotos: 8, boostsPerMonth: 1 },
};

export const PLAN_FEATURES: Record<UserPlanType, string[]> = {
  free:    ['1 annonce active', '3 photos par annonce', 'Messagerie standard'],
  plus:    ['2 annonces actives', '5 photos par annonce', 'Voir les visiteurs de profil', 'Badge Plus', 'Filtres avancés'],
  premium: ['3 annonces actives', '8 photos par annonce', 'Badge Premium', 'Statistiques profil', '1 boost offert/mois', 'Mise en avant légère'],
};

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPlan(userId: string): Promise<{ plan: UserPlanType; planExpiresAt: Date | null; limits: typeof PLAN_LIMITS[UserPlanType] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const isExpired = user.planExpiresAt && user.planExpiresAt < new Date();
    const plan = isExpired ? 'free' : (user.plan as UserPlanType);

    if (isExpired && user.plan !== 'free') {
      await this.prisma.user.update({ where: { id: userId }, data: { plan: 'free', planExpiresAt: null } });
    }

    return { plan, planExpiresAt: user.planExpiresAt, limits: PLAN_LIMITS[plan] };
  }

  async checkAnnouncementLimit(userId: string): Promise<void> {
    const { plan, limits } = await this.getUserPlan(userId);
    const activeCount = await this.prisma.forumTopic.count({
      where: { authorId: userId, isAnnouncement: true, hiddenAt: null },
    });
    if (activeCount >= limits.maxAnnouncements) {
      throw new BadRequestException(
        `Votre plan ${plan} permet ${limits.maxAnnouncements} annonce${limits.maxAnnouncements > 1 ? 's' : ''} active${limits.maxAnnouncements > 1 ? 's' : ''}. Supprimez une annonce existante ou passez à un plan supérieur.`,
      );
    }
  }

  async boostTopic(topicId: string, userId: string): Promise<void> {
    const topic = await this.prisma.forumTopic.findFirst({
      where: { id: topicId, authorId: userId, isAnnouncement: true },
    });
    if (!topic) throw new BadRequestException('Annonce introuvable');

    const { plan } = await this.getUserPlan(userId);
    if (plan !== 'premium') {
      throw new BadRequestException('Le boost est réservé aux abonnés Premium.');
    }

    const boostExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.forumTopic.update({
      where: { id: topicId },
      data: { isBoosted: true, boostExpiresAt },
    });
  }

  async featureTopic(topicId: string, userId: string): Promise<void> {
    const topic = await this.prisma.forumTopic.findFirst({
      where: { id: topicId, authorId: userId, isAnnouncement: true },
    });
    if (!topic) throw new BadRequestException('Annonce introuvable');

    const { plan } = await this.getUserPlan(userId);
    if (plan === 'free') {
      throw new BadRequestException('La mise en avant est réservée aux abonnés Plus et Premium.');
    }

    const featuredExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.forumTopic.update({
      where: { id: topicId },
      data: { isFeatured: true, featuredExpiresAt },
    });
  }

  async expireBoosts(): Promise<void> {
    const now = new Date();
    await this.prisma.forumTopic.updateMany({
      where: { isBoosted: true, boostExpiresAt: { lt: now } },
      data: { isBoosted: false, boostExpiresAt: null },
    });
    await this.prisma.forumTopic.updateMany({
      where: { isFeatured: true, featuredExpiresAt: { lt: now } },
      data: { isFeatured: false, featuredExpiresAt: null },
    });
  }

  async getMyAnnouncementsCount(userId: string): Promise<{ used: number; max: number; plan: UserPlanType }> {
    const { plan, limits } = await this.getUserPlan(userId);
    const used = await this.prisma.forumTopic.count({
      where: { authorId: userId, isAnnouncement: true, hiddenAt: null },
    });
    return { used, max: limits.maxAnnouncements, plan };
  }

  async setPlan(userId: string, plan: UserPlanType, durationDays: number): Promise<void> {
    const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { plan, planExpiresAt },
    });
  }
}
