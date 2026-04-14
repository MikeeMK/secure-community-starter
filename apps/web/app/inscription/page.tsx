'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { OAuthButtons } from '../components/OAuthButtons';
import { TurnstileWidget } from '../components/TurnstileWidget';
import {
  isSupabaseConfigured,
  signInWithOAuthProvider,
} from '../lib/supabaseClient';

type RegisterResult = {
  success: boolean;
  email: string;
  displayName: string;
  verificationRequired: boolean;
  devUrl?: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '';

export default function PageInscription() {
  const router = useRouter();

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
      const result = await apiFetch<RegisterResult>('/api/session/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          displayName: nomAffiche,
          password: motDePasse,
          turnstileToken: captchaToken ?? undefined,
        }),
      });
      setCaptchaToken(null);
      setCaptchaReset((v) => v + 1);
      const search = new URLSearchParams({
        email: result.email,
        displayName: result.displayName,
      });
      if (result.devUrl) {
        search.set('devUrl', result.devUrl);
      }
      router.push(`/inscription/confirmation?${search.toString()}`);
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

  async function handleOAuthSignup(provider: 'google' | 'facebook') {
    setChargement(true);
    setErreur(null);

    try {
      const result = await signInWithOAuthProvider(provider, '/dashboard');
      if (!result.ok) {
        setErreur(result.message);
        return;
      }

      if (result.url) {
        window.location.assign(result.url);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Inscription sociale impossible');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '56px auto' }}>
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Créer un compte</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Rejoignez la communauté gratuitement</p>
      </div>

      <div className="card card-lg">
        <OAuthButtons
          disabled={chargement}
          isConfigured={isSupabaseConfigured}
          onSelect={handleOAuthSignup}
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
          <span>ou créez un compte avec e-mail</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

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
              autoComplete="nickname"
            />
            <span className="form-hint">Ce nom sera visible par les autres membres.</span>
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
