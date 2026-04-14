import { Controller, Get, Patch, Param, UseGuards, Request, Delete, Body } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = { id: string; trustLevel?: string };

function isStaff(trustLevel?: string) {
  return trustLevel === 'moderator' || trustLevel === 'super_admin';
}

@Controller('/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/')
  async list(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, message: true, title: true, content: true, link: true, read: true, createdAt: true },
    });

    const canAccessStaffLinks = isStaff(user.trustLevel);
    return notifications.map((notification) => ({
      ...notification,
      link:
        !canAccessStaffLinks && notification.link?.startsWith('/admin/')
          ? '/messagerie#notifications'
          : notification.link,
    }));
  }

  @Patch('/read-all')
  async readAll(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    await this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  @Patch('/:id/read')
  async readOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    return { success: true };
  }

  @Delete('/:id')
  async deleteOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    await this.prisma.notification.deleteMany({ where: { id, userId: user.id } });
    return { success: true };
  }

  @Delete('/')
  async deleteMany(@Body() body: { ids?: string[] }, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const ids = body?.ids ?? [];
    if (ids.length === 0) return { success: true, deleted: 0 };
    const res = await this.prisma.notification.deleteMany({ where: { userId: user.id, id: { in: ids } } });
    return { success: true, deleted: res.count };
  }
}
