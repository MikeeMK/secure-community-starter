'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function PageSecurite() {
  const { utilisateur } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [succes, setSucces] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (utilisateur === null) {
      router.push('/connexion?redirect=/compte/securite');
    }
  }, [utilisateur, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setErreur('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    setChargement(true);
    setErreur(null);
    setSucces(false);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSucces(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setChargement(false);
    }
  }

  if (!utilisateur) return null;

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/forum" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 16, letterSpacing: '-0.02em' }}>
          Sécurité du compte
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Connecté en tant que <strong>{utilisateur.email}</strong>
        </p>
      </div>

      <div className="card card-lg">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Changer le mot de passe</h2>

        {succes && (
          <div style={{
            background: 'rgba(79, 143, 139, 0.12)',
            border: '1px solid var(--primary)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: 'var(--primary)',
            fontSize: 14,
            fontWeight: 600,
          }}>
            Mot de passe modifié avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Mot de passe actuel</label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirmer le nouveau mot de passe</label>
            <input
              id="confirm"
              type="password"
              className="form-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {erreur && <div className="error-text">{erreur}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={chargement}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
          >
            {chargement ? 'Modification…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
