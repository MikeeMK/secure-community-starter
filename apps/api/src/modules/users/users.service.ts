import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        trustLevel: true,
        createdAt: true,
        forumTopics: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, createdAt: true },
        },
        forumPosts: {
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

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
