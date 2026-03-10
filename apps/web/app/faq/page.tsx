'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
};

const CATEGORY_ICONS: Record<string, string> = {
  Compte: '👤',
  Sécurité: '🔒',
  Rencontres: '💬',
  Annonces: '📢',
  Tokens: '🪙',
  Abonnements: '⭐',
  Modération: '🛡️',
  Confidentialité: '🔐',
};

export default function FaqPage() {
  const [grouped, setGrouped] = React.useState<Record<string, FaqItem[]> | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    apiFetch<Record<string, FaqItem[]>>('/faq').then(setGrouped).catch(() => setGrouped({}));
  }, []);

  const categories = grouped ? Object.keys(grouped).sort() : [];

  const filteredGrouped = React.useMemo(() => {
    if (!grouped || !search.trim()) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, FaqItem[]> = {};
    for (const [cat, items] of Object.entries(grouped)) {
      const filtered = items.filter(
        (i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q),
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [grouped, search]);

  const filteredCategories = filteredGrouped ? Object.keys(filteredGrouped).sort() : [];
  const totalItems = filteredGrouped ? Object.values(filteredGrouped).reduce((s, a) => s + a.length, 0) : 0;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>
          Centre d'aide
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 24px' }}>
          Trouvez rapidement des réponses à vos questions sur la plateforme.
        </p>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 460, margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-dim)' }}>🔍</span>
          <input
            className="form-input"
            type="text"
            placeholder="Rechercher une question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 42, borderRadius: 99 }}
          />
        </div>
      </div>

      {!grouped && <p className="loading-text">Chargement…</p>}

      {grouped && totalItems === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤔</div>
          <p style={{ color: 'var(--text-muted)' }}>
            {search ? `Aucun résultat pour "${search}"` : 'Aucune question disponible pour l\'instant.'}
          </p>
        </div>
      )}

      {/* Category nav */}
      {filteredCategories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
          {filteredCategories.map((cat) => (
            <a
              key={cat}
              href={`#cat-${cat}`}
              style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                color: 'var(--text-muted)', textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {CATEGORY_ICONS[cat] ?? '❓'} {cat}
            </a>
          ))}
        </div>
      )}

      {/* FAQ sections */}
      <div className="stack">
        {filteredCategories.map((cat) => (
          <section key={cat} id={`cat-${cat}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat] ?? '❓'}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{cat}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredGrouped![cat].map((item) => (
                <Link key={item.id} href={`/faq/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{ padding: '14px 18px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 12,
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 14, flex: 1, color: 'var(--text)' }}>{item.question}</span>
                      <span style={{
                        fontSize: 18, color: 'var(--primary)',
                        flexShrink: 0,
                      }}>
                        →
                      </span>
                    </div>
                    <div style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.answer}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
