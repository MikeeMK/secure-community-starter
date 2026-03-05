import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ForumService } from './forum.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const CreateTopicDto = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(1).max(20_000),
  groupId: z.string().optional(),
});

const CreatePostDto = z.object({
  body: z.string().min(1).max(20_000),
});

@Controller('/community/forum')
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Get('/topics')
  async listTopics() {
    return this.forum.listTopics();
  }

  @Get('/topics/:id')
  async getTopic(@Param('id') id: string) {
    const topic = await this.forum.getTopic(id);
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  @Post('/topics')
  async createTopic(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = CreateTopicDto.parse(body);
    const user = req.user as AuthUser;
    return this.forum.createTopic({ ...dto, authorId: user.id });
  }

  @Post('/topics/:topicId/posts')
  async createPost(
    @Param('topicId') topicId: string,
    @Body() body: unknown,
    @Request() req: ExpressRequest,
  ) {
    const dto = CreatePostDto.parse(body);
    const user = req.user as AuthUser;
    return this.forum.createPost({ topicId, body: dto.body, authorId: user.id });
  }
}
