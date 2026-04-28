import { BadRequestException, Body, Controller, ForbiddenException, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const CreateReportDto = z.object({
  targetType: z.enum(['USER', 'TOPIC', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

const UpdateReportDto = z.object({
  decision: z.enum(['IN_REVIEW', 'DISMISS', 'REWARD']),
  resolutionReason: z.string().max(500).optional(),
});

const ContentActionDto = z.object({
  action: z.enum(['HIDE_TOPIC', 'RESTORE_TOPIC', 'HIDE_POST', 'RESTORE_POST', 'HIDE_MESSAGE', 'RESTORE_MESSAGE', 'REMOVE_AVATAR', 'CLEAR_BIO']),
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

  /** Staff (moderator+) can list reports */
  @Get('/reports')
  @UseGuards(StaffGuard)
  async listReports(@Request() req: ExpressRequest, @Query('archived') archived?: string) {
    const staff = req.user as AuthUser;
    const wantsArchived = archived === 'true';
    if (wantsArchived && staff.trustLevel !== 'super_admin') {
      throw new ForbiddenException('Archives réservées au super admin.');
    }
    return this.mod.listReports({ archived: wantsArchived });
  }

  @Get('/actions')
  @UseGuards(StaffGuard)
  async listActions() {
    return this.mod.listActions();
  }

  @Get('/reports/:id')
  @UseGuards(StaffGuard)
  async getReportDetail(@Request() req: ExpressRequest) {
    return this.mod.getReportDetail((req.params as { id: string }).id);
  }

  @Post('/reports/:id')
  @UseGuards(StaffGuard)
  async updateReport(@Request() req: ExpressRequest, @Body() body: unknown) {
    const dto = UpdateReportDto.parse(body);
    const staff = req.user as AuthUser;
    return this.mod.updateReport({
      reportId: (req.params as { id: string }).id,
      staffId: staff.id,
      decision: dto.decision,
      resolutionReason: dto.resolutionReason,
    });
  }

  @Post('/content-actions')
  @UseGuards(StaffGuard)
  async applyContentAction(@Request() req: ExpressRequest, @Body() body: unknown) {
    const dto = ContentActionDto.parse(body);
    const staff = req.user as AuthUser;
    return this.mod.applyContentAction({
      staffId: staff.id,
      action: dto.action,
      targetId: dto.targetId,
      reason: dto.reason,
    });
  }

  /** Staff initiates a moderation chat for a report */
  @Post('/reports/:id/chat')
  @UseGuards(StaffGuard)
  async initiateModerationChat(@Request() req: ExpressRequest) {
    const staff = req.user as AuthUser;
    return this.mod.initiateModerationChat((req.params as { id: string }).id, staff.id);
  }

  /** Get moderation chat for a report (staff or reporter) */
  @Get('/reports/:id/chat')
  @UseGuards(JwtAuthGuard)
  async getModerationChat(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const chat = await this.mod.getModerationChatByReport((req.params as { id: string }).id, user.id);
    if (!chat) return null;
    // Only staff or the reporter can access
    if (chat.staff.id !== user.id && chat.reporter.id !== user.id) {
      throw new ForbiddenException('Accès non autorisé.');
    }
    return chat;
  }

  /** Send a message in a moderation chat */
  @Post('/chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  async sendModerationChatMessage(@Request() req: ExpressRequest, @Body() body: unknown) {
    const user = req.user as AuthUser;
    const { content } = (body as { content?: string });
    if (!content || content.trim().length < 1) throw new BadRequestException('Message vide.');
    return this.mod.sendModerationChatMessage((req.params as { chatId: string }).chatId, user.id, content.trim());
  }

  /** Close a moderation chat (staff only) */
  @Post('/chats/:chatId/close')
  @UseGuards(StaffGuard)
  async closeModerationChat(@Request() req: ExpressRequest) {
    const staff = req.user as AuthUser;
    return this.mod.closeModerationChat((req.params as { chatId: string }).chatId, staff.id);
  }

  /** Get current user's moderation chats (for messagerie Dossiers tab) */
  @Get('/my-chats')
  @UseGuards(JwtAuthGuard)
  async listMyModerationChats(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.mod.listUserModerationChats(user.id);
  }

  /** Staff (moderator+) can poll alert counts */
  @Get('/alerts')
  @UseGuards(StaffGuard)
  async getAlerts() {
    return this.mod.getAlerts();
  }
}
