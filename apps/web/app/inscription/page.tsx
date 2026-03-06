'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';

type RegisterResult = {
  user: { id: string; displayName: string; email: string; trustLevel: string };
  accessToken: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '';

export default function PageInscription() {
  const router = useRouter();
  const { connecter } = useAuth();

  const [email, setEmail] = React.useState('');
  const [nomAffiche, setNomAffiche] = React.useState('');
  const [motDePasse, setMotDePasse] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setErreur('Merci de valider le captcha.');
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      const result = await apiFetch<RegisterResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          displayName: nomAffiche,
          password: motDePasse,
          turnstileToken: captchaToken ?? undefined,
        }),
      });
      connecter(result.user, result.accessToken);
      setCaptchaToken(null);
      setCaptchaReset((v) => v + 1);
      router.push('/forum');
    } catch (e) {
      if (e instanceof ApiFetchError && e.captchaRequired) {
        setCaptchaToken(null);
        setCaptchaReset((v) => v + 1);
      }
      setErreur(e instanceof Error ? e.message : 'Impossible de créer le compte');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '56px auto' }}>
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none', marginBottom: 20 }}>
          <span className="nav-logo-icon" style={{ width: 36, height: 36, fontSize: 18 }}>C</span>
          <span style={{ fontWeight: 800, fontSize: 18 }}>Communauté</span>
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Créer un compte</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Rejoignez la communauté gratuitement</p>
      </div>

      <div className="card card-lg">
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">Nom d&apos;affichage</label>
            <input
              id="displayName"
              type="text"
              className="form-input"
              value={nomAffiche}
              onChange={(e) => setNomAffiche(e.target.value)}
              required
              minLength={2}
              maxLength={32}
              placeholder="Votre pseudo"
              autoComplete="username"
            />
            <span className="form-hint">Entre 2 et 32 caractères</span>
          </div>

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
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
            />
          </div>

          {TURNSTILE_SITE_KEY && (
            <div className="form-group">
              <TurnstileWidget
                enabled
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={setCaptchaToken}
                resetSignal={captchaReset}
              />
            </div>
          )}

          {erreur && <div className="error-text">{erreur}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={chargement}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {chargement ? 'Création du compte…' : 'Créer mon compte'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
            En vous inscrivant, vous acceptez les règles de la communauté.
          </p>
        </form>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
        Déjà membre ?{' '}
        <Link href="/connexion" style={{ fontWeight: 600 }}>Se connecter</Link>
      </p>
    </div>
  );
}
