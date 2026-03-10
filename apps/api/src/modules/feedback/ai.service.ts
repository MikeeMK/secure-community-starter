import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export type Sentiment = 'positive' | 'neutral' | 'frustrated' | 'angry';

export type AiAnalysis = {
  sentiment: Sentiment;
  category: 'bug' | 'feature' | 'ux' | 'performance' | 'other';
  tags: string[];
  summary: string;
};

@Injectable()
export class AiService {
  private readonly client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private heuristic(content: string) {
    const txt = content.toLowerCase();
    const tags: string[] = [];
    let sentiment: Sentiment | null = null;
    let category: AiAnalysis['category'] | null = null;

    if (/(bordel|merde|putain|aucun.*marche|rien ne marche|ça marche pas|sa marche pas|ne marche pas|impossible)/i.test(txt)) {
      sentiment = 'angry';
      tags.push('colère');
    } else if (/(probl[eè]me|bug|bloqu[eé]|d[eé]çu|frustr[eé])/i.test(txt)) {
      sentiment = 'frustrated';
      tags.push('frustration');
    }

    if (/(bug|erreur|crash|plantage|ne marche pas|rien ne marche|impossible|probl[eè]me)/i.test(txt)) {
      category = 'bug';
      tags.push('bug');
    }

    if (/(ui|interface|ux|lisibilit[eé]|affichage|mise en page)/i.test(txt)) tags.push('ui');
    if (/(performance|lent|lag|ralenti)/i.test(txt)) tags.push('performance');

    return { sentiment, category, tags };
  }

  async analyzeFeedback(content: string): Promise<AiAnalysis> {
    const hints = this.heuristic(content);

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Analyse ce feedback utilisateur et réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour).
Tu dois être strict :
- sentiment: "angry" si insultes/jurons/exaspération, "frustrated" si plainte claire, "neutral" si factuel, "positive" sinon.
- category: "bug" dès qu'il dit que ça ne marche pas / erreur / problème / bug / crash; "feature" si demande d'ajout/amélioration; "ux" si design/ergonomie/affichage; "performance" si lenteur; sinon "other".
- tags: liste courte de 2-5 mots-clés pertinents (ex: ["bug","login","angry"]).
- summary: une phrase courte.

Feedback: """${content}"""

JSON attendu : {"sentiment":"","category":"","tags":[],"summary":""}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      const parsed = JSON.parse(text) as AiAnalysis;
      const merged: AiAnalysis = {
        sentiment: hints.sentiment ?? parsed.sentiment ?? 'neutral',
        category: parsed.category ?? hints.category ?? 'other',
        tags: Array.from(new Set([...(parsed.tags || []), ...hints.tags])),
        summary: parsed.summary || content.slice(0, 100),
      };

      // Respect user-chosen category elsewhere; here only force bug if évident
      if (hints.category === 'bug') merged.category = 'bug';
      if (!merged.sentiment && hints.sentiment) merged.sentiment = hints.sentiment;

      return merged;
    } catch {
      return {
        sentiment: hints.sentiment ?? 'neutral',
        category: hints.category ?? 'other',
        tags: hints.tags,
        summary: content.slice(0, 100),
      };
    }
  }

  async suggestRelatedFeedbacks(
    newsTitle: string,
    newsContent: string,
    feedbacks: { id: string; content: string; summary: string }[],
  ): Promise<string[]> {
    if (feedbacks.length === 0) return [];

    const list = feedbacks
      .map((f) => `[${f.id}] ${f.summary || f.content.slice(0, 80)}`)
      .join('\n');

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Voici une news publiée sur notre plateforme :
Titre: "${newsTitle}"
Contenu: "${newsContent.slice(0, 200)}"

Voici une liste de feedbacks utilisateurs (format: [id] résumé) :
${list}

Quels feedbacks sont liés à cette news ? Réponds UNIQUEMENT avec un tableau JSON d'IDs (ex: ["id1","id2"]). Maximum 5 feedbacks.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    try {
      const ids = JSON.parse(text);
      return Array.isArray(ids) ? ids.slice(0, 5) : [];
    } catch {
      return [];
    }
  }
}
