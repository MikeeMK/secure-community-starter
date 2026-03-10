'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

type Annonce = {
  id: string;
  title: string;
  body: string;
  category: string;
  region?: string | null;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  _count: { likes: number };
};

const CATEGORY_COLORS: Record<string, string> = {
  Amitié: '#3b82f6',
  Activités: '#10b981',
  'Rencontre adulte': '#ef4444',
  Autre: '#8b5cf6',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function FavoritesCard() {
  const [favorites, setFavorites] = React.useState<Annonce[] | null>(null);

  React.useEffect(() => {
    apiFetch<Annonce[]>('/community/forum/favorites')
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, []);

  async function removeFavorite(topicId: string) {
    await apiFetch(`/community/forum/topics/${topicId}/favorite`, { method: 'POST' }).catch(() => {});
    setFavorites((prev) => prev?.filter((a) => a.id !== topicId) ?? []);
  }

  if (!favorites) return null;
  const total = favorites.length;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Annonces favorites{total ? ` (${total})` : ''}</div>
        <Link href="/annonces/favoris" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          Voir toutes les annonces →
        </Link>
      </div>
      {total === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Vous n'avez pas encore d'annonces en favoris.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {favorites.map((a) => {
            const color = CATEGORY_COLORS[a.category] ?? '#8b5cf6';
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', borderLeft: `3px solid ${color}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/annonces/${a.id}`} style={{ fontWeight: 600, fontSize: 13, textDecoration: 'none', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {a.author.displayName} · {timeAgo(a.createdAt)}
                    {a.region && <span> · {a.region}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFavorite(a.id)}
                  title="Retirer des favoris"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: 16, flexShrink: 0, padding: 2 }}
                >
                  ★
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
