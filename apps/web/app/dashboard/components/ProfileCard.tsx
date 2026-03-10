'use client';

import Link from 'next/link';
import { Avatar } from '../../components/Avatar';

type UserProfile = {
  age?: number | null;
  city?: string | null;
  bio?: string | null;
  interests?: string[];
  gender?: string | null;
  orientation?: string | null;
  lookingFor?: string[];
};

const gradeLabel: Record<string, string> = {
  new: 'Nouveau',
  member: 'Membre',
  moderator: 'Modérateur',
  super_admin: 'Super Admin',
};

// Weights must match backend calcProfileCompletion in profile.service.ts
const STEPS = [
  { label: 'Email vérifié', weight: 20 },
  { label: 'Âge', weight: 10 },
  { label: 'Ville', weight: 10 },
  { label: 'Genre', weight: 10 },
  { label: 'Orientation', weight: 10 },
  { label: 'Bio', weight: 15 },
  { label: 'Intérêts (3+)', weight: 15 },
  { label: 'Recherche', weight: 10 },
];

export function calcCompletion(emailVerified: boolean, profile: UserProfile | null): number {
  const checks = [
    emailVerified,
    !!(profile?.age),
    !!(profile?.city),
    !!(profile?.gender),
    !!(profile?.orientation),
    !!(profile?.bio && profile.bio.length > 10),
    (profile?.interests?.length ?? 0) >= 3,
    (profile?.lookingFor?.length ?? 0) > 0,
  ];
  return checks.reduce((sum, c, i) => sum + (c ? STEPS[i].weight : 0), 0);
}

function getMissingSteps(emailVerified: boolean, profile: UserProfile | null): string[] {
  const checks = [
    emailVerified,
    !!(profile?.age),
    !!(profile?.city),
    !!(profile?.gender),
    !!(profile?.orientation),
    !!(profile?.bio && profile.bio.length > 10),
    (profile?.interests?.length ?? 0) >= 3,
    (profile?.lookingFor?.length ?? 0) > 0,
  ];
  return checks.map((c, i) => (!c ? STEPS[i].label : null)).filter(Boolean) as string[];
}

export function ProfileCard({
  displayName,
  email,
  trustLevel,
  profile,
  emailVerified,
  tokenBalance,
}: {
  displayName: string;
  email: string;
  trustLevel: string;
  profile: UserProfile | null;
  emailVerified?: boolean;
  tokenBalance?: number;
}) {
  const verified = emailVerified ?? false;
  const pct = calcCompletion(verified, profile);
  const isComplete = pct >= 100;
  const canPost = pct >= 60;
  const missing = getMissingSteps(verified, profile);

  const barColor = pct >= 100 ? 'var(--success, #22c55e)' : pct >= 60 ? 'var(--primary)' : 'var(--warning, #f59e0b)';

  return (
    <div className="card">
      <div className="profile-card-header">
        <Avatar name={displayName} size="xl" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>{displayName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="plan-badge">{gradeLabel[trustLevel] ?? trustLevel}</span>
            {tokenBalance !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                background: 'var(--primary-glow)', borderRadius: 99,
                padding: '2px 10px',
              }}>
                🪙 {tokenBalance} tokens
              </span>
            )}
          </div>
        </div>
      </div>

      {!isComplete && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Complétion du profil</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          {!canPost && (
            <p style={{ fontSize: 12, color: 'var(--warning, #f59e0b)', marginTop: 6, fontWeight: 600 }}>
              60% requis pour publier une annonce — manque : {missing.slice(0, 3).join(', ')}{missing.length > 3 ? '…' : ''}
            </p>
          )}
          {canPost && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
              Les profils complets reçoivent 4× plus d'interactions
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isComplete && (
          <Link href="/profil/modifier" className="btn btn-primary btn-sm">
            Compléter mon profil
          </Link>
        )}
        <Link href="/profil" className="btn btn-secondary btn-sm">
          Voir mon profil
        </Link>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
        Des soucis d’affichage peuvent survenir pendant la complétion. Notre équipe y travaille — rafraîchissez la page si besoin.
      </p>
    </div>
  );
}
