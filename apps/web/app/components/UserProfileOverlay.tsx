'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from './Avatar';
import { TrustBadge } from './Badge';
import { ExpandableBio } from './ExpandableBio';
import { apiFetch } from '../lib/api';
import { toPlainTextPreview } from '../lib/markdown';
import { isUserOnline, normalizeLookingForValues } from '../lib/profile';

type UserProfileResponse = {
  id: string;
  displayName: string;
  trustLevel: 'new' | 'member' | 'moderator' | 'super_admin';
  createdAt: string;
  lastActiveAt?: string | null;
  profile?: {
    age?: number | null;
    city?: string | null;
    gender?: string | null;
    orientation?: string | null;
    relationshipStatus?: string | null;
    lookingFor?: string[];
    interactionType?: string[];
    interests?: string[];
    bio?: string | null;
  } | null;
  forumTopics: { id: string; title: string; createdAt: string }[];
  forumPosts: { id: string; body: string; createdAt: string; topic: { id: string; title: string } }[];
};

type UserProfileOverlayProps = {
  userId: string;
  onClose: () => void;
};

const COVER_PALETTES = [
  ['#4F8F8B', '#2E5F5C'],
  ['#7c3aed', '#5b21b6'],
  ['#E85D75', '#c2185b'],
  ['#059669', '#047857'],
  ['#d97706', '#b45309'],
  ['#2563eb', '#1d4ed8'],
  ['#db2777', '#9d174d'],
  ['#0891b2', '#0e7490'],
];

function getCoverGradient(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % COVER_PALETTES.length;
  const [a, b] = COVER_PALETTES[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 12px',
      borderRadius: 99,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      fontSize: 13,
      color: 'var(--text-muted)',
      fontWeight: 500,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 14px',
      borderRadius: 99,
      background: 'var(--primary-glow)',
      border: '1px solid var(--primary-glow-strong)',
      fontSize: 13,
      color: 'var(--primary)',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

export function UserProfileOverlay({ userId, onClose }: UserProfileOverlayProps) {
  const [profile, setProfile] = React.useState<UserProfileResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'topics' | 'posts'>('topics');

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  React.useEffect(() => {
    apiFetch<UserProfileResponse>(`/users/${userId}`)
      .then(setProfile)
      .catch((err) => setError(String(err)));
  }, [userId]);

  const lookingFor = normalizeLookingForValues(profile?.profile?.lookingFor);
  const online = isUserOnline(profile?.lastActiveAt);
  const coverGradient = profile ? getCoverGradient(profile.displayName) : 'linear-gradient(135deg, #4F8F8B 0%, #2E5F5C 100%)';

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ position: 'sticky', top: 0, zIndex: 2, padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Profil utilisateur</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 22, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        {error && <div className="error-text" style={{ margin: 24 }}>{error}</div>}

        {!profile && !error && <p className="loading-text" style={{ padding: 32 }}>Chargement du profil...</p>}

        {profile && (
          <div style={{ padding: 20 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ background: coverGradient, height: 160, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />
              </div>

              <div style={{ padding: '0 28px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 22 }}>
                  <div style={{ marginTop: -74, border: '5px solid var(--surface)', borderRadius: '50%', background: 'var(--surface)', flexShrink: 0, boxShadow: 'var(--shadow)' }}>
                    <Avatar name={profile.displayName} size="xxl" />
                  </div>
                  <div style={{ flex: 1, paddingTop: 16, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
                        {profile.displayName}
                      </h2>
                      {online && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 11px',
                          borderRadius: 99,
                          background: 'rgba(5,150,105,0.10)',
                          border: '1px solid rgba(5,150,105,0.18)',
                          color: 'var(--success)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 0 4px rgba(5,150,105,0.12)' }} />
                          En ligne
                        </span>
                      )}
                      <TrustBadge level={profile.trustLevel} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                      <span>Membre depuis {formatMemberSince(profile.createdAt)}</span>
                      {profile.profile?.city && <><span style={{ color: 'var(--border-light)' }}>·</span><span>📍 {profile.profile.city}</span></>}
                      {profile.profile?.age && <><span style={{ color: 'var(--border-light)' }}>·</span><span>🎂 {profile.profile.age} ans</span></>}
                    </div>
                  </div>
                </div>

                {profile.profile?.bio ? (
                  <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                    <ExpandableBio
                      text={profile.profile.bio}
                      style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.8, maxWidth: 720 }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
                      Aucune biographie renseignée.
                    </p>
                  </div>
                )}

                {(profile.profile?.gender || profile.profile?.orientation || profile.profile?.relationshipStatus) && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Identité
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {profile.profile?.gender && <InfoChip label="Genre" value={profile.profile.gender} />}
                      {profile.profile?.orientation && <InfoChip label="Orientation" value={profile.profile.orientation} />}
                      {profile.profile?.relationshipStatus && <InfoChip label="Situation" value={profile.profile.relationshipStatus} />}
                    </div>
                  </div>
                )}

                {lookingFor.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Je recherche
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {lookingFor.map((value) => <TagChip key={value} label={value} />)}
                    </div>
                  </div>
                )}

                {(profile.profile?.interactionType?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Interactions
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.profile?.interactionType?.map((value) => <TagChip key={value} label={value} />)}
                    </div>
                  </div>
                )}

                {(profile.profile?.interests?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Intérêts
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile.profile?.interests?.map((value) => (
                        <span key={value} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 22, borderTop: '1px solid var(--border)' }}>
                  <Link href={`/profil/${profile.id}`} className="btn btn-secondary btn-sm" onClick={onClose}>
                    Ouvrir la page profil
                  </Link>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('topics')}
                  className={`btn btn-sm ${activeTab === 'topics' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '6px 6px 0 0' }}
                >
                  Sujets ({profile.forumTopics.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`btn btn-sm ${activeTab === 'posts' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '6px 6px 0 0' }}
                >
                  Réponses ({profile.forumPosts.length})
                </button>
              </div>

              {activeTab === 'topics' && (
                <div className="stack-sm">
                  {profile.forumTopics.length === 0 && (
                    <div className="empty-state">
                      <span className="empty-state-icon">💬</span>
                      <p>Aucun sujet publié pour l'instant.</p>
                    </div>
                  )}
                  {profile.forumTopics.map((topic) => (
                    <Link key={topic.id} href={`/forum/${topic.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                      <div className="topic-item">
                        <div style={{ flex: 1 }}>
                          <div className="topic-title">{topic.title}</div>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {new Date(topic.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="stack-sm">
                  {profile.forumPosts.length === 0 && (
                    <div className="empty-state">
                      <span className="empty-state-icon">📝</span>
                      <p>Aucune réponse publiée pour l'instant.</p>
                    </div>
                  )}
                  {profile.forumPosts.map((post) => (
                    <Link key={post.id} href={`/forum/${post.topic.id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="post-item" style={{ flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Réponse dans <span style={{ fontWeight: 700 }}>{post.topic.title}</span>
                        </div>
                        <p className="post-body" style={{ fontSize: 14 }}>
                          {(() => {
                            const preview = toPlainTextPreview(post.body);
                            return preview.length > 220 ? `${preview.slice(0, 220)}...` : preview;
                          })()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
