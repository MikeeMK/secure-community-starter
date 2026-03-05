import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async listTopics() {
    return this.prisma.forumTopic.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }

  async getTopic(id: string) {
    return this.prisma.forumTopic.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
        posts: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, author: { select: { id: true, displayName: true } } },
        },
      },
    });
  }

  async createTopic(input: { authorId: string; title: string; body: string; groupId?: string }) {
    // NOTE: En prod, vérifier permissions + anti-spam + trust score + rate limits spécifiques.
    return this.prisma.forumTopic.create({
      data: {
        title: input.title,
        body: input.body,
        authorId: input.authorId,
        groupId: input.groupId ?? null,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }

  async createPost(input: { topicId: string; authorId: string; body: string }) {
    return this.prisma.forumPost.create({
      data: {
        body: input.body,
        topicId: input.topicId,
        authorId: input.authorId,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, displayName: true } },
      },
    });
  }
}
