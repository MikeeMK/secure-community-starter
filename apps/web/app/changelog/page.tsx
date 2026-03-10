'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: { displayName: string };
  _count: { newsFeedbacks: number };
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PageChangelog() {
  const [news, setNews] = React.useState<NewsItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<NewsItem[]>('/news/published').then(setNews).catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Changelog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          Toutes les mises à jour de Velentra, alimentées par vos retours.
        </p>
      </div>

      {error && <div className="error-text">{error}</div>}
      {!news && !error && <p className="loading-text">Chargement…</p>}

      {news && news.length === 0 && (
        <div className="card empty-state">
          <span className="empty-state-icon">🚀</span>
          <p>Aucune mise à jour publiée pour l'instant.</p>
        </div>
      )}

      {news && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {news.map((n, i) => (
            <div
              key={n.id}
              id={n.id}
              style={{ display: 'flex', gap: 24, paddingBottom: 40 }}
            >
              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #9c27b0)',
                  flexShrink: 0,
                  marginTop: 6,
                }} />
                {i < news.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 6 }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>
                    {formaterDate(n.publishedAt)}
                  </span>
                  {n._count.newsFeedbacks > 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: 'rgba(124,58,237,0.12)',
                      color: '#7c3aed',
                    }}>
                      💬 {n._count.newsFeedbacks} retour{n._count.newsFeedbacks !== 1 ? 's' : ''} utilisateur{n._count.newsFeedbacks !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {n.title}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                  {n.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
