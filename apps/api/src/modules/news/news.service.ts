import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackService } from '../feedback/feedback.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedbackService: FeedbackService,
  ) {}

  async create(authorId: string, title: string, content: string) {
    return this.prisma.news.create({
      data: { authorId, title, content },
      select: { id: true, title: true, content: true, publishedAt: true, createdAt: true },
    });
  }

  async update(id: string, title: string, content: string) {
    return this.prisma.news.update({
      where: { id },
      data: { title, content },
      select: { id: true, title: true, content: true, publishedAt: true, updatedAt: true },
    });
  }

  async publish(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: { newsFeedbacks: { include: { feedback: { select: { userId: true } } } } },
    });
    if (!news) throw new NotFoundException('News introuvable');

    const updated = await this.prisma.news.update({
      where: { id },
      data: { publishedAt: new Date() },
      select: { id: true, title: true, publishedAt: true },
    });

    // Notify users whose feedbacks are linked
    const userIds = [...new Set(news.newsFeedbacks.map((nf: (typeof news.newsFeedbacks)[number]) => nf.feedback.userId))];
    if (userIds.length > 0) {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          newsId: id,
          title: 'Votre retour a abouti',
          content: `L’équipe Velentra a publié "${news.title}" en lien avec un retour que vous aviez envoyé.`,
          message: `Votre retour a été entendu ! "${news.title}" vient d'être publié.`,
          link: `/changelog#${id}`,
        })),
        skipDuplicates: true,
      });
    }

    return updated;
  }

  async delete(id: string) {
    await this.prisma.news.delete({ where: { id } });
    return { success: true };
  }

  async listAll() {
    return this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { id: true, displayName: true } },
        newsFeedbacks: { select: { feedbackId: true } },
      },
    });
  }

  async listPublished() {
    return this.prisma.news.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        author: { select: { displayName: true } },
        _count: { select: { newsFeedbacks: true } },
      },
    });
  }

  async linkFeedbacks(newsId: string, feedbackIds: string[]) {
    const news = await this.prisma.news.findUnique({ where: { id: newsId }, select: { id: true } });
    if (!news) throw new NotFoundException('News introuvable');

    // Remove existing links then re-create
    await this.prisma.newsFeedback.deleteMany({ where: { newsId } });
    if (feedbackIds.length > 0) {
      await this.prisma.newsFeedback.createMany({
        data: feedbackIds.map((feedbackId) => ({ newsId, feedbackId })),
        skipDuplicates: true,
      });
    }
    return { success: true, linked: feedbackIds.length };
  }

  async suggestFeedbacks(newsId: string) {
    const news = await this.prisma.news.findUnique({
      where: { id: newsId },
      select: { title: true, content: true },
    });
    if (!news) throw new NotFoundException('News introuvable');
    return this.feedbackService.getSuggestionsForNews(newsId, news.title, news.content);
  }
}
