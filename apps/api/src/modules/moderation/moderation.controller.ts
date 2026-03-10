import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard, StaffGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const CreateReportDto = z.object({
  targetType: z.enum(['USER', 'TOPIC', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

const UpdateReportDto = z.object({
  status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
  resolutionReason: z.string().max(500).optional(),
  rewardTokens: z.number().int().min(0).max(1000).optional(),
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

  @Post('/reports/:id')
  @UseGuards(StaffGuard)
  async updateReport(@Request() req: ExpressRequest, @Body() body: unknown) {
    const dto = UpdateReportDto.parse(body);
    const staff = req.user as AuthUser;
    return this.mod.updateReport({
      reportId: (req.params as { id: string }).id,
      staffId: staff.id,
      status: dto.status,
      resolutionReason: dto.resolutionReason,
      rewardTokens: dto.rewardTokens ?? 0,
    });
  }

  /** Staff (moderator+) can poll alert counts */
  @Get('/alerts')
  @UseGuards(StaffGuard)
  async getAlerts() {
    return this.mod.getAlerts();
  }
}
