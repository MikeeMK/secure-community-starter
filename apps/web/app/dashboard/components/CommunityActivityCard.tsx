'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '../../components/Avatar';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';

type Topic = {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; displayName: string };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function CommunityActivityCard() {
  const [topics, setTopics] = React.useState<Topic[] | null>(null);

  React.useEffect(() => {
    apiFetch<Topic[]>('/community/forum/topics')
      .then((t) => setTopics(t.slice(0, 5)))
      .catch(() => setTopics([]));
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Activité de la communauté</span>
        <Link href="/forum" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          Voir tout →
        </Link>
      </div>

      {!topics && <p className="loading-text" style={{ fontSize: 13 }}>Chargement…</p>}

      {topics && topics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌱</div>
          Aucun post pour l'instant — soyez le premier à lancer une discussion !
          <div style={{ marginTop: 12 }}>
            <Link href="/forum" className="btn btn-primary btn-sm">Aller au forum</Link>
          </div>
        </div>
      )}

      {topics && topics.map((t, i) => (
        <Link key={t.id} href={`/forum/${t.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '10px 0',
            borderBottom: i < topics.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <Avatar name={t.author.displayName} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)', lineHeight: 1.4 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                <UserProfileTrigger
                  userId={t.author.id}
                  displayName={t.author.displayName}
                  stopPropagation
                  style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}
                >
                  <span>{t.author.displayName}</span>
                </UserProfileTrigger>
                <span> · {timeAgo(t.createdAt)}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
