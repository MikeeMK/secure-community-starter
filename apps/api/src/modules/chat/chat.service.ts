import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private sortIds(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  async findOrCreateConversation(initiatorId: string, targetId: string, announcementId?: string) {
    // Check if target has disabled chat requests
    const targetSettings = await this.prisma.userSettings.findUnique({
      where: { userId: targetId },
      select: { allowChat: true },
    });
    if (targetSettings && !targetSettings.allowChat) {
      throw new BadRequestException('Ce membre n\'accepte pas les demandes de contact pour le moment.');
    }

    const [user1Id, user2Id] = this.sortIds(initiatorId, targetId);

    const existing = await this.prisma.chatConversation.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      select: { id: true, announcementId: true },
    });

    if (existing) return { conversationId: existing.id, created: false };

    const conv = await this.prisma.chatConversation.create({
      data: { user1Id, user2Id, announcementId },
      select: { id: true },
    });

    // Notify the target user
    const initiator = await this.prisma.user.findUnique({
      where: { id: initiatorId },
      select: { displayName: true },
    });

    let message = `${initiator?.displayName ?? 'Quelqu\'un'} veut vous contacter`;
    if (announcementId) {
      const topic = await this.prisma.forumTopic.findUnique({
        where: { id: announcementId },
        select: { title: true },
      });
      if (topic) message += ` via votre annonce "${topic.title}"`;
    }

    await this.prisma.notification.create({
      data: {
        userId: targetId,
        message,
        link: `/messages?conv=${conv.id}`,
      },
    });

    return { conversationId: conv.id, created: true };
  }

  async listConversations(userId: string) {
    const convs = await this.prisma.chatConversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        announcementId: true,
        createdAt: true,
        user1: { select: { id: true, displayName: true } },
        user2: { select: { id: true, displayName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, read: true },
        },
      },
    });

    return convs.map((c) => {
      const other = c.user1.id === userId ? c.user2 : c.user1;
      const lastMsg = c.messages[0] ?? null;
      const unread = c.messages.filter((m) => !m.read && m.senderId !== userId).length;
      return { id: c.id, announcementId: c.announcementId, other, lastMsg, unread };
    });
  }

  async countUnread(userId: string): Promise<number> {
    const convs = await this.prisma.chatConversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: {
        messages: {
          where: { read: false, senderId: { not: userId } },
          select: { id: true },
        },
      },
    });
    return convs.reduce((sum, c) => sum + c.messages.length, 0);
  }

  async getMessages(conversationId: string, userId: string) {
    // Mark messages as read
    await this.prisma.chatMessage.updateMany({
      where: { conversationId, read: false, senderId: { not: userId } },
      data: { read: true },
    });

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        read: true,
        sender: { select: { id: true, displayName: true } },
      },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { conversationId, senderId, content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        read: true,
        sender: { select: { id: true, displayName: true } },
      },
    });
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { user1Id: true, user2Id: true },
    });
    if (!conv || (conv.user1Id !== userId && conv.user2Id !== userId)) {
      throw new BadRequestException('Conversation introuvable');
    }

    await this.prisma.chatMessage.deleteMany({ where: { conversationId } });
    await this.prisma.chatConversation.delete({ where: { id: conversationId } });
    return { success: true };
  }
}
