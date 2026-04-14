'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { StatusBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';
import { toPlainTextPreview } from '../../lib/markdown';
import { useAuth } from '../../context/AuthContext';

type FeedbackItem = {
  id: string;
  content: string;
  status: 'NEW' | 'IN_REVIEW' | 'PLANNED' | 'RESOLVED' | 'REJECTED';
  internalNote: string | null;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; displayName: string } | null;
  user: { id: string; displayName: string };
  aiAnalysis: {
    sentiment?: string;
    category?: string;
    tags?: string[];
    summary?: string;
  } | null;
};

type Signalement = {
  id: string;
  status: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  archivedAt?: string | null;
  reporter: { id: string; displayName: string };
};

type SignalementDetail = {
  id: string;
  status: string;
  targetType: 'USER' | 'TOPIC' | 'POST' | 'MESSAGE';
  targetId: string;
  reason: string;
  resolutionReason: string | null;
  rewardTokens: number;
  createdAt: string;
  archivedAt?: string | null;
  reporter: {
    id: string;
    displayName: string;
    email: string;
    trustLevel: string;
    createdAt: string;
    lastActiveAt: string | null;
  };
  handledBy: {
    id: string;
    displayName: string;
    trustLevel: string;
  } | null;
  target:
    | {
        type: 'USER';
        exists: boolean;
        user?: {
          id: string;
          displayName: string;
          email: string;
          avatarUrl?: string | null;
          trustLevel: string;
          emailVerifiedAt: string | null;
          createdAt: string;
          lastActiveAt: string | null;
          profile: { city?: string | null; age?: number | null; bio?: string | null } | null;
          _count: { forumTopics: number; forumPosts: number; reportsMade: number };
        };
      }
    | {
        type: 'TOPIC';
        exists: boolean;
        topic?: {
          id: string;
          title: string;
          body: string;
          isAnnouncement: boolean;
          category: string;
          region?: string | null;
          photos?: string[] | null;
          closed: boolean;
          hiddenAt?: string | null;
          hiddenReason?: string | null;
          createdAt: string;
          author: { id: string; displayName: string; trustLevel: string };
          _count: { posts: number; likes: number; favorites: number };
        };
      }
    | {
        type: 'POST';
        exists: boolean;
        post?: {
          id: string;
          body: string;
          hiddenAt?: string | null;
          hiddenReason?: string | null;
          createdAt: string;
          author: { id: string; displayName: string; trustLevel: string };
          topic: {
            id: string;
            title: string;
            isAnnouncement: boolean;
            category: string;
            closed: boolean;
            author: { id: string; displayName: string; trustLevel: string };
          };
        };
      }
    | {
        type: 'MESSAGE';
        exists: boolean;
        message?: {
          id: string;
          content: string;
          read: boolean;
          hiddenAt?: string | null;
          hiddenReason?: string | null;
          createdAt: string;
          sender: { id: string; displayName: string; trustLevel: string };
          conversation: {
            id: string;
            announcementId?: string | null;
            user1: { id: string; displayName: string };
            user2: { id: string; displayName: string };
          };
        };
      }
    | null;
  recentRelated: {
    id: string;
    status: string;
    reason: string;
    createdAt: string;
    reporter: { id: string; displayName: string };
  }[];
};

type UserItem = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  email: string;
  trustLevel: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  moderationReason: string | null;
  suspendedUntil: string | null;
  canReRegisterAfter: string | null;
  moderatedAt: string | null;
  chatRestrictedUntil: string | null;
  chatRestrictionReason: string | null;
  publishRestrictedUntil: string | null;
  publishRestrictionReason: string | null;
  replyRestrictedUntil: string | null;
  replyRestrictionReason: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  _count: { forumTopics: number; forumPosts: number };
};

type AdminUserDetail = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  email: string;
  trustLevel: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  moderationReason: string | null;
  suspendedUntil: string | null;
  canReRegisterAfter: string | null;
  moderatedAt: string | null;
  chatRestrictedUntil: string | null;
  chatRestrictionReason: string | null;
  publishRestrictedUntil: string | null;
  publishRestrictionReason: string | null;
  replyRestrictedUntil: string | null;
  replyRestrictionReason: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  profile: {
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
  tokenBalance: {
    balance: number;
    awardedMilestones: string[];
    updatedAt: string;
  } | null;
  stats: {
    announcements: number;
    topics: number;
    posts: number;
    reportsMade: number;
    reportsReceived: number;
    openReportsReceived: number;
    conversations: number;
  };
  recentAnnouncements: {
    id: string;
    title: string;
    category: string;
    region?: string | null;
    createdAt: string;
    _count: { likes: number; favorites: number };
  }[];
  recentTopics: {
    id: string;
    title: string;
    category: string;
    closed: boolean;
    createdAt: string;
    _count: { posts: number; likes: number };
  }[];
  recentPosts: {
    id: string;
    body: string;
    createdAt: string;
    topic: { id: string; title: string; isAnnouncement: boolean };
  }[];
  reportsMade: {
    id: string;
    status: string;
    targetType: string;
    targetId: string;
    reason: string;
    createdAt: string;
    handledBy: { id: string; displayName: string } | null;
  }[];
  reportsReceived: {
    id: string;
    status: string;
    reason: string;
    resolutionReason: string | null;
    rewardTokens: number;
    createdAt: string;
    reporter: { id: string; displayName: string };
    handledBy: { id: string; displayName: string } | null;
  }[];
  moderationActions: {
    id: string;
    actionType: string;
    reason: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    actor: { id: string; displayName: string };
  }[];
};

