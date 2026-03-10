import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { NewsService } from './news.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const NewsDto = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
});

const LinkFeedbacksDto = z.object({
  feedbackIds: z.array(z.string()),
});

@Controller('/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /** Public: published news for changelog */
  @Get('/published')
  async listPublished() {
    return this.newsService.listPublished();
  }

  /** Admin only below */
  @Get('/')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll() {
    return this.newsService.listAll();
  }

  @Post('/')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() body: unknown, @Request() req: ExpressRequest) {
    const { title, content } = NewsDto.parse(body);
    const user = req.user as AuthUser;
    return this.newsService.create(user.id, title, content);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() body: unknown) {
    const { title, content } = NewsDto.parse(body);
    return this.newsService.update(id, title, content);
  }

  @Post('/:id/publish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async publish(@Param('id') id: string) {
    return this.newsService.publish(id);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.newsService.delete(id);
  }

  @Post('/:id/link-feedbacks')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async linkFeedbacks(@Param('id') id: string, @Body() body: unknown) {
    const { feedbackIds } = LinkFeedbacksDto.parse(body);
    return this.newsService.linkFeedbacks(id, feedbackIds);
  }

  @Get('/:id/suggest-feedbacks')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async suggestFeedbacks(@Param('id') id: string) {
    return this.newsService.suggestFeedbacks(id);
  }
}
