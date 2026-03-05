import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const CreateReportDto = z.object({
  targetType: z.enum(['USER', 'TOPIC', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

@Controller('/moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly mod: ModerationService) {}

  /** Any authenticated user can file a report */
  @Post('/reports')
  async createReport(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = CreateReportDto.parse(body);
    const user = req.user as AuthUser;
    return this.mod.createReport({ ...dto, reporterId: user.id });
  }

  /** Only admins / trusted users can list reports */
  @Get('/reports')
  @UseGuards(AdminGuard)
  async listReports() {
    return this.mod.listReports();
  }
}