type ModerationActionItem = {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    trustLevel: string;
  };
};

const labelStatut: Record<string, string> = {
  ALL: 'Tous',
  OPEN: 'Ouvert',
  IN_REVIEW: 'En examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const labelCible: Record<string, string> = {
  USER: 'Utilisateur',
  TOPIC: 'Sujet',
  POST: 'Message forum',
  MESSAGE: 'Message privé',
};

const labelGrade: Record<string, string> = {
  new: 'Nouveau',
  member: 'Membre',
  moderator: 'Modérateur',
  super_admin: 'Super Admin',
};

const colorGrade: Record<string, string> = {
  new: 'var(--text-muted)',
  member: 'var(--text-base)',
  moderator: 'var(--warning)',
  super_admin: 'var(--danger)',
};

const labelCompte: Record<'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED', string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  BANNED: 'Banni',
  DELETED: 'Supprimé',
};

const colorCompte: Record<'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED', string> = {
  ACTIVE: 'var(--success)',
  SUSPENDED: 'var(--warning)',
  BANNED: 'var(--danger)',
  DELETED: 'var(--text-muted)',
};

const feedbackStatusLabel: Record<'NEW' | 'IN_REVIEW' | 'PLANNED' | 'RESOLVED' | 'REJECTED', string> = {
  NEW: 'Nouveau',
  IN_REVIEW: 'En revue',
  PLANNED: 'Prévu',
  RESOLVED: 'Traité',
  REJECTED: 'Rejeté',
};

const targetTypeLabel: Record<string, string> = {
  USER: 'Utilisateur',
  TOPIC: 'Sujet',
  POST: 'Réponse',
  MESSAGE: 'Message',
  FEEDBACK: 'Feedback',
};

