'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '../components/Avatar';
import { PlanPill, TrustBadge } from '../components/Badge';
import { UserProfileTrigger } from '../components/UserProfileTrigger';
import { apiFetch } from '../lib/api';
import { isUserOnline } from '../lib/profile';

type Member = {
  id: string;
  displayName: string;
  trustLevel: string;
  lastActiveAt: string | null;
  profile: { city?: string | null; age?: number | null; interests?: string[] } | null;
};

export default function MembresPage() {
  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Member[]>('/profile/members')
      .then(setMembers)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Membres</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Découvrez les membres actifs de la communauté et consultez leur profil.
        </p>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {!members && !error && <p className="loading-text">Chargement des membres…</p>}

      {members && members.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">👥</span>
          <p>Aucun membre à afficher pour le moment.</p>
        </div>
      )}

      {members && members.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {members.map((member) => {
            const online = isUserOnline(member.lastActiveAt);
            return (
              <div key={member.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={member.displayName} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <UserProfileTrigger
                        userId={member.id}
                        displayName={member.displayName}
                        style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}
                      >
                        <span>{member.displayName}</span>
                      </UserProfileTrigger>
                      {online && <span className="tag tag-success">En ligne</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {member.trustLevel === 'moderator' || member.trustLevel === 'super_admin' ? (
                        <TrustBadge level={member.trustLevel} />
                      ) : (
                        <PlanPill plan={member.trustLevel} />
                      )}
                    </div>

                    {(member.profile?.age || member.profile?.city) && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {[member.profile?.age && `${member.profile.age} ans`, member.profile?.city].filter(Boolean).join(' · ')}
                      </div>
                    )}

                    {(member.profile?.interests?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {member.profile?.interests?.slice(0, 3).map((interest) => (
                          <span key={interest} className="tag tag-muted">{interest}</span>
                        ))}
                      </div>
                    )}

                    <Link href={`/profil/${member.id}`} className="btn btn-secondary btn-sm">
                      Voir le profil
                    </Link>
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
