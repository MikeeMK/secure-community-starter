'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge, PlanPill } from '../../components/Badge';
import { ExpandableBio } from '../../components/ExpandableBio';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { isUserOnline, normalizeLookingForValues } from '../../lib/profile';

type ProfilUtilisateur = {
  id: string;
  displayName: string;
  trustLevel: string;
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

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 99,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      fontSize: 13, color: 'var(--text-muted)', fontWeight: 500,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 14px', borderRadius: 99,
      background: 'var(--primary-glow)', border: '1px solid var(--primary-glow-strong)',
      fontSize: 13, color: 'var(--primary)', fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

export default function PageProfilUtilisateur() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const [profil, setProfil] = React.useState<ProfilUtilisateur | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<ProfilUtilisateur>(`/users/${id}`)
      .then(setProfil)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  if (erreur) return <div className="error-text">{erreur}</div>;
  if (!profil) return <div className="loading-text">Chargement…</div>;

  const isOnline = isUserOnline(profil.lastActiveAt);
  const cover = getCoverGradient(profil.displayName);

  return (
    <div className="stack-lg" style={{ maxWidth: 1260, margin: '0 auto', padding: '0 12px' }}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
        &larr; Retour au dashboard
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ overflow: 'hidden', padding: 0, justifySelf: 'center', width: '100%', maxWidth: 480 }}>
          <div style={{ height: 150, background: cover, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 40%, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
          </div>

          <div style={{ padding: '0 22px 20px', marginTop: -34 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ borderRadius: '50%', border: '4px solid var(--surface)', marginTop: -10, background: 'var(--surface)' }}>
                <Avatar name={profil.displayName} size="xl" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>{profil.displayName}</h1>
                  <TrustBadge level={profil.trustLevel as any} />
                  <PlanPill plan={profil.trustLevel} />
                  {isOnline && <span className="tag tag-success">En ligne</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Membre depuis {formaterDate(profil.createdAt)} · {profil.profile?.city ?? 'Ville non renseignée'}
                </div>
              </div>
              {utilisateur?.id !== id && (
                <button className="btn btn-secondary btn-sm">Contacter</button>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {profil.profile?.age && <InfoChip label="Âge" value={`${profil.profile.age} ans`} />}
              {profil.profile?.gender && <InfoChip label="Genre" value={profil.profile.gender} />}
              {profil.profile?.orientation && <InfoChip label="Orientation" value={profil.profile.orientation} />}
              {profil.profile?.relationshipStatus && <InfoChip label="Statut" value={profil.profile.relationshipStatus} />}
              {profil.profile?.city && <InfoChip label="Ville" value={profil.profile.city} />}
              {profil.profile?.lookingFor && profil.profile.lookingFor.length > 0 && (
                <InfoChip label="Recherche" value={normalizeLookingForValues(profil.profile.lookingFor).join(', ')} />
              )}
            </div>

            <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Bio</h2>
              {profil.profile?.bio ? (
                <ExpandableBio text={profil.profile.bio} maxLines={5} />
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucune bio pour le moment.</p>
              )}
            </div>

            <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Centres d'intérêt</h3>
              {profil.profile?.interests && profil.profile.interests.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profil.profile.interests.map((i) => <TagChip key={i} label={i} />)}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pas encore de centres d'intérêt indiqués.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, minHeight: 320 }}>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Annonces de {profil.displayName}</h3>
            <Link href="/annonces" className="btn btn-ghost btn-xs">Voir les annonces</Link>
          </div>
          {profil.announcements && profil.announcements.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {profil.announcements.map((a) => (
                <Link key={a.id} href={`/annonces/${a.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 10, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    <div style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-3)', marginBottom: 6 }}>
                      {a.photos?.[0] ? (
                        <img src={a.photos[0]} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>Pas de photo</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.4, marginBottom: 4, color: 'var(--text)' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.category && <span className="tag tag-muted">{a.category}</span>}
                      {a.region && <span className="tag tag-muted">📍 {a.region}</span>}
                      <span>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune annonce publiée pour l'instant.</p>
          )}
        </div>
      </div>
    </div>
  );
}
