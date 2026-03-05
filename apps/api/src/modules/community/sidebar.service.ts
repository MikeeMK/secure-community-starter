import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SidebarService {
  constructor(private readonly prisma: PrismaService) {}

  async getSidebar() {
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const [onlineUsers, newMembers, recentTopics, recentPosts, recentRegistrations] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { lastActiveAt: { gte: onlineThreshold } },
          select: { id: true, displayName: true, lastActiveAt: true },
          orderBy: { lastActiveAt: 'desc' },
          take: 20,
        }),
        this.prisma.user.findMany({
          select: { id: true, displayName: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.forumTopic.findMany({
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { id: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.forumPost.findMany({
          select: {
            id: true,
            createdAt: true,
            author: { select: { id: true, displayName: true } },
            topic: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.user.findMany({
          select: { id: true, displayName: true, createdAt: true },
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
        label: t.title,
        at: t.createdAt,
      })),
      ...recentPosts.map((p) => ({
        type: 'post' as const,
        id: `post-${p.id}`,
        actorId: p.author.id,
        actor: p.author.displayName,
        label: p.topic.title,
        at: p.createdAt,
      })),
      ...recentRegistrations.map((u) => ({
        type: 'register' as const,
        id: `reg-${u.id}`,
        actorId: u.id,
        actor: u.displayName,
        label: null,
        at: u.createdAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5);

    return { onlineUsers, newMembers, activity };
  }
}
