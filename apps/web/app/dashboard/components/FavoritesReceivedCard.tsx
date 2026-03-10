'use client';

import React from 'react';
import Link from 'next/link';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';

type FavoriteReceived = {
  user: { id: string; displayName: string; trustLevel: string };
  topic: { id: string; title: string };
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function FavoritesReceivedCard() {
  const [data, setData] = React.useState<FavoriteReceived[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<FavoriteReceived[]>('/community/forum/favorites/received')
      .then((res) => setData(res))
      .catch((e) => {
        setError(typeof e === 'string' ? e : 'Impossible de charger les favoris reçus');
        setData([]);
      });
  }, []);

  if (!data) return null;
  if (data.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Annonces favoris</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Personne n'a encore ajouté vos annonces en favoris.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Annonces favoris</div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.length} ajout(s)</span>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.slice(0, 5).map((fav) => (
          <div
            key={`${fav.user.id}-${fav.topic.id}-${fav.createdAt}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <UserProfileTrigger
                userId={fav.user.id}
                displayName={fav.user.displayName}
                trustLevel={fav.user.trustLevel}
                style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
              />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                a ajouté{' '}
                <Link href={`/annonces/${fav.topic.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  «&nbsp;{fav.topic.title}&nbsp;»
                </Link>{' '}
                à ses favoris.
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
              {timeAgo(fav.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
