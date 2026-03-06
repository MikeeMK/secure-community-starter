'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

export default function PageMotDePasseOublie() {
  const [email, setEmail] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [envoye, setEnvoye] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [devUrl, setDevUrl] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    try {
      const res = await apiFetch<{ success: boolean; devUrl?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.devUrl) setDevUrl(res.devUrl);
      setEnvoye(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none', marginBottom: 24 }}>
            <span className="nav-logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>C</span>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Communauté</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.03em' }}>
            Mot de passe oublié
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Entrez votre e-mail pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="card card-lg">
          {envoye ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{devUrl ? '🛠' : '📬'}</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {devUrl ? 'Mode dev — lien direct' : 'E-mail envoyé !'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: devUrl ? 16 : 0 }}>
                {devUrl
                  ? 'SMTP non configuré. Utilisez ce lien pour réinitialiser votre mot de passe :'
                  : 'Si un compte existe avec cette adresse, vous recevrez un lien valable 1 heure.'}
              </p>
              {devUrl && (
                <a href={devUrl} style={{ fontSize: 13, wordBreak: 'break-all', color: 'var(--primary)', textDecoration: 'underline' }}>
                  {devUrl}
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Adresse e-mail</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {erreur && <div className="error-text">{erreur}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={chargement}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {chargement ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}

          <hr className="divider" style={{ margin: '20px 0' }} />

          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            <Link href="/connexion" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
