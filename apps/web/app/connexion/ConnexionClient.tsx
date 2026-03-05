'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';

type LoginResult = {
  user: { id: string; displayName: string; email: string; trustLevel: string };
  accessToken: string;
  captchaRequired?: boolean;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '';

export default function ConnexionClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { connecter } = useAuth();

  const [email, setEmail] = React.useState('');
  const [motDePasse, setMotDePasse] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaRequired && !captchaToken) {
      setErreur('Merci de valider le captcha pour continuer.');
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      const body = {
        email,
        password: motDePasse,
        ...(captchaToken ? { turnstileToken: captchaToken } : {}),
      };
      const resultat = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      connecter(resultat.user, resultat.accessToken);
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setCaptchaReset((v) => v + 1);
      const redirect = params.get('redirect') ?? '/forum';
      router.push(redirect);
    } catch (e) {
      if (e instanceof ApiFetchError && e.captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaToken(null);
        setCaptchaReset((v) => v + 1);
      }
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none', marginBottom: 24 }}>
            <span className="nav-logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>C</span>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Communauté</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.03em' }}>
            Bon retour
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Connectez-vous pour continuer
          </p>
        </div>

        <div className="card card-lg" style={{ background: 'rgba(17,17,20,0.9)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)' }}>
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

            <div className="form-group">
              <label className="form-label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {captchaRequired && TURNSTILE_SITE_KEY && (
              <div className="form-group">
                <TurnstileWidget
                  enabled
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setCaptchaToken}
                  resetSignal={captchaReset}
                />
              </div>
            )}

            {erreur && (
              <div className="error-text">
                {erreur}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={chargement}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6, padding: '12px' }}
            >
              {chargement ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <hr className="divider" style={{ margin: '20px 0' }} />

          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Pas encore membre ?{' '}
            <Link href="/inscription" style={{ fontWeight: 700, color: 'var(--primary)' }}>
              Créer un compte
            </Link>
          </p>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 20 }}>
          En vous connectant, vous acceptez nos{' '}
          <Link href="/legal/cgu" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>CGU</Link>
          {' '}et notre{' '}
          <Link href="/legal/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
