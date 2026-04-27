import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { ForumService } from './forum.service';

type AuthUser = { id: string; email: string; trustLevel: string };

const ANNOUNCEMENT_CATEGORIES = ['Amitié', 'Activités', 'Rencontre adulte', 'Autre'] as const;

const CreateTopicDto = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(1).max(20_000),
  groupId: z.string().optional(),
  isAnnouncement: z.boolean().optional(),
  category: z.enum(ANNOUNCEMENT_CATEGORIES).optional(),
  region: z.string().max(100).optional(),
  photos: z.array(z.string().min(1)).max(5).optional(), // base64 or URLs
});

const UpdateTopicDto = z.object({
  title: z.string().min(3).max(120).optional(),
  body: z.string().min(1).max(20_000).optional(),
  category: z.string().max(100).optional(),
  region: z.string().max(100).nullable().optional(),
  closed: z.boolean().optional(),
});

const CreatePostDto = z.object({
  body: z.string().min(1).max(20_000),
});

const UpdatePostDto = z.object({
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

  @Get('/annonces')
  @UseGuards(OptionalJwtAuthGuard)
  async listAnnouncements(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('search') search?: string,
    @Request() req?: ExpressRequest,
  ) {
    const userId = (req?.user as AuthUser | undefined)?.id;
    return this.forum.listAnnouncements({ category, region, search, userId });
  }

  @Post('/topics/:id/favorite')
  async toggleFavorite(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.toggleFavorite(id, user.id);
  }

  @Get('/favorites')
  async listFavorites(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.listFavorites(user.id);
  }

  @Get('/favorites/received')
  async listFavoritesReceived(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.listFavoritesReceived(user.id);
  }

  @Get('/topics/my-announcements')
  async myAnnouncements(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.listMyAnnouncements(user.id);
  }

  @Get('/topics/:id')
  async getTopic(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const topic = await this.forum.getTopic(id);
    if (!topic) throw new NotFoundException('Topic not found');
    const liked = await this.forum.isLikedBy(id, user.id);
    return { ...topic, liked };
  }

  @Post('/topics')
  async createTopic(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = CreateTopicDto.parse(body);
    const user = req.user as AuthUser;
    return this.forum.createTopic({ ...dto, authorId: user.id });
  }

  @Patch('/topics/:id')
  async updateTopic(@Param('id') id: string, @Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = UpdateTopicDto.parse(body);
    const user = req.user as AuthUser;
    return this.forum.updateTopic(id, user.id, user.trustLevel, dto);
  }

  @Delete('/topics/:id')
  async deleteTopic(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.deleteTopic(id, user.id, user.trustLevel);
  }

  @Post('/topics/:id/like')
  async toggleLike(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.toggleLike(id, user.id);
  }

  @Get('/topics/:id/likes')
  async getTopicLikes(@Param('id') id: string) {
    return this.forum.getTopicLikes(id);
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

  @Patch('/posts/:id')
  async updatePost(@Param('id') id: string, @Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = UpdatePostDto.parse(body);
    const user = req.user as AuthUser;
    return this.forum.updatePost(id, user.id, user.trustLevel, dto.body);
  }

  @Delete('/posts/:id')
  async deletePost(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.forum.deletePost(id, user.id, user.trustLevel);
  }
}
