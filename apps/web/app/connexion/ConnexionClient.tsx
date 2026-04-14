'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { OAuthButtons } from '../components/OAuthButtons';
import { TurnstileWidget } from '../components/TurnstileWidget';
import {
  isSupabaseConfigured,
  signInWithOAuthProvider,
} from '../lib/supabaseClient';

type LoginResult = {
  user: { id: string; displayName: string; email: string; trustLevel: string };
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
  const info =
    params.get('verified') === '1'
      ? 'Adresse e-mail confirmée. Vous pouvez maintenant vous connecter.'
      : null;

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
      const resultat = await apiFetch<LoginResult>('/api/session/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      connecter(resultat.user);
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setCaptchaReset((v) => v + 1);
      const redirect = params.get('redirect') ?? '/dashboard';
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

  async function devLogin() {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await apiFetch<LoginResult>('/api/session/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'mk.chaouch@gmail.com' }),
      });
      connecter(resultat.user);
      router.push('/dashboard');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setChargement(false);
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'facebook') {
    setChargement(true);
    setErreur(null);

    try {
      const redirect = params.get('redirect') ?? '/dashboard';
      const result = await signInWithOAuthProvider(provider, redirect);

      if (!result.ok) {
        setErreur(result.message);
        return;
      }

      if (result.url) {
        window.location.assign(result.url);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Connexion sociale impossible');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '56px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
          Bon retour
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Connectez-vous pour continuer
        </p>
      </div>

      <div className="card card-lg">
        <OAuthButtons
          disabled={chargement}
          isConfigured={isSupabaseConfigured}
          onSelect={handleOAuthLogin}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 18,
            color: 'var(--text-dim)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>ou avec votre e-mail</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

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

          {erreur && <div className="error-text">{erreur}</div>}
          {info && <div className="success-text">{info}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={chargement}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/legal/cgu" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>politique de confidentialité</Link>.
          </p>
        </form>

        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={devLogin}
              disabled={chargement}
              style={{
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(135deg,#7c3aed,#9c27b0)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                opacity: chargement ? 0.6 : 1,
              }}
            >
              ⚡ Dev — Connexion Mikee
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
        <span>
          Pas encore membre ?{' '}
          <Link href="/inscription" style={{ fontWeight: 600 }}>
            Créer un compte
          </Link>
        </span>
        <Link href="/mot-de-passe-oublie" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}
