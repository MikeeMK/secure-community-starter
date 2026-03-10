import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { FeedbackService } from './feedback.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const CreateFeedbackDto = z.object({
  content: z.string().min(10).max(2000),
});

@Controller('/feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('/')
  async create(@Body() body: unknown, @Request() req: ExpressRequest) {
    const { content } = CreateFeedbackDto.parse(body);
    const user = req.user as AuthUser;
    return this.feedbackService.create(user.id, content);
  }

  @Get('/')
  @UseGuards(AdminGuard)
  async list() {
    return this.feedbackService.list();
  }
}
