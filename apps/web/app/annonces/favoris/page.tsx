'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Annonce = {
  id: string;
  title: string;
  body: string;
  category: string;
  region?: string | null;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
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

export default function AnnoncesFavorisPage() {
  const { estAuthentifie } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = React.useState<Annonce[] | null>(null);

  React.useEffect(() => {
    if (!estAuthentifie) {
      router.push('/connexion?redirect=/annonces/favoris');
      return;
    }
    apiFetch<Annonce[]>('/community/forum/favorites')
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, [estAuthentifie, router]);

  async function toggleFavorite(topicId: string) {
    await apiFetch(`/community/forum/topics/${topicId}/favorite`, { method: 'POST' }).catch(() => {});
    setFavorites((prev) => prev?.filter((a) => a.id !== topicId) ?? []);
  }

  if (!favorites) {
    return <div className="page-content"><p className="loading-text">Chargement…</p></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Annonces favorites ({favorites.length})</h1>
          <p className="page-subtitle">Retrouvez ici toutes les annonces que vous avez ajoutées en favoris.</p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary btn-sm">Retour au dashboard</Link>
      </div>

      {favorites.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
            Vous n'avez pas encore d'annonces en favoris.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {favorites.map((a, idx) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '16px 18px',
                borderBottom: idx < favorites.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'flex-start',
              }}
            >
              <Avatar name={a.author.displayName} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Link href={`/annonces/${a.id}`} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                    {a.title}
                  </Link>
                  <span className="tag tag-muted">{a.category}</span>
                  {a.region && <span className="tag tag-muted">{a.region}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserProfileTrigger userId={a.author.id} displayName={a.author.displayName} />
                  <span>· {timeAgo(a.createdAt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(a.id)}
                title="Retirer des favoris"
                className="btn btn-ghost btn-xs"
                style={{ alignSelf: 'center' }}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
