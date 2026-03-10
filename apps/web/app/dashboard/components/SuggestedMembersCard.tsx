'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '../../components/Avatar';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';

type Member = {
  id: string;
  displayName: string;
  trustLevel: string;
  lastActiveAt: string | null;
  profile: { city?: string | null; age?: number | null; interests?: string[] } | null;
};

export function SuggestedMembersCard({ hasProfile }: { hasProfile: boolean }) {
  const [members, setMembers] = React.useState<Member[] | null>(null);

  React.useEffect(() => {
    if (!hasProfile) return;
    apiFetch<Member[]>('/profile/members').then(setMembers).catch(() => setMembers([]));
  }, [hasProfile]);

  if (!hasProfile) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Complétez votre profil pour recevoir des suggestions de membres.
        </p>
        <Link href="/profil/modifier" className="btn btn-primary btn-sm">
          Compléter mon profil
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Membres suggérés</div>

      {!members && <p className="loading-text" style={{ fontSize: 13 }}>Chargement…</p>}
      {members && members.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0' }}>
          Aucun autre membre pour l'instant.
        </p>
      )}

      {members && members.slice(0, 4).map((m) => (
        <div key={m.id} className="member-card-mini">
          <Avatar name={m.displayName} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <UserProfileTrigger
              userId={m.id}
              displayName={m.displayName}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            >
              <span>{m.displayName}</span>
            </UserProfileTrigger>
            {(m.profile?.city || m.profile?.age) && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {[m.profile?.age && `${m.profile.age} ans`, m.profile?.city].filter(Boolean).join(' · ')}
              </div>
            )}
            {(m.profile?.interests?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {m.profile!.interests!.slice(0, 2).map((tag) => (
                  <span key={tag} className="tag" style={{ fontSize: 10, padding: '1px 6px' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <Link href={`/profil/${m.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}>
            Voir
          </Link>
        </div>
      ))}
    </div>
  );
}
