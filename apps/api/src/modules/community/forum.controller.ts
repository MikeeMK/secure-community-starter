import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { ForumService } from './forum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SafeUser } from '../auth/user.select';

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

  private getUser(req: ExpressRequest): SafeUser {
    return req.user as SafeUser;
  }

  @Get('/topics')
  async listTopics() {
    return this.forum.listTopics();
  }

  @Get('/topics/:id')
  async getTopic(@Param('id') id: string) {
    return this.forum.getTopic(id);
  }

  @Post('/topics')
  async createTopic(@Request() req: ExpressRequest, @Body() body: unknown) {
    const dto = CreateTopicDto.parse(body);
    const user = this.getUser(req);
    return this.forum.createTopic({ authorId: user.id, ...dto });
  }

  @Post('/topics/:topicId/posts')
  async createPost(@Request() req: ExpressRequest, @Param('topicId') topicId: string, @Body() body: unknown) {
    const dto = CreatePostDto.parse(body);
    const user = this.getUser(req);
    return this.forum.createPost({ topicId, authorId: user.id, ...dto });
  }
}
