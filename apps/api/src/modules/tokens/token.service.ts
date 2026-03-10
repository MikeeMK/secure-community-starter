import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const MILESTONES: Record<string, { amount: number; label: string }> = {
  email_verified:      { amount: 20,  label: 'Email vérifié' },
  profile_60:          { amount: 50,  label: 'Profil complété à 60%' },
  profile_100:         { amount: 100, label: 'Profil complété à 100%' },
  adult_verified:      { amount: 30,  label: 'Vérification adulte' },
  first_announcement:  { amount: 10,  label: 'Première annonce publiée' },
};

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<{ balance: number; awardedMilestones: string[] }> {
    const row = await this.prisma.tokenBalance.findUnique({ where: { userId } });
    return { balance: row?.balance ?? 0, awardedMilestones: row?.awardedMilestones ?? [] };
  }

  async getTransactions(userId: string) {
    return this.prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, amount: true, reason: true, createdAt: true },
    });
  }

  /** Award tokens unconditionally. */
  async award(userId: string, amount: number, reason: string) {
    await this.prisma.$transaction([
      this.prisma.tokenBalance.upsert({
        where: { userId },
        create: { userId, balance: amount, updatedAt: new Date() },
        update: { balance: { increment: amount }, updatedAt: new Date() },
      }),
      this.prisma.tokenTransaction.create({ data: { userId, amount, reason } }),
    ]);
  }

  /** Award a milestone once — no-op if already awarded. Returns true if awarded. */
  async awardMilestone(userId: string, milestone: string): Promise<boolean> {
    const row = await this.prisma.tokenBalance.findUnique({ where: { userId } });
    if (row?.awardedMilestones.includes(milestone)) return false;

    const def = MILESTONES[milestone];
    if (!def) return false;

    await this.prisma.$transaction([
      this.prisma.tokenBalance.upsert({
        where: { userId },
        create: { userId, balance: def.amount, awardedMilestones: [milestone], updatedAt: new Date() },
        update: {
          balance: { increment: def.amount },
          awardedMilestones: { push: milestone },
          updatedAt: new Date(),
        },
      }),
      this.prisma.tokenTransaction.create({ data: { userId, amount: def.amount, reason: def.label } }),
    ]);
    return true;
  }

  /** Spend tokens. Returns false if insufficient balance. */
  async spend(userId: string, amount: number, reason: string): Promise<boolean> {
    const row = await this.prisma.tokenBalance.findUnique({ where: { userId } });
    if (!row || row.balance < amount) return false;

    await this.prisma.$transaction([
      this.prisma.tokenBalance.update({
        where: { userId },
        data: { balance: { decrement: amount }, updatedAt: new Date() },
      }),
      this.prisma.tokenTransaction.create({ data: { userId, amount: -amount, reason } }),
    ]);
    return true;
  }
}
