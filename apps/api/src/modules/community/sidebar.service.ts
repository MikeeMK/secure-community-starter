import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SidebarService {
  constructor(private readonly prisma: PrismaService) {}

  async getSidebar() {
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const [onlineUsers, offlineUsers, newMembers, recentTopics, recentPosts, recentRegistrations] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { lastActiveAt: { gte: onlineThreshold } },
          select: { id: true, displayName: true, lastActiveAt: true, trustLevel: true },
          orderBy: { lastActiveAt: 'desc' },
          take: 20,
        }),
        this.prisma.user.findMany({
          where: {
            OR: [{ lastActiveAt: { lt: onlineThreshold } }, { lastActiveAt: null }],
          },
          select: { id: true, displayName: true, lastActiveAt: true, trustLevel: true },
          orderBy: { lastActiveAt: 'desc' },
          take: 20,
        }),
        this.prisma.user.findMany({
          select: { id: true, displayName: true, createdAt: true, trustLevel: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.forumTopic.findMany({
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, trustLevel: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.forumPost.findMany({
          select: {
            id: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, trustLevel: true } },
            topic: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.user.findMany({
          select: { id: true, displayName: true, createdAt: true, trustLevel: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    const activity = [
      ...recentTopics.map((t) => ({
        type: 'topic' as const,
        id: `topic-${t.id}`,
        actorId: t.author.id,
        actor: t.author.displayName,
        actorTrust: t.author.trustLevel,
        label: t.title,
        at: t.createdAt,
      })),
      ...recentPosts.map((p) => ({
        type: 'post' as const,
        id: `post-${p.id}`,
        actorId: p.author.id,
        actor: p.author.displayName,
        actorTrust: p.author.trustLevel,
        label: p.topic.title,
        at: p.createdAt,
      })),
      ...recentRegistrations.map((u) => ({
        type: 'register' as const,
        id: `reg-${u.id}`,
        actorId: u.id,
        actor: u.displayName,
        actorTrust: u.trustLevel,
        label: null,
        at: u.createdAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5);

    return { onlineUsers, offlineUsers, newMembers, activity };
  }
}
