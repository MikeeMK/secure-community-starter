import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  private async notifyStaff(message: string, link: string, roles: Array<'moderator' | 'super_admin'>) {
    const staff = await this.prisma.user.findMany({
      where: { trustLevel: { in: roles } },
      select: { id: true },
    });
    if (staff.length === 0) return;
    await this.prisma.notification.createMany({
      data: staff.map((u: (typeof staff)[number]) => ({ userId: u.id, message, link })),
      skipDuplicates: true,
    });
  }

  async createReport(input: {
    reporterId: string;
    targetType: 'USER' | 'TOPIC' | 'POST' | 'MESSAGE';
    targetId: string;
    reason: string;
  }) {
    const report = await this.prisma.report.create({
      data: {
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        status: 'OPEN',
      },
      select: { id: true, status: true, createdAt: true },
    });

    // Notify all staff (moderators + super_admins)
    this.notifyStaff(
      `Nouveau signalement : "${input.reason.slice(0, 60)}${input.reason.length > 60 ? '…' : ''}"`,
      '/admin/moderation',
    ['moderator', 'super_admin'],
    ).catch(() => {});

    return report;
  }

  async listReports() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        resolutionReason: true,
        rewardTokens: true,
        handledById: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
        reporter: { select: { id: true, displayName: true } },
      },
    });
  }

  async updateReport(input: {
    reportId: string;
    staffId: string;
    status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
    resolutionReason?: string | null;
    rewardTokens?: number;
  }) {
    const report = await this.prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const data: {
      status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
      handledById: string;
      resolutionReason: string | null;
      rewardTokens: number;
    } = {
      status: input.status,
      handledById: input.staffId,
      resolutionReason: input.resolutionReason ?? null,
      rewardTokens: input.rewardTokens ?? 0,
    };

    const updated = await this.prisma.report.update({
      where: { id: input.reportId },
      data,
      select: { id: true, status: true, reporterId: true, targetType: true, targetId: true, resolutionReason: true, rewardTokens: true },
    });

    // Notify reporter
    await this.prisma.notification.create({
      data: {
        userId: updated.reporterId,
        message:
          updated.status === 'RESOLVED'
            ? `Votre signalement a été accepté${updated.rewardTokens ? ` (+${updated.rewardTokens} tokens)` : ''}.`
            : updated.status === 'DISMISSED'
              ? 'Votre signalement a été rejeté.'
              : 'Votre signalement est en cours de traitement.',
        link: '/messagerie#notifications',
      },
    });

    // Award tokens if any
    if (updated.status === 'RESOLVED' && updated.rewardTokens && updated.rewardTokens > 0) {
      await this.tokens.award(updated.reporterId, updated.rewardTokens, 'Signalement validé');
    }

    return updated;
  }

  async getAlerts() {
    const [openReports, recentFeedbacks] = await Promise.all([
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.feedback.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return { openReports, recentFeedbacks };
  }
}
