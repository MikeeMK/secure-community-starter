import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';

export const REPORT_REWARD_TOKENS = 20;

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
      data: staff.map((u: (typeof staff)[number]) => ({
        userId: u.id,
        message,
        title: 'Alerte modération',
        content: message,
        link,
      })),
      skipDuplicates: true,
    });
  }

  private async createUserNotification(input: {
    userId: string;
    title: string;
    content: string;
    link?: string | null;
  }) {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        message: input.title,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
      },
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

  async listReports(opts?: { archived?: boolean }) {
    return this.prisma.report.findMany({
      where: opts?.archived ? { archivedAt: { not: null } } : { archivedAt: null },
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
        archivedAt: true,
        reporter: { select: { id: true, displayName: true } },
      },
    });
  }

  async listActions() {
    return this.prisma.moderationAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        actionType: true,
        targetType: true,
        targetId: true,
        reason: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            displayName: true,
            trustLevel: true,
          },
        },
      },
    });
  }

  async getReportDetail(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        reason: true,
        targetType: true,
        targetId: true,
        resolutionReason: true,
        rewardTokens: true,
        createdAt: true,
        archivedAt: true,
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            trustLevel: true,
            createdAt: true,
            lastActiveAt: true,
          },
        },
        handledBy: {
          select: {
            id: true,
            displayName: true,
            trustLevel: true,
          },
        },
      },
    });

    if (!report) throw new NotFoundException('Report not found');

    const recentRelated = await this.prisma.report.findMany({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        id: { not: report.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        reporter: { select: { id: true, displayName: true } },
      },
    });

    let target: Record<string, unknown> | null = null;

    if (report.targetType === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          trustLevel: true,
          emailVerifiedAt: true,
          createdAt: true,
          lastActiveAt: true,
          profile: {
            select: {
              city: true,
              age: true,
              bio: true,
            },
          },
          _count: {
            select: {
              forumTopics: true,
              forumPosts: true,
              reportsMade: true,
            },
          },
        },
      });

      target = user ? { type: 'USER', exists: true, user } : { type: 'USER', exists: false };
    }

    if (report.targetType === 'TOPIC') {
      const topic = await this.prisma.forumTopic.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          title: true,
          body: true,
          isAnnouncement: true,
          category: true,
          region: true,
          photos: true,
          closed: true,
          hiddenAt: true,
          hiddenReason: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              displayName: true,
              trustLevel: true,
            },
          },
          _count: {
            select: {
              posts: true,
              likes: true,
              favorites: true,
            },
          },
        },
      });

      target = topic ? { type: 'TOPIC', exists: true, topic } : { type: 'TOPIC', exists: false };
    }

    if (report.targetType === 'POST') {
      const post = await this.prisma.forumPost.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          body: true,
          hiddenAt: true,
          hiddenReason: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              displayName: true,
              trustLevel: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              isAnnouncement: true,
              category: true,
              closed: true,
              author: {
                select: {
                  id: true,
                  displayName: true,
                  trustLevel: true,
                },
              },
            },
          },
        },
      });

      target = post ? { type: 'POST', exists: true, post } : { type: 'POST', exists: false };
    }

    if (report.targetType === 'MESSAGE') {
      const message = await this.prisma.chatMessage.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          content: true,
          read: true,
          hiddenAt: true,
          hiddenReason: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              displayName: true,
              trustLevel: true,
            },
          },
          conversation: {
            select: {
              id: true,
              announcementId: true,
              user1: { select: { id: true, displayName: true } },
              user2: { select: { id: true, displayName: true } },
            },
          },
        },
      });

      target = message ? { type: 'MESSAGE', exists: true, message } : { type: 'MESSAGE', exists: false };
    }

    return {
      ...report,
      target,
      recentRelated,
    };
  }

  async updateReport(input: {
    reportId: string;
    staffId: string;
    decision: 'IN_REVIEW' | 'DISMISS' | 'REWARD';
    resolutionReason?: string | null;
  }) {
    const report = await this.prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const nextStatus =
      input.decision === 'REWARD'
        ? 'RESOLVED'
        : input.decision === 'DISMISS'
          ? 'DISMISSED'
          : 'IN_REVIEW';
    const rewardTokens = input.decision === 'REWARD' ? REPORT_REWARD_TOKENS : 0;
    const archivedAt = input.decision === 'REWARD' ? new Date() : null;

    const data: {
      status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
      handledById: string;
      resolutionReason: string | null;
      rewardTokens: number;
      archivedAt: Date | null;
      archivedById: string | null;
    } = {
      status: nextStatus,
      handledById: input.staffId,
      resolutionReason: input.resolutionReason ?? null,
      rewardTokens,
      archivedAt,
      archivedById: input.decision === 'REWARD' ? input.staffId : null,
    };

    const updated = await this.prisma.report.update({
      where: { id: input.reportId },
      data,
      select: {
        id: true,
        status: true,
        reporterId: true,
        targetType: true,
        targetId: true,
        resolutionReason: true,
        rewardTokens: true,
        archivedAt: true,
      },
    });

    if (updated.status === 'RESOLVED') {
      await this.createUserNotification({
        userId: updated.reporterId,
        title: `Votre signalement a été accepté (+${updated.rewardTokens} tokens)`,
        content:
          `L’équipe Velentra vous remercie pour votre signalement. Après vérification, il a été accepté et ${updated.rewardTokens} tokens ont été ajoutés à votre compte.` +
          (updated.resolutionReason ? `\n\nMotif staff: ${updated.resolutionReason}` : ''),
        link: '/messagerie#notifications',
      });
    } else if (updated.status === 'DISMISSED') {
      await this.createUserNotification({
        userId: updated.reporterId,
        title: 'Votre signalement a été classé sans suite',
        content:
          'L’équipe Velentra a bien examiné votre signalement, mais il n’a pas donné lieu à une validation pour le moment.' +
          (updated.resolutionReason ? `\n\nMotif staff: ${updated.resolutionReason}` : ''),
        link: '/messagerie#notifications',
      });
    } else {
      await this.createUserNotification({
        userId: updated.reporterId,
        title: 'Votre signalement est en cours de traitement',
        content:
          'L’équipe Velentra examine actuellement votre signalement. Vous serez notifié dès qu’une décision aura été prise.',
        link: '/messagerie#notifications',
      });
    }

    // Award tokens if any
    if (updated.status === 'RESOLVED' && updated.rewardTokens && updated.rewardTokens > 0) {
      await this.tokens.award(updated.reporterId, updated.rewardTokens, 'Signalement validé');
    }

    await this.prisma.moderationAction.create({
      data: {
        actorId: input.staffId,
        actionType: input.decision === 'REWARD' ? 'REPORT_REWARDED' : `REPORT_${updated.status}`,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: input.resolutionReason ?? report.reason,
        metadata: {
          reportId: report.id,
          rewardTokens: updated.rewardTokens,
          archivedAt: updated.archivedAt,
        },
      },
    });

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

  async applyContentAction(input: {
    staffId: string;
    action: 'HIDE_TOPIC' | 'RESTORE_TOPIC' | 'HIDE_POST' | 'RESTORE_POST' | 'HIDE_MESSAGE' | 'RESTORE_MESSAGE' | 'REMOVE_AVATAR' | 'CLEAR_BIO';
    targetId: string;
    reason: string;
  }) {
    const now = new Date();

    if (input.action === 'HIDE_TOPIC') {
      const topic = await this.prisma.forumTopic.findUnique({
        where: { id: input.targetId },
        select: { id: true, title: true },
      });
      if (!topic) throw new NotFoundException('Topic not found');

      await this.prisma.$transaction([
        this.prisma.forumTopic.update({
          where: { id: input.targetId },
          data: { hiddenAt: now, hiddenReason: input.reason, closed: true },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'TOPIC',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);

      return { success: true, targetType: 'TOPIC', targetId: input.targetId, hidden: true };
    }

    if (input.action === 'RESTORE_TOPIC') {
      await this.prisma.$transaction([
        this.prisma.forumTopic.update({
          where: { id: input.targetId },
          data: { hiddenAt: null, hiddenReason: null },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'TOPIC',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'TOPIC', targetId: input.targetId, hidden: false };
    }

    if (input.action === 'HIDE_POST') {
      const post = await this.prisma.forumPost.findUnique({
        where: { id: input.targetId },
        select: { id: true },
      });
      if (!post) throw new NotFoundException('Post not found');

      await this.prisma.$transaction([
        this.prisma.forumPost.update({
          where: { id: input.targetId },
          data: { hiddenAt: now, hiddenReason: input.reason },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'POST',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'POST', targetId: input.targetId, hidden: true };
    }

    if (input.action === 'RESTORE_POST') {
      await this.prisma.$transaction([
        this.prisma.forumPost.update({
          where: { id: input.targetId },
          data: { hiddenAt: null, hiddenReason: null },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'POST',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'POST', targetId: input.targetId, hidden: false };
    }

    if (input.action === 'HIDE_MESSAGE') {
      const message = await this.prisma.chatMessage.findUnique({
        where: { id: input.targetId },
        select: { id: true },
      });
      if (!message) throw new NotFoundException('Message not found');

      await this.prisma.$transaction([
        this.prisma.chatMessage.update({
          where: { id: input.targetId },
          data: { hiddenAt: now, hiddenReason: input.reason },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'MESSAGE',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'MESSAGE', targetId: input.targetId, hidden: true };
    }

    if (input.action === 'RESTORE_MESSAGE') {
      await this.prisma.$transaction([
        this.prisma.chatMessage.update({
          where: { id: input.targetId },
          data: { hiddenAt: null, hiddenReason: null },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'MESSAGE',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'MESSAGE', targetId: input.targetId, hidden: false };
    }

    if (input.action === 'REMOVE_AVATAR') {
      const user = await this.prisma.user.findUnique({
        where: { id: input.targetId },
        select: { id: true, avatarUrl: true },
      });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: input.targetId },
          data: { avatarUrl: null },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'USER',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'USER', targetId: input.targetId, avatarRemoved: true };
    }

    if (input.action === 'CLEAR_BIO') {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId: input.targetId },
        select: { userId: true },
      });
      if (!profile) throw new NotFoundException('Profile not found');

      await this.prisma.$transaction([
        this.prisma.userProfile.update({
          where: { userId: input.targetId },
          data: { bio: null },
        }),
        this.prisma.moderationAction.create({
          data: {
            actorId: input.staffId,
            actionType: input.action,
            targetType: 'USER',
            targetId: input.targetId,
            reason: input.reason,
          },
        }),
      ]);
      return { success: true, targetType: 'USER', targetId: input.targetId, bioCleared: true };
    }

    throw new NotFoundException('Unsupported action');
  }
}
