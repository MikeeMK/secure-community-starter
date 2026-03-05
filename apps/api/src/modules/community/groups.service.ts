import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async listGroups() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        createdAt: true,
        _count: { select: { topics: true } },
      },
    });
  }

  async getGroup(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        createdAt: true,
        topics: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, trustLevel: true } },
          },
        },
      },
    });
  }
}