const sentimentConfig: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positif', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  neutral: { label: 'Neutre', color: 'var(--text-muted)', bg: 'var(--surface-3)' },
  frustrated: { label: 'Frustré', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  angry: { label: 'Irrité', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formaterDateHeure(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Jamais';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function clip(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function parseFeedbackContent(raw: string): { category: string | null; body: string } {
  const match = raw.match(/^\[(Suggestion|Bug|Question)\]\s*/i);
  if (match) return { category: match[1], body: raw.slice(match[0].length) };
  return { category: null, body: raw };
}

function getTargetLink(detail: SignalementDetail): string | null {
  if (!detail.target) return null;
  if (detail.target.type === 'USER' && detail.target.user) return `/profil/${detail.target.user.id}`;
  if (detail.target.type === 'TOPIC' && detail.target.topic) {
    return detail.target.topic.isAnnouncement ? `/annonces/${detail.target.topic.id}` : `/forum/${detail.target.topic.id}`;
  }
  if (detail.target.type === 'POST' && detail.target.post) return `/forum/${detail.target.post.topic.id}`;
  if (detail.target.type === 'MESSAGE' && detail.target.message) return '/messagerie';
  return null;
}

function getTargetUserId(detail: SignalementDetail): string | null {
  if (!detail.target) return null;
  if (detail.target.type === 'USER') return detail.target.user?.id ?? null;
  if (detail.target.type === 'TOPIC') return detail.target.topic?.author.id ?? null;
  if (detail.target.type === 'POST') return detail.target.post?.author.id ?? null;
  if (detail.target.type === 'MESSAGE') return detail.target.message?.sender.id ?? null;
  return null;
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.72)',
        backdropFilter: 'blur(10px)',
        zIndex: 1200,
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(1240px, 100%)',
          maxHeight: '88vh',
          padding: 0,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              width: 38,
              height: 38,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card card-sm" style={{ padding: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: tone ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'start' }}>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function UserAdminModal({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = React.useState<AdminUserDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    setDetail(null);
    setError(null);
    apiFetch<AdminUserDetail>(`/users/admin/${userId}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Impossible de charger cet utilisateur.'));
  }, [userId]);

  if (!userId) return null;

  return (
    <ModalShell
      title={detail ? `Dossier utilisateur · ${detail.displayName}` : 'Chargement du dossier utilisateur'}
      subtitle="Vue admin détaillée pour comprendre l’activité du compte, ses contenus et son historique de signalement."
      onClose={onClose}
    >
      {error && <div className="error-text" style={{ marginBottom: 20 }}>{error}</div>}
      {!detail && !error && <p className="loading-text">Chargement du dossier utilisateur…</p>}

      {detail && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20 }}>
            <div className="card" style={{ padding: 18, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Avatar name={detail.displayName} src={detail.avatarUrl} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>{detail.displayName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{detail.email}</div>
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: colorGrade[detail.trustLevel] ?? 'var(--text)' }}>
                    {labelGrade[detail.trustLevel] ?? detail.trustLevel}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <InfoLine
                  label="Compte"
                  value={
                    <span style={{ color: colorCompte[detail.accountStatus], fontWeight: 700 }}>
                      {labelCompte[detail.accountStatus]}
                    </span>
                  }
                />
                <InfoLine label="Inscrit le" value={formaterDateHeure(detail.createdAt)} />
                <InfoLine label="Dernière activité" value={timeAgo(detail.lastActiveAt)} />
                <InfoLine label="Email vérifié" value={detail.emailVerifiedAt ? `Oui, le ${formaterDate(detail.emailVerifiedAt)}` : 'Non'} />
                {detail.moderationReason && <InfoLine label="Motif modération" value={detail.moderationReason} />}
                {detail.suspendedUntil && <InfoLine label="Suspendu jusqu'au" value={formaterDateHeure(detail.suspendedUntil)} />}
                {detail.canReRegisterAfter && <InfoLine label="Recréation après" value={formaterDateHeure(detail.canReRegisterAfter)} />}
                {detail.chatRestrictedUntil && <InfoLine label="Chat bloqué jusqu'au" value={formaterDateHeure(detail.chatRestrictedUntil)} />}
                {detail.publishRestrictedUntil && <InfoLine label="Publication bloquée jusqu'au" value={formaterDateHeure(detail.publishRestrictedUntil)} />}
                {detail.replyRestrictedUntil && <InfoLine label="Réponses bloquées jusqu'au" value={formaterDateHeure(detail.replyRestrictedUntil)} />}
                {detail.profile?.city && <InfoLine label="Ville" value={detail.profile.city} />}
                {detail.profile?.age && <InfoLine label="Âge" value={`${detail.profile.age} ans`} />}
                {detail.profile?.bio && (
                  <InfoLine label="Bio" value={<span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{clip(detail.profile.bio, 220)}</span>} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/profil/${detail.id}`} className="btn btn-secondary btn-sm" onClick={onClose}>
                  Ouvrir le profil public
                </Link>
                <Link href="/admin/moderation" className="btn btn-ghost btn-sm" onClick={onClose}>
                  Rester en modération
                </Link>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <StatCard label="Annonces" value={detail.stats.announcements} />
                <StatCard label="Sujets" value={detail.stats.topics} />
                <StatCard label="Réponses" value={detail.stats.posts} />
                <StatCard label="Conversations" value={detail.stats.conversations} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <StatCard label="Signalements faits" value={detail.stats.reportsMade} />
                <StatCard label="Signalements reçus" value={detail.stats.reportsReceived} tone={detail.stats.reportsReceived > 0 ? 'var(--warning)' : undefined} />
                <StatCard label="Ouverts contre lui" value={detail.stats.openReportsReceived} tone={detail.stats.openReportsReceived > 0 ? 'var(--danger)' : undefined} />
                <StatCard label="Tokens" value={detail.tokenBalance?.balance ?? 0} tone="var(--primary)" />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Contenus récents</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {detail.recentAnnouncements.length === 0 && detail.recentTopics.length === 0 && detail.recentPosts.length === 0 && (
                  <div className="empty-state" style={{ minHeight: 140 }}>
                    <span className="empty-state-icon">📭</span>
                    <p>Aucun contenu récent.</p>
                  </div>
                )}

                {detail.recentAnnouncements.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Annonces
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {detail.recentAnnouncements.map((item) => (
                        <Link key={item.id} href={`/annonces/${item.id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              {item.category} {item.region ? `· ${item.region}` : ''} · {formaterDate(item.createdAt)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                              {item._count.likes} j'aime · {item._count.favorites} favoris
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {detail.recentTopics.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Sujets forum
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {detail.recentTopics.map((item) => (
                        <Link key={item.id} href={`/forum/${item.id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              {item.category} · {formaterDate(item.createdAt)} {item.closed ? '· fermé' : ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                              {item._count.posts} réponses · {item._count.likes} j'aime
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {detail.recentPosts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Réponses récentes
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {detail.recentPosts.map((item) => (
                        <Link key={item.id} href={`/forum/${item.topic.id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                              Dans {item.topic.isAnnouncement ? 'une annonce' : 'un sujet'}: <strong>{item.topic.title}</strong>
                            </div>
                            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{clip(toPlainTextPreview(item.body), 220)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                              {formaterDateHeure(item.createdAt)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Signalements reçus</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {detail.reportsReceived.length === 0 && <p className="loading-text" style={{ textAlign: 'left' }}>Aucun signalement direct reçu.</p>}
                  {detail.reportsReceived.map((report) => (
                    <div key={report.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{report.reporter.displayName}</div>
                        <StatusBadge status={report.status} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                        {clip(report.reason, 160)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                        {formaterDateHeure(report.createdAt)}
                        {report.handledBy ? ` · traité par ${report.handledBy.displayName}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Signalements effectués</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {detail.reportsMade.length === 0 && <p className="loading-text" style={{ textAlign: 'left' }}>Aucun signalement effectué.</p>}
                  {detail.reportsMade.map((report) => (
                    <div key={report.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{labelCible[report.targetType] ?? report.targetType}</div>
                        <StatusBadge status={report.status} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                        {clip(report.reason, 160)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                        {formaterDateHeure(report.createdAt)}
                        {report.handledBy ? ` · traité par ${report.handledBy.displayName}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Actions de modération</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {detail.moderationActions.length === 0 && <p className="loading-text" style={{ textAlign: 'left' }}>Aucune action enregistrée.</p>}
                  {detail.moderationActions.map((action) => (
                    <div key={action.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{action.actionType}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formaterDateHeure(action.createdAt)}</div>
                      </div>
                      {action.reason && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>{action.reason}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>par {action.actor.displayName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ReportDetailModal({
  reportId,
  onClose,
  onChanged,
  onOpenUser,
  canAwardTokens,
}: {
  reportId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onOpenUser?: (id: string) => void;
  canAwardTokens?: boolean;
}) {
  const [detail, setDetail] = React.useState<SignalementDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [resolutionReason, setResolutionReason] = React.useState('');

  const refresh = React.useCallback(async () => {
    if (!reportId) return;
    setError(null);
    setSuccess(null);
    try {
      const data = await apiFetch<SignalementDetail>(`/moderation/reports/${reportId}`);
      setDetail(data);
      setResolutionReason(data.resolutionReason ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger ce dossier.');
    }
  }, [reportId]);

  React.useEffect(() => {
    if (!reportId) return;
    setDetail(null);
    void refresh();
  }, [reportId, refresh]);

  if (!reportId) return null;

  const targetLink = detail ? getTargetLink(detail) : null;
  const targetUserId = detail ? getTargetUserId(detail) : null;
  const userTarget = detail?.target?.type === 'USER' ? detail.target.user ?? null : null;
  const topicTarget = detail?.target?.type === 'TOPIC' ? detail.target.topic ?? null : null;
  const postTarget = detail?.target?.type === 'POST' ? detail.target.post ?? null : null;
  const messageTarget = detail?.target?.type === 'MESSAGE' ? detail.target.message ?? null : null;

  async function runContentAction(
    action:
      | 'HIDE_TOPIC'
      | 'RESTORE_TOPIC'
      | 'HIDE_POST'
      | 'RESTORE_POST'
      | 'HIDE_MESSAGE'
      | 'RESTORE_MESSAGE'
      | 'REMOVE_AVATAR'
      | 'CLEAR_BIO',
    targetId: string,
    label: string,
  ) {
    const reason = window.prompt(`Motif pour: ${label}`, 'Non-respect des règles de la communauté.');
    if (!reason) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/moderation/content-actions', {
        method: 'POST',
        body: JSON.stringify({ action, targetId, reason }),
      });
      setSuccess('Action de contenu appliquée.');
      await refresh();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’appliquer cette action de contenu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDecision(decision: 'IN_REVIEW' | 'DISMISS' | 'REWARD') {
    if (!detail) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/moderation/reports/${detail.id}`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          resolutionReason: resolutionReason.trim() || undefined,
        }),
      });
      setSuccess(decision === 'REWARD' ? 'Signalement récompensé et archivé.' : 'Décision enregistrée.');
      await refresh();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’enregistrer la décision.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={detail ? `Signalement #${detail.id.slice(0, 8)}` : 'Chargement du dossier'}
      subtitle="Vue de traitement avec contexte, cible réelle et décision staff."
      onClose={onClose}
    >
      {error && <div className="error-text" style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="success-text" style={{ marginBottom: 20 }}>{success}</div>}
      {!detail && !error && <p className="loading-text">Chargement du dossier…</p>}

      {detail && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.9fr', gap: 20 }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    Signalement {labelCible[detail.targetType] ?? detail.targetType}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>
                    {clip(detail.reason, 180)}
                  </div>
                </div>
                <StatusBadge status={detail.status} />
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <InfoLine label="Créé le" value={formaterDateHeure(detail.createdAt)} />
                <InfoLine label="Reporter" value={`${detail.reporter.displayName} · ${detail.reporter.email}`} />
                <InfoLine label="Traité par" value={detail.handledBy ? detail.handledBy.displayName : 'Pas encore attribué'} />
                <InfoLine
                  label="Motif"
                  value={<span style={{ lineHeight: 1.7, color: 'var(--text-muted)' }}>{detail.reason}</span>}
                />
                {detail.resolutionReason && (
                  <InfoLine
                    label="Décision"
                    value={<span style={{ lineHeight: 1.7, color: 'var(--text-muted)' }}>{detail.resolutionReason}</span>}
                  />
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Cible signalée</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {targetLink && (
                    <Link href={targetLink} className="btn btn-secondary btn-sm" onClick={onClose}>
                      Ouvrir le contenu
                    </Link>
                  )}
                  {topicTarget && (
                    <button
                      type="button"
                      className={topicTarget.hiddenAt ? 'btn btn-secondary btn-sm' : 'btn btn-danger btn-sm'}
                      onClick={() =>
                        void runContentAction(
                          topicTarget.hiddenAt ? 'RESTORE_TOPIC' : 'HIDE_TOPIC',
                          topicTarget.id,
                          topicTarget.hiddenAt ? 'restaurer cette annonce/sujet' : 'masquer cette annonce/sujet',
                        )
                      }
                    >
                      {topicTarget.hiddenAt ? 'Restaurer le contenu' : 'Masquer le contenu'}
                    </button>
                  )}
                  {postTarget && (
                    <button
                      type="button"
                      className={postTarget.hiddenAt ? 'btn btn-secondary btn-sm' : 'btn btn-danger btn-sm'}
                      onClick={() =>
                        void runContentAction(
                          postTarget.hiddenAt ? 'RESTORE_POST' : 'HIDE_POST',
                          postTarget.id,
                          postTarget.hiddenAt ? 'restaurer cette réponse' : 'masquer cette réponse',
                        )
                      }
                    >
                      {postTarget.hiddenAt ? 'Restaurer la réponse' : 'Masquer la réponse'}
                    </button>
                  )}
                  {messageTarget && (
                    <button
                      type="button"
                      className={messageTarget.hiddenAt ? 'btn btn-secondary btn-sm' : 'btn btn-danger btn-sm'}
                      onClick={() =>
                        void runContentAction(
                          messageTarget.hiddenAt ? 'RESTORE_MESSAGE' : 'HIDE_MESSAGE',
                          messageTarget.id,
                          messageTarget.hiddenAt ? 'restaurer ce message privé' : 'masquer ce message privé',
                        )
                      }
                    >
                      {messageTarget.hiddenAt ? 'Restaurer le message' : 'Masquer le message'}
                    </button>
                  )}
                  {userTarget && (
                    <>
                      {userTarget.avatarUrl && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => void runContentAction('REMOVE_AVATAR', userTarget.id, 'retirer l avatar')}
                        >
                          Retirer l avatar
                        </button>
                      )}
                      {userTarget.profile?.bio && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => void runContentAction('CLEAR_BIO', userTarget.id, 'effacer la bio')}
                        >
                          Effacer la bio
                        </button>
                      )}
                    </>
                  )}
                  {targetUserId && onOpenUser && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenUser(targetUserId)}>
                      Ouvrir le dossier utilisateur
                    </button>
                  )}
                </div>
              </div>

              {!detail.target || detail.target.exists === false ? (
                <div className="empty-state" style={{ minHeight: 140 }}>
                  <span className="empty-state-icon">🕳️</span>
                  <p>La cible n’existe plus. Le dossier peut néanmoins être clôturé.</p>
                </div>
              ) : detail.target.type === 'USER' && detail.target.user ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <Avatar name={detail.target.user.displayName} src={detail.target.user.avatarUrl} size="lg" />
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{detail.target.user.displayName}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{detail.target.user.email}</div>
                      <div style={{ fontSize: 12, marginTop: 6, color: colorGrade[detail.target.user.trustLevel] ?? 'var(--text)' }}>
                        {labelGrade[detail.target.user.trustLevel] ?? detail.target.user.trustLevel}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    <StatCard label="Sujets" value={detail.target.user._count.forumTopics} />
                    <StatCard label="Réponses" value={detail.target.user._count.forumPosts} />
                    <StatCard label="Signalements faits" value={detail.target.user._count.reportsMade} />
                  </div>
                  {detail.target.user.profile?.bio && (
                    <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {clip(detail.target.user.profile.bio, 280)}
                    </div>
                  )}
                </div>
              ) : detail.target.type === 'TOPIC' && detail.target.topic ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{detail.target.topic.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {detail.target.topic.isAnnouncement ? 'Annonce' : 'Sujet forum'} · {detail.target.topic.category}
                    {detail.target.topic.region ? ` · ${detail.target.topic.region}` : ''}
                    {' · '}
                    par {detail.target.topic.author.displayName}
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
                    {clip(toPlainTextPreview(detail.target.topic.body), 420)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {detail.target.topic._count.posts} réponses · {detail.target.topic._count.likes} j'aime · {detail.target.topic._count.favorites} favoris
                  </div>
                  {detail.target.topic.hiddenAt && (
                    <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                      Contenu masqué le {formaterDateHeure(detail.target.topic.hiddenAt)}
                      {detail.target.topic.hiddenReason ? ` · ${detail.target.topic.hiddenReason}` : ''}
                    </div>
                  )}
                </div>
              ) : detail.target.type === 'POST' && detail.target.post ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    Réponse dans <strong>{detail.target.post.topic.title}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    par {detail.target.post.author.displayName} · {formaterDateHeure(detail.target.post.createdAt)}
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
                    {clip(toPlainTextPreview(detail.target.post.body), 420)}
                  </div>
                  {detail.target.post.hiddenAt && (
                    <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                      Réponse masquée le {formaterDateHeure(detail.target.post.hiddenAt)}
                      {detail.target.post.hiddenReason ? ` · ${detail.target.post.hiddenReason}` : ''}
                    </div>
                  )}
                </div>
              ) : detail.target.type === 'MESSAGE' && detail.target.message ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    Message privé de {detail.target.message.sender.displayName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Conversation entre {detail.target.message.conversation.user1.displayName} et {detail.target.message.conversation.user2.displayName}
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
                    {clip(detail.target.message.content, 420)}
                  </div>
                  {detail.target.message.hiddenAt && (
                    <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                      Message masqué le {formaterDateHeure(detail.target.message.hiddenAt)}
                      {detail.target.message.hiddenReason ? ` · ${detail.target.message.hiddenReason}` : ''}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Historique proche sur la même cible</div>
              {detail.recentRelated.length === 0 ? (
                <p className="loading-text" style={{ textAlign: 'left' }}>Aucun autre signalement récent sur cette cible.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {detail.recentRelated.map((item) => (
                    <div key={item.id} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{item.reporter.displayName}</div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{clip(item.reason, 180)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{formaterDateHeure(item.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Reporter</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <InfoLine label="Nom" value={detail.reporter.displayName} />
                <InfoLine label="Email" value={detail.reporter.email} />
                <InfoLine label="Grade" value={labelGrade[detail.reporter.trustLevel] ?? detail.reporter.trustLevel} />
                <InfoLine label="Inscrit le" value={formaterDate(detail.reporter.createdAt)} />
                <InfoLine label="Actif" value={timeAgo(detail.reporter.lastActiveAt)} />
                {onOpenUser && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenUser(detail.reporter.id)}>
                    Ouvrir le dossier du reporter
                  </button>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 18, display: 'grid', gap: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Décision staff</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                La récompense applique un montant fixe, passe le signalement en résolu, puis l’archive dans l’historique réservé au super admin.
              </div>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Note interne / motif</span>
                <textarea
                  className="textarea"
                  rows={5}
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="Explique la décision prise, ce qui a été constaté, ou les éléments utiles pour le prochain staff."
                />
              </label>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => void handleDecision('IN_REVIEW')}>
                  {saving ? 'Enregistrement...' : 'Prendre en charge'}
                </button>
                <button type="button" className="btn btn-danger" disabled={saving} onClick={() => void handleDecision('DISMISS')}>
                  {saving ? 'Enregistrement...' : 'Rejeter'}
                </button>
                {canAwardTokens && (
                  <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleDecision('REWARD')}>
                    {saving ? 'Enregistrement...' : 'Récompenser (+20 tokens)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function OngletSignalements({
  isSuperAdmin,
  onOpenUser,
}: {
  isSuperAdmin: boolean;
  onOpenUser: (id: string) => void;
}) {
  const [items, setItems] = React.useState<Signalement[]>([]);
  const [filter, setFilter] = React.useState<'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [view, setView] = React.useState<'active' | 'archived'>('active');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Signalement[]>(`/moderation/reports${view === 'archived' ? '?archived=true' : ''}`);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = items.filter((item) => (filter === 'ALL' ? true : item.status === filter));
  const stats = {
    open: items.filter((item) => item.status === 'OPEN').length,
    review: items.filter((item) => item.status === 'IN_REVIEW').length,
    resolved: items.filter((item) => item.status === 'RESOLVED').length,
    dismissed: items.filter((item) => item.status === 'DISMISSED').length,
  };

  return (
    <>
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <StatCard label="Ouverts" value={stats.open} tone={stats.open > 0 ? 'var(--warning)' : undefined} />
          <StatCard label="En examen" value={stats.review} />
          <StatCard label="Acceptés" value={stats.resolved} tone="var(--success)" />
          <StatCard label="Rejetés" value={stats.dismissed} tone="var(--text-muted)" />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>Signalements</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Depuis ici, tu ouvres un dossier, tu regardes la cible réelle, puis tu prends une décision tracée.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(labelStatut).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={filter === key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setFilter(key as typeof filter)}
                >
                  {label}
                </button>
              ))}
              {isSuperAdmin && (
                <button
                  type="button"
                  className={view === 'archived' ? 'btn btn-secondary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setView((current) => current === 'active' ? 'archived' : 'active')}
                >
                  {view === 'archived' ? 'Voir les actifs' : 'Archives'}
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>
                Actualiser
              </button>
            </div>
          </div>

          {error && <div className="error-text">{error}</div>}
          {loading ? (
            <p className="loading-text">Chargement des signalements…</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 220 }}>
              <span className="empty-state-icon">🧹</span>
              <p>Aucun signalement pour ce filtre.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filtered.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    padding: 16,
                    display: 'grid',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <StatusBadge status={item.status} />
                        <span className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                          {labelCible[item.targetType] ?? item.targetType}
                        </span>
                        {item.archivedAt && (
                          <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.18)', color: 'var(--text-dim)' }}>
                            Archivé
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {item.archivedAt ? `Archivé le ${formaterDateHeure(item.archivedAt)}` : `Créé le ${formaterDateHeure(item.createdAt)}`}
                      </div>
                    </div>

                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedReportId(item.id)}>
                      Ouvrir le dossier
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div
                      style={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.02)',
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                        Reporter
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                        {item.reporter.displayName}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.02)',
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                        Motif
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
                        {clip(item.reason, 220)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReportDetailModal
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onChanged={refresh}
        onOpenUser={isSuperAdmin ? onOpenUser : undefined}
        canAwardTokens
      />
    </>
  );
}

function OngletUtilisateurs({ onOpenUser }: { onOpenUser: (id: string) => void }) {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<UserItem[]>('/users');
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredUsers = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.id.toLowerCase().includes(query)
      || user.displayName.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query),
    );
  }, [search, users]);

  async function handleRole(userId: string, current: string) {
    const next = window.prompt('Nouveau rang: new, member, moderator ou super_admin', current);
    if (!next || next === current) return;
    try {
      await apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ trustLevel: next }),
      });
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Impossible de changer le rang.');
    }
  }

  async function handleDelete(userId: string, displayName: string) {
    const confirmed = window.confirm(
      `Supprimer ${displayName} ?\n\nCette suppression est maintenant modérée: le compte est désactivé, anonymisé, et ses contenus publics sont masqués.`,
    );
    if (!confirmed) return;
    try {
      await apiFetch(`/users/${userId}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Impossible de supprimer ce compte.');
    }
  }

  async function handleSanction(
    userId: string,
    action:
      | 'ACTIVATE'
      | 'SUSPEND_7D'
      | 'SUSPEND_30D'
      | 'BAN_30D'
      | 'BAN_PERMANENT'
      | 'MUTE_CHAT_7D'
      | 'BLOCK_PUBLISH_30D'
      | 'BLOCK_REPLY_30D'
      | 'CLEAR_RESTRICTIONS',
    displayName: string,
  ) {
    const reason = window.prompt(`Motif pour ${displayName}`, action === 'ACTIVATE' ? 'Réactivation du compte.' : 'Non-respect des règles de la communauté.');
    if (!reason) return;
    try {
      await apiFetch(`/users/${userId}/sanction`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Impossible d’appliquer cette sanction.');
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 'min(100%, 560px)' }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Utilisateurs</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Recherche par ID, pseudo ou e-mail, puis accès direct au dossier et aux actions de modération.
          </div>
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            <input
              className="form-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur par ID, pseudo ou e-mail..."
              spellCheck={false}
            />
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Tu peux coller directement l’identifiant copié depuis le profil ou depuis une action liée à un membre.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>
            Actualiser
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      {loading ? (
        <p className="loading-text">Chargement des utilisateurs…</p>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredUsers.length === 0 && (
            <div className="empty-state" style={{ minHeight: 180 }}>
              <span className="empty-state-icon">🔎</span>
              <p>Aucun utilisateur ne correspond à cette recherche.</p>
            </div>
          )}

          {filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                border: '1px solid var(--border)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                borderRadius: 18,
                padding: 18,
                display: 'grid',
                gap: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                        {user.displayName}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--surface-3)',
                          border: '1px solid var(--border)',
                          color: colorGrade[user.trustLevel] ?? 'var(--text)',
                          fontWeight: 700,
                        }}
                      >
                        {labelGrade[user.trustLevel] ?? user.trustLevel}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--surface-3)',
                          border: '1px solid var(--border)',
                          color: colorCompte[user.accountStatus],
                          fontWeight: 700,
                        }}
                      >
                        {labelCompte[user.accountStatus]}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 15, color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                      {user.email}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-dim)' }}>
                      <span>ID {user.id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>Inscrit le {formaterDate(user.createdAt)}</span>
                      <span>•</span>
                      <span>Dernière activité {timeAgo(user.lastActiveAt)}</span>
                      <span>•</span>
                      <span>{user._count.forumTopics} sujets</span>
                      <span>•</span>
                      <span>{user._count.forumPosts} réponses</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenUser(user.id)}>
                    Ouvrir le dossier
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleRole(user.id, user.trustLevel)}>
                    Modifier le rang
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    État du compte
                  </div>
                  <div style={{ display: 'grid', gap: 6, fontSize: 14, color: 'var(--text)' }}>
                    <div>
                      <strong style={{ color: colorCompte[user.accountStatus] }}>{labelCompte[user.accountStatus]}</strong>
                    </div>
                    {user.suspendedUntil && <div>Suspendu jusqu’au {formaterDate(user.suspendedUntil)}</div>}
                    {user.canReRegisterAfter && <div>Recréation possible après {formaterDate(user.canReRegisterAfter)}</div>}
                    {user.moderationReason && <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{user.moderationReason}</div>}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Restrictions actives
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {user.chatRestrictedUntil && (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.24)', color: 'var(--warning)' }}>
                        Chat bloqué jusqu’au {formaterDate(user.chatRestrictedUntil)}
                      </span>
                    )}
                    {user.publishRestrictedUntil && (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.24)', color: 'var(--danger)' }}>
                        Publication bloquée jusqu’au {formaterDate(user.publishRestrictedUntil)}
                      </span>
                    )}
                    {user.replyRestrictedUntil && (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.24)', color: '#93c5fd' }}>
                        Réponses bloquées jusqu’au {formaterDate(user.replyRestrictedUntil)}
                      </span>
                    )}
                    {!user.chatRestrictedUntil && !user.publishRestrictedUntil && !user.replyRestrictedUntil && (
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucune restriction active.</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSanction(user.id, 'SUSPEND_7D', user.displayName)}>
                  Suspendre 7 jours
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSanction(user.id, 'BAN_30D', user.displayName)}>
                  Bannir 30 jours
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSanction(user.id, 'MUTE_CHAT_7D', user.displayName)}>
                  Mute chat 7 jours
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSanction(user.id, 'BLOCK_PUBLISH_30D', user.displayName)}>
                  Bloquer publication 30 jours
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSanction(user.id, 'BLOCK_REPLY_30D', user.displayName)}>
                  Bloquer réponses 30 jours
                </button>
                {user.accountStatus !== 'ACTIVE' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleSanction(user.id, 'ACTIVATE', user.displayName)}>
                    Réactiver le compte
                  </button>
                )}
                {(user.chatRestrictedUntil || user.publishRestrictedUntil || user.replyRestrictedUntil) && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleSanction(user.id, 'CLEAR_RESTRICTIONS', user.displayName)}>
                    Retirer les restrictions
                  </button>
                )}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDelete(user.id, user.displayName)}>
                  Supprimer le compte
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OngletFeedbacks() {
  const [items, setItems] = React.useState<FeedbackItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>('all');
  const [drafts, setDrafts] = React.useState<Record<string, { status: FeedbackItem['status']; internalNote: string; adminResponse: string }>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<FeedbackItem[]>('/feedback');
      setItems(data);
      setDrafts(
        Object.fromEntries(
          data.map((item) => [
            item.id,
            {
              status: item.status,
              internalNote: item.internalNote ?? '',
              adminResponse: item.adminResponse ?? '',
            },
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les feedbacks.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter in feedbackStatusLabel) return item.status === filter;
    return ((item.aiAnalysis?.sentiment as string | undefined) ?? 'neutral') === filter;
  });

  async function handleSave(item: FeedbackItem) {
    const draft = drafts[item.id] ?? {
      status: item.status,
      internalNote: item.internalNote ?? '',
      adminResponse: item.adminResponse ?? '',
    };
    setSavingId(item.id);
    try {
      await apiFetch(`/feedback/${item.id}/review`, {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Impossible de mettre à jour ce feedback.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Feedbacks</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Gestion produit: statut, note interne, réponse admin et lecture des signaux IA.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={filter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter('all')}>
            Tous
          </button>
          {Object.entries(feedbackStatusLabel).map(([key, label]) => (
            <button key={key} type="button" className={filter === key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
          {Object.entries(sentimentConfig).map(([key, config]) => (
            <button key={key} type="button" className={filter === key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter(key)}>
              {config.label}
            </button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>
            Actualiser
          </button>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      {loading ? (
        <p className="loading-text">Chargement des feedbacks…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 220 }}>
          <span className="empty-state-icon">📬</span>
          <p>Aucun feedback pour ce filtre.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((item) => {
            const parsed = parseFeedbackContent(item.content);
            const sentimentKey = ((item.aiAnalysis?.sentiment as string | undefined) ?? 'neutral').toLowerCase();
            const sentiment = sentimentConfig[sentimentKey] ?? sentimentConfig.neutral;
            const draft = drafts[item.id] ?? {
              status: item.status,
              internalNote: item.internalNote ?? '',
              adminResponse: item.adminResponse ?? '',
            };
            return (
              <div key={item.id} style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.user.displayName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                      {formaterDateHeure(item.createdAt)}
                      {item.reviewedBy ? ` · revu par ${item.reviewedBy.displayName}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                      {feedbackStatusLabel[item.status]}
                    </span>
                    {parsed.category && (
                      <span className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                        {parsed.category}
                      </span>
                    )}
                    <span className="badge" style={{ color: sentiment.color, background: sentiment.bg, border: `1px solid ${sentiment.bg}` }}>
                      {sentiment.label}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7 }}>{parsed.body}</div>

                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {item.aiAnalysis?.summary && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text)' }}>Résumé IA:</strong> {item.aiAnalysis.summary}
                    </div>
                  )}
                  {item.aiAnalysis?.tags && item.aiAnalysis.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.aiAnalysis.tags.map((tag) => (
                        <span key={tag} className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Statut produit
                    </span>
                    <select
                      className="input"
                      value={draft.status}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: {
                            ...draft,
                            status: e.target.value as FeedbackItem['status'],
                          },
                        }))
                      }
                    >
                      {Object.entries(feedbackStatusLabel).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Note interne
                    </span>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={draft.internalNote}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: {
                            ...draft,
                            internalNote: e.target.value,
                          },
                        }))
                      }
                      placeholder="Ce que l’équipe retient, ce qui doit être fait, ou pourquoi c’est rejeté."
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Réponse admin
                    </span>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={draft.adminResponse}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: {
                            ...draft,
                            adminResponse: e.target.value,
                          },
                        }))
                      }
                      placeholder="Réponse prête pour plus tard si tu veux remercier ou répondre au membre."
                    />
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      Dernière mise à jour: {formaterDateHeure(item.updatedAt)}
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" disabled={savingId === item.id} onClick={() => void handleSave(item)}>
                      {savingId === item.id ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OngletJournal() {
  const [items, setItems] = React.useState<ModerationActionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>('all');

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ModerationActionItem[]>('/moderation/actions');
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le journal admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = items.filter((item) => (filter === 'all' ? true : item.targetType === filter));

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Journal admin</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Historique central des décisions staff: rôles, sanctions, actions de contenu et traitement des signalements.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={filter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter('all')}>
            Tout
          </button>
          {['USER', 'TOPIC', 'POST', 'FEEDBACK'].map((key) => (
            <button key={key} type="button" className={filter === key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter(key)}>
              {targetTypeLabel[key] ?? key}
            </button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>
            Actualiser
          </button>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      {loading ? (
        <p className="loading-text">Chargement du journal admin…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 220 }}>
          <span className="empty-state-icon">📒</span>
          <p>Aucune action pour ce filtre.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                    {item.actionType}
                  </span>
                  <span className="badge" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                    {targetTypeLabel[item.targetType] ?? item.targetType}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formaterDateHeure(item.createdAt)}</div>
              </div>

              <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
                {item.reason ?? 'Aucun motif renseigné.'}
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Par {item.actor.displayName}</span>
                {item.targetId && <span>· cible {item.targetId.slice(0, 8)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageModeration() {
  const router = useRouter();
  const { utilisateur, authResolved } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'signalements' | 'feedbacks' | 'utilisateurs' | 'journal'>('signalements');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const isStaff = utilisateur?.trustLevel === 'moderator' || utilisateur?.trustLevel === 'super_admin';
  const isSuperAdmin = utilisateur?.trustLevel === 'super_admin';

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'feedbacks' || tab === 'utilisateurs' || tab === 'signalements' || tab === 'journal') {
      setActiveTab(tab);
    }
  }, []);

  React.useEffect(() => {
    if (!authResolved) return;
    if (!utilisateur) {
      router.replace('/connexion?redirect=/admin/moderation');
      return;
    }
    if (!isStaff) {
      router.replace('/dashboard');
    }
  }, [authResolved, utilisateur, isStaff, router]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [activeTab]);

  if (!authResolved || !utilisateur) {
    return (
      <div className="page-content" style={{ paddingTop: 40 }}>
        <p className="loading-text">Chargement de la modération…</p>
      </div>
    );
  }

  if (!isStaff) {
    return null;
  }

  const tabs = [
    { id: 'signalements' as const, label: 'Signalements', visible: true },
    { id: 'journal' as const, label: 'Journal', visible: true },
    { id: 'feedbacks' as const, label: 'Feedbacks', visible: isSuperAdmin },
    { id: 'utilisateurs' as const, label: 'Utilisateurs', visible: isSuperAdmin },
  ].filter((tab) => tab.visible);

  return (
    <div className="page-content" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 1500 }}>
      <div style={{ display: 'grid', gap: 18 }}>
        <div className="card" style={{ padding: 22, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Centre de modération
              </div>
              <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 3vw, 2.8rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                Gérer, comprendre, décider.
              </h1>
              <p style={{ margin: '10px 0 0', maxWidth: 820, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Cette version ne se contente plus d’afficher des listes. Tu peux ouvrir un dossier, voir la cible réelle,
                consulter le contexte utilisateur, puis poser une décision staff tracée.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'signalements' && (
          <OngletSignalements isSuperAdmin={isSuperAdmin} onOpenUser={setSelectedUserId} />
        )}
        {activeTab === 'journal' && <OngletJournal />}
        {activeTab === 'feedbacks' && isSuperAdmin && <OngletFeedbacks />}
        {activeTab === 'utilisateurs' && isSuperAdmin && <OngletUtilisateurs onOpenUser={setSelectedUserId} />}
      </div>

      <UserAdminModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
