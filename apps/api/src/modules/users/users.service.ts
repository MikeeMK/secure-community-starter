import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeProfileRecord } from '../profile/profile.utils';

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
    return {
      ...user,
      profile: normalizeProfileRecord(user.profile),
    };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        email: true,
        trustLevel: true,
        createdAt: true,
        lastActiveAt: true,
        _count: { select: { forumTopics: true, forumPosts: true } },
      },
    });
  }

  async updateRole(id: string, trustLevel: 'new' | 'member' | 'moderator' | 'super_admin') {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { trustLevel },
      select: { id: true, displayName: true, trustLevel: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, trustLevel: true } });
    if (!user) throw new NotFoundException('User not found');
    if (user.trustLevel === 'super_admin') {
      throw new BadRequestException('Cannot delete a super_admin account');
    }
    // Delete in FK order
    await this.prisma.forumPost.deleteMany({ where: { authorId: id } });
    await this.prisma.forumTopic.deleteMany({ where: { authorId: id } });
    await this.prisma.report.deleteMany({ where: { reporterId: id } });
    await this.prisma.emailVerificationToken.deleteMany({ where: { userId: id } });
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
