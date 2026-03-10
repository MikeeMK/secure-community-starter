import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

// Keyword-based sentiment for instant response (no latency)
function quickSentiment(text: string): 'positive' | 'neutral' | 'frustrated' | 'angry' {
  const lower = text.toLowerCase();
  const angryWords = ['nul', 'merde', 'putain', 'horrible', 'inacceptable', 'honte', 'scandaleux', 'inutile', 'dégueu', 'bug de merde'];
  const frustratedWords = ['frustrant', 'chiant', 'décevant', 'encore', 'toujours', 'bug', 'marche pas', 'fonctionne pas', 'problème', 'pb', 'cassé', 'lent'];
  const positiveWords = ['super', 'top', 'excellent', 'parfait', 'bravo', 'génial', 'cool', 'merci', 'bien', 'pratique', 'j\'adore', 'super bien'];

  if (angryWords.some((w) => lower.includes(w))) return 'angry';
  if (frustratedWords.some((w) => lower.includes(w))) return 'frustrated';
  if (positiveWords.some((w) => lower.includes(w))) return 'positive';
  return 'neutral';
}

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async create(userId: string, content: string) {
    // Quick sentiment sync (for toast), deep analysis async
    const sentiment = quickSentiment(content);

    const [sender, feedback] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } }),
      this.prisma.feedback.create({
        data: { userId, content },
        select: { id: true, content: true, createdAt: true },
      }),
    ]);

    // Notify all super_admins
    const snippet = content.replace(/^\[.*?\]\s*/, '').slice(0, 60);
    this.prisma.user.findMany({ where: { trustLevel: 'super_admin' }, select: { id: true } })
      .then((admins) => {
        if (!admins.length) return;
        return this.prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            message: `Nouveau feedback de ${sender?.displayName ?? 'Membre'} : "${snippet}…"`,
            link: '/admin/moderation?tab=feedbacks',
          })),
          skipDuplicates: true,
        });
      })
      .catch(() => {});

    // Async deep analysis — don't block the response
    this.ai.analyzeFeedback(content).then((analysis) => {
      return this.prisma.feedback.update({
        where: { id: feedback.id },
        data: { aiAnalysis: { ...analysis, sentiment } },
      });
    }).catch(() => {
      // Store at least the quick sentiment if AI fails
      this.prisma.feedback.update({
        where: { id: feedback.id },
        data: { aiAnalysis: { sentiment, category: 'other', tags: [], summary: content.slice(0, 100) } },
      }).catch(() => {});
    });

    return { feedback, sentiment };
  }

  async list() {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        content: true,
        aiAnalysis: true,
        createdAt: true,
        user: { select: { id: true, displayName: true } },
        newsFeedbacks: { select: { newsId: true } },
      },
    });
  }

  async getSuggestionsForNews(newsId: string, title: string, content: string) {
    // Get all feedbacks with AI analysis
    const feedbacks = await this.prisma.feedback.findMany({
      select: { id: true, content: true, aiAnalysis: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const mapped = feedbacks.map((f) => ({
      id: f.id,
      content: f.content,
      summary: (f.aiAnalysis as any)?.summary ?? '',
    }));

    const suggested = await this.ai.suggestRelatedFeedbacks(title, content, mapped);
    return suggested;
  }
}
