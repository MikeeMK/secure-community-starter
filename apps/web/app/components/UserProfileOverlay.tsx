'use client';

import React from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { UserProfileView, type UserProfileViewData } from './UserProfileView';

type UserProfileOverlayProps = {
  userId: string;
  onClose: () => void;
};

export function UserProfileOverlay({ userId, onClose }: UserProfileOverlayProps) {
  const { utilisateur } = useAuth();
  const [profile, setProfile] = React.useState<UserProfileViewData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
    apiFetch<UserProfileViewData>(`/users/${userId}`)
      .then(setProfile)
      .catch((err) => setError(String(err)));
  }, [userId]);

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
          <UserProfileView
            profile={profile}
            mode="overlay"
            isOwnProfile={utilisateur?.id === profile.id}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
