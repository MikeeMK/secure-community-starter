import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';

const isStaff = (level?: string | null) => ['moderator', 'super_admin'].includes(level ?? '');
const normalizeCategory = (cat?: string | null) => (cat === 'Rencontre' ? 'Rencontre adulte' : cat ?? 'Autre');

function calcProfileCompletion(emailVerifiedAt: Date | null, p: Record<string, unknown> | null): number {
  const checks = [
    !!emailVerifiedAt,
    !!(p?.age),
    !!(p?.city),
    !!(p?.gender),
    !!(p?.orientation),
    !!(p?.bio && (p.bio as string).length > 10),
    ((p?.interests as string[])?.length ?? 0) >= 3,
    ((p?.lookingFor as string[])?.length ?? 0) > 0,
  ];
  const weights = [20, 10, 10, 10, 10, 15, 15, 10];
  return checks.reduce((sum, c, i) => sum + (c ? weights[i] : 0), 0);
}

@Injectable()
export class ForumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async listTopics() {
    const topics = await this.prisma.forumTopic.findMany({
      where: { isAnnouncement: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        category: true,
        closed: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
        _count: { select: { posts: true } },
      },
    });
    return topics.map((t: (typeof topics)[number]) => ({ ...t, category: normalizeCategory(t.category) }));
  }

  async listAnnouncements(opts: { category?: string; region?: string; search?: string; userId?: string }) {
    const { category, region, search, userId } = opts;
    const where: Record<string, unknown> = { isAnnouncement: true };
    if (category) where['category'] = category;
    if (region) where['region'] = region;
    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }
    const topics = await this.prisma.forumTopic.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        region: true,
        photos: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        _count: { select: { likes: true } },
        ...(userId ? { favorites: { where: { userId }, select: { userId: true } } } : {}),
      },
    });
    return topics.map((t: (typeof topics)[number]) => ({
      ...t,
      category: normalizeCategory(t.category),
      isFavorited: userId ? ((t as { favorites?: { userId: string }[] }).favorites?.length ?? 0) > 0 : false,
      favorites: undefined,
    }));
  }

  async listMyAnnouncements(userId: string) {
    const topics = await this.prisma.forumTopic.findMany({
      where: { authorId: userId, isAnnouncement: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        region: true,
        photos: true,
        createdAt: true,
        likes: {
          select: { userId: true, user: { select: { id: true, displayName: true } } },
        },
        _count: { select: { likes: true } },
      },
    });
    return topics.map((t: (typeof topics)[number]) => ({ ...t, category: normalizeCategory(t.category) }));
  }

  async getTopic(id: string) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        isAnnouncement: true,
        category: true,
        closed: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
        _count: { select: { likes: true } },
        posts: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, author: { select: { id: true, displayName: true, trustLevel: true } } },
        },
      },
    });
    return topic ? { ...topic, category: normalizeCategory(topic.category) } : null;
  }

  async toggleFavorite(topicId: string, userId: string) {
    const existing = await this.prisma.announcementFavorite.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });
    if (existing) {
      await this.prisma.announcementFavorite.delete({ where: { userId_topicId: { userId, topicId } } });
      return { favorited: false };
    } else {
      await this.prisma.announcementFavorite.create({ data: { userId, topicId } });
      return { favorited: true };
    }
  }

  async listFavorites(userId: string) {
    const favs = await this.prisma.announcementFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        topic: {
          select: {
            id: true,
            title: true,
            body: true,
            category: true,
            region: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, trustLevel: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });
    return favs.map((f: (typeof favs)[number]) => ({ ...f.topic, isFavorited: true }));
  }

  async listFavoritesReceived(authorId: string) {
    const favs = await this.prisma.announcementFavorite.findMany({
      where: {
        topic: { authorId, isAnnouncement: true },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        user: { select: { id: true, displayName: true, trustLevel: true } },
        topic: { select: { id: true, title: true } },
        createdAt: true,
      },
      take: 20,
    });
    return favs;
  }

  async createTopic(input: {
    authorId: string;
    title: string;
    body: string;
    groupId?: string;
    isAnnouncement?: boolean;
    category?: string;
    region?: string;
    isAdultVerified?: boolean;
    photos?: string[];
  }) {
    const category = normalizeCategory(input.category ?? 'Autre');
    if (category === 'Rencontre adulte' && !input.isAdultVerified) {
      throw new BadRequestException('Vous devez être vérifié·e adulte pour poster dans la catégorie Rencontre adulte.');
    }

    // Gate announcements behind profile completion >= 60%
    if (input.isAnnouncement) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.authorId },
        select: {
          emailVerifiedAt: true,
          profile: { select: { age: true, city: true, gender: true, orientation: true, bio: true, interests: true, lookingFor: true } },
        },
      });
      const pct = calcProfileCompletion(user?.emailVerifiedAt ?? null, user?.profile as Record<string, unknown> | null);
      if (pct < 60) {
        throw new BadRequestException(
          `Votre profil doit être complété à au moins 60% pour publier une annonce (actuellement ${pct}%). Complétez votre profil et réessayez.`,
        );
      }
    }

    const topic = await this.prisma.forumTopic.create({
      data: {
        title: input.title,
        body: input.body,
        authorId: input.authorId,
        groupId: input.groupId ?? null,
        isAnnouncement: input.isAnnouncement ?? false,
        category,
        region: input.region ?? null,
        photos: input.photos ?? undefined,
      },
      select: {
        id: true,
        title: true,
        isAnnouncement: true,
        category: true,
        photos: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
        group: { select: { id: true, name: true } },
      },
    });

    // Award first-announcement token milestone (once)
    if (input.isAnnouncement) {
      this.tokens.awardMilestone(input.authorId, 'first_announcement').catch(() => {});
    }

    return topic;
  }

  async updateTopic(
    id: string,
    userId: string,
    trustLevel: string,
    data: { title?: string; body?: string; category?: string; region?: string | null; closed?: boolean },
  ) {
    const topic = await this.prisma.forumTopic.findUnique({ where: { id }, select: { authorId: true } });
    if (!topic || (topic.authorId !== userId && !isStaff(trustLevel))) throw new ForbiddenException();
    const updateData = { ...data, category: data.category ? normalizeCategory(data.category) : undefined };
    return this.prisma.forumTopic.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, body: true, category: true, region: true, isAnnouncement: true, closed: true, createdAt: true },
    });
  }

  async toggleLike(topicId: string, userId: string) {
    const existing = await this.prisma.forumTopicLike.findUnique({
      where: { topicId_userId: { topicId, userId } },
    });
    if (existing) {
      await this.prisma.forumTopicLike.delete({ where: { topicId_userId: { topicId, userId } } });
      return { liked: false };
    } else {
      await this.prisma.forumTopicLike.create({ data: { topicId, userId } });
      return { liked: true };
    }
  }

  async getTopicLikes(topicId: string) {
    return this.prisma.forumTopicLike.findMany({
      where: { topicId },
      select: { userId: true, user: { select: { id: true, displayName: true } }, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isLikedBy(topicId: string, userId: string) {
    const like = await this.prisma.forumTopicLike.findUnique({
      where: { topicId_userId: { topicId, userId } },
    });
    return !!like;
  }

  async createPost(input: { topicId: string; authorId: string; body: string }) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id: input.topicId },
      select: { closed: true, authorId: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: input.authorId },
      select: { trustLevel: true },
    });
    const staff = user?.trustLevel ? ['moderator', 'super_admin'].includes(user.trustLevel) : false;
    if (topic?.closed && !staff && topic.authorId !== input.authorId) {
      throw new ForbiddenException('Sujet fermé.');
    }
    return this.prisma.forumPost.create({
      data: {
        body: input.body,
        topicId: input.topicId,
        authorId: input.authorId,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, trustLevel: true } },
      },
    });
  }

  async updatePost(postId: string, userId: string, trustLevel: string, body: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: { authorId: true, topicId: true },
    });
    if (!post || (post.authorId !== userId && !isStaff(trustLevel))) throw new ForbiddenException();

    return this.prisma.forumPost.update({
      where: { id: postId },
      data: { body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, displayName: true } },
      },
    });
  }

  async deletePost(postId: string, userId: string, trustLevel: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post || (post.authorId !== userId && !isStaff(trustLevel))) throw new ForbiddenException();

    await this.prisma.forumPost.delete({ where: { id: postId } });
    return { deleted: true };
  }

  async deleteTopic(id: string, userId: string, trustLevel: string) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!topic || (topic.authorId !== userId && !isStaff(trustLevel))) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.forumTopicLike.deleteMany({ where: { topicId: id } }),
      this.prisma.announcementFavorite.deleteMany({ where: { topicId: id } }),
      this.prisma.forumPost.deleteMany({ where: { topicId: id } }),
      this.prisma.forumTopic.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }
}
