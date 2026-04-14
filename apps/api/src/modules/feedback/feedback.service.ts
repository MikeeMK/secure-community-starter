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
      .then((admins: { id: string }[]) => {
        if (!admins.length) return;
        return this.prisma.notification.createMany({
          data: admins.map((a: { id: string }) => ({
            userId: a.id,
            title: 'Nouveau feedback reçu',
            content: `${sender?.displayName ?? 'Un membre'} a envoyé un nouveau feedback. Extrait: "${snippet}…"`,
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
        status: true,
        internalNote: true,
        adminResponse: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
        reviewedBy: { select: { id: true, displayName: true } },
        user: { select: { id: true, displayName: true } },
        newsFeedbacks: { select: { newsId: true } },
      },
    });
  }

  async review(
    id: string,
    reviewerId: string,
    input: { status: 'NEW' | 'IN_REVIEW' | 'PLANNED' | 'RESOLVED' | 'REJECTED'; internalNote?: string; adminResponse?: string },
  ) {
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        status: input.status,
        internalNote: input.internalNote?.trim() || null,
        adminResponse: input.adminResponse?.trim() || null,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
      select: {
        id: true,
        status: true,
        internalNote: true,
        adminResponse: true,
        reviewedAt: true,
        reviewedBy: { select: { id: true, displayName: true } },
      },
    });

    await this.prisma.moderationAction.create({
      data: {
        actorId: reviewerId,
        actionType: `FEEDBACK_${input.status}`,
        targetType: 'FEEDBACK',
        targetId: id,
        reason: input.internalNote?.trim() || input.adminResponse?.trim() || 'Mise à jour du feedback.',
        metadata: {
          status: input.status,
          hasAdminResponse: !!input.adminResponse?.trim(),
        },
      },
    });

    return updated;
  }

  async getSuggestionsForNews(newsId: string, title: string, content: string) {
    // Get all feedbacks with AI analysis
    const feedbacks = await this.prisma.feedback.findMany({
      select: { id: true, content: true, aiAnalysis: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const mapped = feedbacks.map((f: (typeof feedbacks)[number]) => ({
      id: f.id,
      content: f.content,
      summary: ((f.aiAnalysis as { summary?: string } | null) ?? null)?.summary ?? '',
    }));

    const suggested = await this.ai.suggestRelatedFeedbacks(title, content, mapped);
    return suggested;
  }
}
