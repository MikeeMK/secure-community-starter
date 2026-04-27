'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { Avatar } from '../../components/Avatar';

type Liker = { userId: string; user: { id: string; displayName: string } };

type Annonce = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isBoosted?: boolean;
  isFeatured?: boolean;
  likes: Liker[];
  _count: { likes: number };
};

type PlanInfo = {
  plan: 'free' | 'plus' | 'premium';
  announcementsUsed: number;
  announcementsMax: number;
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MesAnnoncesCard() {
  const [annonces, setAnnonces] = React.useState<Annonce[] | null>(null);
  const [openLikes, setOpenLikes] = React.useState<string | null>(null);
  const [planInfo, setPlanInfo] = React.useState<PlanInfo | null>(null);
  const [boostLoading, setBoostLoading] = React.useState<string | null>(null);
  const [featureLoading, setFeatureLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Annonce[]>('/community/forum/topics/my-announcements')
      .then(setAnnonces)
      .catch(() => setAnnonces([]));
    apiFetch<PlanInfo>('/plan').then(setPlanInfo).catch(() => {});
  }, []);

  async function handleBoost(id: string) {
    setBoostLoading(id);
    try {
      await apiFetch(`/plan/boost/${id}`, { method: 'POST' });
      setAnnonces((prev) => prev?.map((a) => a.id === id ? { ...a, isBoosted: true } : a) ?? null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Impossible de booster pour le moment.');
    } finally {
      setBoostLoading(null);
    }
  }

  async function handleFeature(id: string) {
    setFeatureLoading(id);
    try {
      await apiFetch(`/plan/feature/${id}`, { method: 'POST' });
      setAnnonces((prev) => prev?.map((a) => a.id === id ? { ...a, isFeatured: true } : a) ?? null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Impossible de mettre en avant pour le moment.');
    } finally {
      setFeatureLoading(null);
    }
  }

  if (!annonces) return null;
  if (annonces.length === 0) return null;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Mes annonces</div>
        {planInfo && (
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>
            {planInfo.announcementsUsed}/{planInfo.announcementsMax} utilisée{planInfo.announcementsMax > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {annonces.map((a) => (
          <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/annonces/${a.id}`}
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--text-base)',
                    lineHeight: 1.4,
                    display: 'block',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {a.title}
                </Link>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formaterDate(a.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {/* Like count with toggle */}
                <button
                  onClick={() => setOpenLikes((prev) => prev === a.id ? null : a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: a._count.likes > 0 ? 'var(--primary)' : 'var(--text-dim)',
                    background: 'none', border: 'none', cursor: a._count.likes > 0 ? 'pointer' : 'default',
                    fontWeight: a._count.likes > 0 ? 700 : 400,
                  }}
                  title={a._count.likes > 0 ? 'Voir qui a aimé' : 'Aucun j\'aime'}
                >
                  <span>♥</span>
                  <span>{a._count.likes}</span>
                </button>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {planInfo?.plan === 'premium' && !a.isBoosted && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ fontSize: 11, padding: '3px 10px', background: 'linear-gradient(135deg,#7c3aed,#9c27b0)', color: '#fff', border: 'none' }}
                      disabled={boostLoading === a.id}
                      onClick={() => handleBoost(a.id)}
                      title="Remonter en tête de liste pendant 7 jours"
                    >
                      {boostLoading === a.id ? '…' : '🚀 Booster'}
                    </button>
                  )}
                  {a.isBoosted && (
                    <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>🚀 Boosté</span>
                  )}
                  {planInfo && planInfo.plan !== 'free' && !a.isFeatured && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ fontSize: 11, padding: '3px 10px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', border: 'none' }}
                      disabled={featureLoading === a.id}
                      onClick={() => handleFeature(a.id)}
                      title="Mise en avant pendant 7 jours"
                    >
                      {featureLoading === a.id ? '…' : '⭐ Mettre en avant'}
                    </button>
                  )}
                  {a.isFeatured && (
                    <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>⭐ En avant</span>
                  )}
                  <Link href={`/annonces/${a.id}/modifier`} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '3px 10px' }}>
                    Modifier
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                    onClick={() => {
                      const confirmed = window.confirm('Voulez-vous vraiment supprimer votre annonce ? Cette action est irréversible.');
                      if (!confirmed) return;
                      apiFetch(`/community/forum/topics/${a.id}`, { method: 'DELETE' })
                        .then(() => setAnnonces((prev) => prev?.filter((x) => x.id !== a.id) ?? []))
                        .catch(() => alert('Suppression impossible pour le moment.'));
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>

            {/* Likers panel */}
            {openLikes === a.id && a.likes.length > 0 && (
              <div style={{
                marginTop: 10,
                padding: '10px 12px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  {a.likes.length} personne{a.likes.length > 1 ? 's' : ''} ont aimé cette annonce
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {a.likes.map((l) => (
                    <Link
                      key={l.userId}
                      href={`/profil/${l.user.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)' }}
                    >
                      <Avatar name={l.user.displayName} size="sm" />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{l.user.displayName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Link href="/annonces" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'block', marginTop: 12 }}>
        Voir toutes les annonces →
      </Link>
    </div>
  );
}
