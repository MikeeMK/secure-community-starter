'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from './Avatar';
import { TrustBadge } from './Badge';
import { ExpandableBio } from './ExpandableBio';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { copyToClipboard } from '../lib/copy';
import { toPlainTextPreview } from '../lib/markdown';
import { isUserOnline, normalizeLookingForValues } from '../lib/profile';

export type UserProfileViewData = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
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
  announcements?: { id: string; title: string; category?: string | null; region?: string | null; createdAt: string; photos?: string[] | null }[];
};

type UserProfileViewProps = {
  profile: UserProfileViewData;
  mode: 'page' | 'overlay';
  isOwnProfile?: boolean;
  onClose?: () => void;
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

const USER_REPORT_REASONS = [
  'Comportement inapproprié',
  'Usurpation / faux profil',
  'Harcèlement',
  'Spam',
  'Autre',
] as const;

function getCoverGradient(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % COVER_PALETTES.length;
  const [a, b] = COVER_PALETTES[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
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
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 14px',
        borderRadius: 99,
        background: 'var(--primary-glow)',
        border: '1px solid var(--primary-glow-strong)',
        fontSize: 13,
        color: 'var(--primary)',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: 4, marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function UserProfileView({
  profile,
  mode,
  isOwnProfile = false,
  onClose,
}: UserProfileViewProps) {
  const { estAuthentifie } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'topics' | 'posts'>('topics');
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<(typeof USER_REPORT_REASONS)[number]>('Comportement inapproprié');
  const [reportNote, setReportNote] = React.useState('');
  const [reporting, setReporting] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);
  const [copyState, setCopyState] = React.useState<'idle' | 'copied'>('idle');
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatStarted, setChatStarted] = React.useState(false);
  const lookingFor = normalizeLookingForValues(profile.profile?.lookingFor);
  const online = isUserOnline(profile.lastActiveAt);
  const coverGradient = getCoverGradient(profile.displayName);
  const announcements = (profile.announcements ?? []).slice(0, 4);
  const albumPhotos = Array.from(
    new Set((profile.announcements ?? []).flatMap((announcement) => announcement.photos ?? [])),
  ).slice(0, 8);

  async function handleStartChat() {
    if (!estAuthentifie || isOwnProfile) return;
    setChatLoading(true);
    try {
      const res = await apiFetch<{ conversationId: string }>('/chat/start', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      window.dispatchEvent(new CustomEvent('open-chat', { detail: { conversationId: res.conversationId } }));
      setChatStarted(true);
      setActionsOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de démarrer la conversation.');
    } finally {
      setChatLoading(false);
    }
  }

  async function handleCopyUserId() {
    await copyToClipboard(profile.id);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  }

  async function handleReportUser() {
    if (!estAuthentifie || isOwnProfile || reporting) return;
    setReporting(true);
    try {
      await apiFetch('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'USER',
          targetId: profile.id,
          reason: reportReason === 'Autre' ? reportNote.trim() || 'Autre' : reportReason,
        }),
      });
      setReportSent(true);
      setActionsOpen(false);
      setReportNote('');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Signalement impossible pour le moment.');
    } finally {
      setReporting(false);
    }
  }

  const shellStyle = mode === 'page'
    ? {
        width: 'min(1720px, calc(100vw - 40px))',
        maxWidth: 'none',
        margin: '0 auto',
        padding: '20px 12px 40px',
        position: 'relative' as const,
        left: '50%',
        transform: 'translateX(-50%)',
      }
    : { padding: 20 };

  return (
    <div style={shellStyle}>
      {mode === 'page' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            &larr; Retour au dashboard
          </Link>
          {isOwnProfile && (
            <Link href="/profil/modifier" className="btn btn-primary btn-sm">
              Modifier mon profil
            </Link>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mode === 'page' ? '470px minmax(0, 1fr)' : '1fr',
          gap: mode === 'page' ? 22 : 18,
          alignItems: 'start',
        }}
      >
        <aside className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 128, background: coverGradient, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)',
              }}
            />
          </div>

          <div style={{ padding: '0 18px 18px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gap: 16, marginTop: -52 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <div
                  style={{
                    width: 'fit-content',
                    border: '5px solid var(--surface)',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow)',
                    position: 'relative',
                    zIndex: 2,
                    flexShrink: 0,
                  }}
                >
                  <Avatar name={profile.displayName} size="xl" src={profile.avatarUrl} />
                </div>

                <div style={{ display: 'grid', gap: 8, paddingTop: 56, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h1
                      style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {profile.displayName}
                    </h1>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 99,
                        background: online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        border: online ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(148, 163, 184, 0.24)',
                        color: online ? 'var(--success)' : 'var(--text-dim)',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: online ? 'var(--success)' : 'var(--text-dim)',
                        }}
                      />
                      {online ? 'En ligne' : 'Hors ligne'}
                    </span>
                    <TrustBadge level={profile.trustLevel} />
                  </div>

                  <div style={{ display: 'grid', gap: 6 }}>
                    {(profile.profile?.city || profile.profile?.age) && (
                      <div
                        style={{
                          fontSize: 14,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        {profile.profile?.city && <span>📍 {profile.profile.city}</span>}
                        {profile.profile?.age && (
                          <>
                            {profile.profile?.city && (
                              <span style={{ color: 'var(--border-light)' }}>·</span>
                            )}
                            <span>🎂 {profile.profile.age} ans</span>
                          </>
                        )}
                      </div>
                    )}
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      Membre depuis {formatMemberSince(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {profile.profile?.gender && <InfoChip label="Genre" value={profile.profile.gender} />}
                {profile.profile?.orientation && (
                  <InfoChip label="Orientation" value={profile.profile.orientation} />
                )}
                {profile.profile?.relationshipStatus && (
                  <InfoChip label="Situation" value={profile.profile.relationshipStatus} />
                )}
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {!isOwnProfile && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void handleStartChat()}
                      disabled={!estAuthentifie || chatLoading}
                    >
                      {chatStarted ? 'Messagerie ouverte' : chatLoading ? 'Ouverture...' : 'Écrire à ce membre'}
                    </button>
                  )}
                  {!isOwnProfile && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActionsOpen((value) => !value)}
                    >
                      {actionsOpen ? 'Fermer les actions' : 'Actions du profil'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleCopyUserId()}
                  >
                    {copyState === 'copied' ? 'ID copié' : 'Copier l’ID membre'}
                  </button>
                </div>

                {!isOwnProfile && !estAuthentifie && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Connectez-vous pour contacter ce membre ou effectuer un signalement.
                  </div>
                )}

                {reportSent && (
                  <div style={{ fontSize: 13, color: 'var(--primary)', lineHeight: 1.6 }}>
                    Signalement envoyé. Il sera visible dans le centre de modération.
                  </div>
                )}

                {!isOwnProfile && actionsOpen && (
                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px solid rgba(255, 180, 106, 0.2)',
                      background: 'linear-gradient(180deg, rgba(255, 180, 106, 0.08), rgba(255, 180, 106, 0.03))',
                      padding: 14,
                      display: 'grid',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgb(255, 190, 122)', marginBottom: 6 }}>
                        Profil membre
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                        Signaler ou transmettre cet identifiant
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Utile si ce membre n’a aucune annonce publique. Vous pouvez signaler directement son profil, ou copier son identifiant pour la modération.
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {USER_REPORT_REASONS.map((reason) => {
                        const active = reportReason === reason;
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setReportReason(reason)}
                            style={{
                              borderRadius: 999,
                              padding: '10px 14px',
                              border: active ? '1px solid rgba(255, 190, 122, 0.5)' : '1px solid var(--border)',
                              background: active ? 'rgba(255, 190, 122, 0.14)' : 'var(--surface-2)',
                              color: active ? 'rgb(255, 216, 166)' : 'var(--text)',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {reason}
                          </button>
                        );
                      })}
                    </div>

                    {reportReason === 'Autre' && (
                      <textarea
                        className="form-input"
                        rows={3}
                        value={reportNote}
                        onChange={(event) => setReportNote(event.target.value)}
                        placeholder="Expliquez brièvement le problème rencontré avec ce membre."
                        style={{ resize: 'vertical' }}
                      />
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => void handleReportUser()}
                        disabled={!estAuthentifie || reporting || (reportReason === 'Autre' && !reportNote.trim())}
                      >
                        {reporting ? 'Envoi du signalement...' : 'Signaler ce membre'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void handleCopyUserId()}
                      >
                        Copier l’identifiant complet
                      </button>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                      ID membre : <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{profile.id}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    Bio
                  </div>
                  {profile.profile?.bio ? (
                    <ExpandableBio
                      text={profile.profile.bio}
                      lineClamp={mode === 'page' ? 7 : 5}
                      style={{ fontSize: 15, lineHeight: 1.8 }}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)' }}>
                      Aucune biographie renseignée.
                    </p>
                  )}
                </div>

                {lookingFor.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                  >
                    Recherche
                  </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                      {lookingFor.map((value) => <TagChip key={value} label={value} />)}
                    </div>
                  </div>
                )}

                {(profile.profile?.interests?.length ?? 0) > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                  >
                    Intérêts
                  </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                      {profile.profile?.interests?.slice(0, 8).map((value) => (
                        <span
                          key={value}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '7px 13px',
                            borderRadius: 99,
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {mode === 'overlay' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <Link href={`/profil/${profile.id}`} className="btn btn-secondary btn-sm" onClick={onClose}>
                    Ouvrir la page profil
                  </Link>
                  {isOwnProfile && (
                    <Link href="/profil/modifier" className="btn btn-primary btn-sm" onClick={onClose}>
                      Modifier mon profil
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <SectionTitle
              title="Album photos"
              subtitle="Emplacement prêt pour l album utilisateur. A terme : jusqu à 8 photos selon le plan."
            />

            {albumPhotos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => {
                  const photo = albumPhotos[index];
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        aspectRatio: '1 / 1',
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        background: photo
                          ? 'var(--surface-3)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                      }}
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={`Photo ${index + 1} de ${profile.displayName}`}
                          fill
                          unoptimized
                          sizes="220px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-dim)',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Slot photo
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  minHeight: 180,
                  borderRadius: 16,
                  border: '1px dashed var(--border)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 36 }}>🖼️</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Album bientôt branché</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Aucun album utilisateur natif n existe encore dans le projet. Cette zone est prête
                    pour afficher jusqu à 8 photos.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <SectionTitle
              title="Annonces"
              subtitle="Mise en page pensée pour afficher jusqu à 4 annonces sur cette page."
            />

            {announcements.length === 0 && (
              <div className="empty-state" style={{ minHeight: 160 }}>
                <span className="empty-state-icon">📢</span>
                <p>Aucune annonce publiée pour l'instant.</p>
              </div>
            )}

            {announcements.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {announcements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href={`/annonces/${announcement.id}`}
                    onClick={onClose}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px minmax(0, 1fr)',
                        gap: 14,
                        padding: 12,
                        borderRadius: 16,
                        border: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          minHeight: 136,
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: 'var(--surface-3)',
                        }}
                      >
                        {announcement.photos?.[0] ? (
                          <Image
                            src={announcement.photos[0]}
                            alt={announcement.title}
                            fill
                            unoptimized
                            sizes="180px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-dim)',
                              fontSize: 12,
                            }}
                          >
                            Pas de photo
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {announcement.category && <span className="tag tag-muted">{announcement.category}</span>}
                          {announcement.region && <span className="tag tag-muted">📍 {announcement.region}</span>}
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            {formatShortDate(announcement.createdAt)}
                          </span>
                        </div>

                        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                          {announcement.title}
                        </div>

                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                          Ouvrir l annonce pour voir le contenu complet et les photos associees.
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
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
                      {formatShortDate(topic.createdAt)}
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
  );
}
