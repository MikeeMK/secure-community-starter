import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeProfileRecord } from '../profile/profile.utils';
import { EmailService } from '../auth/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        trustLevel: true,
        accountStatus: true,
        createdAt: true,
        lastActiveAt: true,
        profile: {
          select: {
            age: true,
            city: true,
            gender: true,
            orientation: true,
            relationshipStatus: true,
            lookingFor: true,
            interactionType: true,
            interests: true,
            bio: true,
          },
        },
        forumTopics: {
          where: { hiddenAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, createdAt: true },
        },
        forumPosts: {
          where: { hiddenAt: null, topic: { hiddenAt: null } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            body: true,
            createdAt: true,
            topic: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!user || user.accountStatus === 'DELETED') throw new NotFoundException('User not found');

    const announcements = await this.prisma.forumTopic.findMany({
      where: { authorId: id, isAnnouncement: true, hiddenAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        category: true,
        region: true,
        createdAt: true,
        photos: true,
      },
    });

    return {
      ...user,
      profile: normalizeProfileRecord(user.profile),
      announcements,
    };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        trustLevel: true,
        accountStatus: true,
        moderationReason: true,
        suspendedUntil: true,
        canReRegisterAfter: true,
        moderatedAt: true,
        chatRestrictedUntil: true,
        chatRestrictionReason: true,
        publishRestrictedUntil: true,
        publishRestrictionReason: true,
        replyRestrictedUntil: true,
        replyRestrictionReason: true,
        createdAt: true,
        lastActiveAt: true,
        _count: { select: { forumTopics: true, forumPosts: true } },
      },
    });
  }

  async getAdminUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        trustLevel: true,
        accountStatus: true,
        moderationReason: true,
        suspendedUntil: true,
        canReRegisterAfter: true,
        moderatedAt: true,
        chatRestrictedUntil: true,
        chatRestrictionReason: true,
        publishRestrictedUntil: true,
        publishRestrictionReason: true,
        replyRestrictedUntil: true,
        replyRestrictionReason: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastActiveAt: true,
        profile: {
          select: {
            age: true,
            city: true,
            gender: true,
            orientation: true,
            relationshipStatus: true,
            lookingFor: true,
            interactionType: true,
            interests: true,
            bio: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const [
      tokenBalance,
      counts,
      announcements,
      topics,
      posts,
      reportsMade,
      reportsReceived,
    ] = await Promise.all([
      this.prisma.tokenBalance.findUnique({
        where: { userId: id },
        select: { balance: true, awardedMilestones: true, updatedAt: true },
      }),
      Promise.all([
        this.prisma.forumTopic.count({ where: { authorId: id, isAnnouncement: true } }),
        this.prisma.forumTopic.count({ where: { authorId: id, isAnnouncement: false } }),
        this.prisma.forumPost.count({ where: { authorId: id } }),
        this.prisma.report.count({ where: { reporterId: id } }),
        this.prisma.report.count({ where: { targetType: 'USER', targetId: id } }),
        this.prisma.report.count({ where: { targetType: 'USER', targetId: id, status: 'OPEN' } }),
        this.prisma.chatConversation.count({ where: { OR: [{ user1Id: id }, { user2Id: id }] } }),
      ]),
      this.prisma.forumTopic.findMany({
        where: { authorId: id, isAnnouncement: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          category: true,
          region: true,
          createdAt: true,
          _count: { select: { likes: true, favorites: true } },
        },
      }),
      this.prisma.forumTopic.findMany({
        where: { authorId: id, isAnnouncement: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          category: true,
          closed: true,
          createdAt: true,
          _count: { select: { posts: true, likes: true } },
        },
      }),
      this.prisma.forumPost.findMany({
        where: { authorId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          body: true,
          createdAt: true,
          topic: {
            select: {
              id: true,
              title: true,
              isAnnouncement: true,
            },
          },
        },
      }),
      this.prisma.report.findMany({
        where: { reporterId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          targetType: true,
          targetId: true,
          reason: true,
          createdAt: true,
          handledBy: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.report.findMany({
        where: { targetType: 'USER', targetId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          reason: true,
          resolutionReason: true,
          rewardTokens: true,
          createdAt: true,
          reporter: {
            select: {
              id: true,
              displayName: true,
            },
          },
          handledBy: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    return {
      ...user,
      profile: normalizeProfileRecord(user.profile),
      tokenBalance,
      stats: {
        announcements: counts[0],
        topics: counts[1],
        posts: counts[2],
        reportsMade: counts[3],
        reportsReceived: counts[4],
        openReportsReceived: counts[5],
        conversations: counts[6],
      },
      recentAnnouncements: announcements,
      recentTopics: topics,
      recentPosts: posts,
      reportsMade,
      reportsReceived,
      moderationActions: await this.prisma.moderationAction.findMany({
        where: { targetType: 'USER', targetId: id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          actionType: true,
          reason: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true } },
        },
      }),
    };
  }

  async updateRole(id: string, trustLevel: 'new' | 'member' | 'moderator' | 'super_admin', actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, trustLevel: true } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { trustLevel },
      select: { id: true, displayName: true, trustLevel: true },
    });

    await this.prisma.moderationAction.create({
      data: {
        actorId,
        actionType: 'UPDATE_ROLE',
        targetType: 'USER',
        targetId: id,
        reason: `Rôle changé de ${user.trustLevel} vers ${trustLevel}.`,
        metadata: { previousTrustLevel: user.trustLevel, nextTrustLevel: trustLevel },
      },
    });

    return updated;
  }

  async deleteUser(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, trustLevel: true, displayName: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.trustLevel === 'super_admin') {
      throw new BadRequestException('Cannot delete a super_admin account');
    }
    if (id === actorId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte via la modération.');
    }

    const now = new Date();
    const deletedEmail = `deleted+${id}@velentra.local`;
    await this.prisma.$transaction([
      this.prisma.forumTopic.updateMany({
        where: { authorId: id },
        data: {
          hiddenAt: now,
          hiddenReason: 'Contenu retiré suite à une suppression de compte.',
          closed: true,
        },
      }),
      this.prisma.forumPost.updateMany({
        where: { authorId: id },
        data: {
          hiddenAt: now,
          hiddenReason: 'Contenu retiré suite à une suppression de compte.',
        },
      }),
      this.prisma.userProfile.updateMany({
        where: { userId: id },
        data: {
          bio: null,
          city: null,
          age: null,
          gender: null,
          orientation: null,
          relationshipStatus: null,
          lookingFor: [],
          interactionType: [],
          ageMin: null,
          ageMax: null,
          interests: [],
        },
      }),
      this.prisma.user.update({
        where: { id },
        data: {
          displayName: 'Compte supprimé',
          email: deletedEmail,
          avatarUrl: null,
          passwordHash: `deleted:${id}:${now.getTime()}`,
          trustLevel: 'member',
          accountStatus: 'DELETED',
          moderationReason: 'Compte supprimé par l’équipe.',
          moderatedAt: now,
        },
      }),
      this.prisma.moderationAction.create({
        data: {
          actorId,
          actionType: 'DELETE_USER',
          targetType: 'USER',
          targetId: id,
          reason: `Suppression modérée du compte ${user.displayName}.`,
          metadata: { previousEmail: user.email },
        },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: id } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
    ]);
    return { success: true };
  }

  async sanctionUser(
    id: string,
    actorId: string,
    input: {
      action:
        | 'ACTIVATE'
        | 'SUSPEND_7D'
        | 'SUSPEND_30D'
        | 'BAN_30D'
        | 'BAN_PERMANENT'
        | 'MUTE_CHAT_7D'
        | 'BLOCK_PUBLISH_30D'
        | 'BLOCK_REPLY_30D'
        | 'CLEAR_RESTRICTIONS';
      reason: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        trustLevel: true,
        accountStatus: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.trustLevel === 'super_admin') {
      throw new BadRequestException('Cannot sanction a super_admin account');
    }
    if (id === actorId) {
      throw new BadRequestException('Vous ne pouvez pas vous sanctionner vous-même.');
    }

    const now = new Date();
    const data: {
      accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
      moderationReason: string | null;
      suspendedUntil: Date | null;
      canReRegisterAfter: Date | null;
      moderatedAt: Date | null;
      chatRestrictedUntil?: Date | null;
      chatRestrictionReason?: string | null;
      publishRestrictedUntil?: Date | null;
      publishRestrictionReason?: string | null;
      replyRestrictedUntil?: Date | null;
      replyRestrictionReason?: string | null;
    } = {
      accountStatus: 'ACTIVE',
      moderationReason: null,
      suspendedUntil: null,
      canReRegisterAfter: null,
      moderatedAt: null,
    };

    if (input.action === 'SUSPEND_7D') {
      data.accountStatus = 'SUSPENDED';
      data.moderationReason = input.reason;
      data.suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      data.moderatedAt = now;
    } else if (input.action === 'SUSPEND_30D') {
      data.accountStatus = 'SUSPENDED';
      data.moderationReason = input.reason;
      data.suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      data.moderatedAt = now;
    } else if (input.action === 'BAN_30D') {
      data.accountStatus = 'BANNED';
      data.moderationReason = input.reason;
      data.canReRegisterAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      data.moderatedAt = now;
    } else if (input.action === 'BAN_PERMANENT') {
      data.accountStatus = 'BANNED';
      data.moderationReason = input.reason;
      data.moderatedAt = now;
    } else if (input.action === 'MUTE_CHAT_7D') {
      data.chatRestrictedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      data.chatRestrictionReason = input.reason;
      data.moderatedAt = now;
    } else if (input.action === 'BLOCK_PUBLISH_30D') {
      data.publishRestrictedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      data.publishRestrictionReason = input.reason;
      data.moderatedAt = now;
    } else if (input.action === 'BLOCK_REPLY_30D') {
      data.replyRestrictedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      data.replyRestrictionReason = input.reason;
      data.moderatedAt = now;
    } else if (input.action === 'CLEAR_RESTRICTIONS') {
      data.chatRestrictedUntil = null;
      data.chatRestrictionReason = null;
      data.publishRestrictedUntil = null;
      data.publishRestrictionReason = null;
      data.replyRestrictedUntil = null;
      data.replyRestrictionReason = null;
      data.moderatedAt = now;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        displayName: true,
        email: true,
        accountStatus: true,
        moderationReason: true,
        suspendedUntil: true,
        canReRegisterAfter: true,
        moderatedAt: true,
        chatRestrictedUntil: true,
        chatRestrictionReason: true,
        publishRestrictedUntil: true,
        publishRestrictionReason: true,
        replyRestrictedUntil: true,
        replyRestrictionReason: true,
      },
    });

    await this.prisma.moderationAction.create({
      data: {
        actorId,
        actionType: input.action,
        targetType: 'USER',
        targetId: id,
        reason: input.reason,
        metadata: {
          accountStatus: updated.accountStatus,
          suspendedUntil: updated.suspendedUntil,
          canReRegisterAfter: updated.canReRegisterAfter,
          chatRestrictedUntil: updated.chatRestrictedUntil,
          publishRestrictedUntil: updated.publishRestrictedUntil,
          replyRestrictedUntil: updated.replyRestrictedUntil,
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: id,
        title:
          input.action === 'ACTIVATE'
            ? 'Compte réactivé'
            : updated.accountStatus === 'SUSPENDED'
              ? 'Compte suspendu'
              : input.action === 'MUTE_CHAT_7D'
                ? 'Messagerie restreinte'
                : input.action === 'BLOCK_PUBLISH_30D'
                  ? 'Publication restreinte'
                  : input.action === 'BLOCK_REPLY_30D'
                    ? 'Réponses restreintes'
                    : 'Décision de modération',
        content:
          input.action === 'ACTIVATE'
            ? 'Votre accès a été rétabli. Merci de respecter les règles de la communauté.'
            : updated.accountStatus === 'SUSPENDED'
              ? `Votre compte a été suspendu. Motif: ${input.reason}`
              : input.action === 'MUTE_CHAT_7D'
                ? `Votre accès à la messagerie a été restreint temporairement. Motif: ${input.reason}`
                : input.action === 'BLOCK_PUBLISH_30D'
                  ? `Votre droit de publication a été restreint temporairement. Motif: ${input.reason}`
                  : input.action === 'BLOCK_REPLY_30D'
                    ? `Votre droit de réponse a été restreint temporairement. Motif: ${input.reason}`
                    : `Une décision de modération a été prise sur votre compte. Motif: ${input.reason}`,
        message:
          input.action === 'ACTIVATE'
            ? 'Votre compte a été réactivé par l’équipe.'
            : updated.accountStatus === 'SUSPENDED'
              ? 'Votre compte a été suspendu par l’équipe.'
              : input.action === 'MUTE_CHAT_7D'
                ? 'Votre accès à la messagerie a été restreint.'
                : input.action === 'BLOCK_PUBLISH_30D'
                  ? 'Votre droit de publication a été restreint.'
                  : input.action === 'BLOCK_REPLY_30D'
                    ? 'Votre droit de réponse a été restreint.'
              : 'Votre compte a fait l’objet d’une sanction de modération.',
        link: '/dashboard',
      },
    }).catch(() => {});

    this.email.sendModerationNoticeEmail(
      user.email,
      input.action === 'ACTIVATE' ? 'Votre compte a été réactivé' : 'Décision de modération sur votre compte',
      input.action === 'ACTIVATE'
        ? 'Votre accès a été rétabli. Merci de respecter les règles de la communauté.'
        : updated.accountStatus === 'SUSPENDED'
          ? `Votre compte a été suspendu. Motif: ${input.reason}`
          : input.action === 'MUTE_CHAT_7D'
            ? `Votre accès à la messagerie a été suspendu temporairement. Motif: ${input.reason}`
            : input.action === 'BLOCK_PUBLISH_30D'
              ? `Votre droit de publier a été suspendu temporairement. Motif: ${input.reason}`
              : input.action === 'BLOCK_REPLY_30D'
                ? `Votre droit de répondre a été suspendu temporairement. Motif: ${input.reason}`
          : `Votre compte a été sanctionné. Motif: ${input.reason}`,
    ).catch(() => {});

    return updated;
  }
}
