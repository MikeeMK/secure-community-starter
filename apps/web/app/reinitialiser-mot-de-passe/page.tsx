'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

function PageReinitialiserMotDePasseContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [succes, setSucces] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setSucces(true);
      setTimeout(() => router.push('/connexion'), 3000);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setChargement(false);
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card card-lg" style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ color: 'var(--text-muted)' }}>Lien invalide. Veuillez refaire une demande de réinitialisation.</p>
          <Link href="/mot-de-passe-oublie" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 24 }}>
            <img src="/logo.png" alt="Velentra" style={{ height: 160, width: 'auto' }} />
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.03em' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <div className="card card-lg">
          {succes ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Mot de passe modifié !</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Redirection vers la connexion…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack">
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
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirmer le mot de passe</label>
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
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {chargement ? 'Modification…' : 'Changer le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageReinitialiserMotDePasse() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement…</p></div>}>
      <PageReinitialiserMotDePasseContent />
    </Suspense>
  );
}
