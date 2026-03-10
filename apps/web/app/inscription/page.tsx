'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { triggerEmailConfirmation } from '../lib/supabaseClient';

type RegisterResult = {
  user: { id: string; displayName: string; email: string; trustLevel: string };
  accessToken: string;
  devUrl?: string;
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
  const [info, setInfo] = React.useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);
  const [devUrl, setDevUrl] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setErreur('Merci de valider le captcha.');
      return;
    }
    setChargement(true);
    setErreur(null);
    setInfo(null);
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
      if (result.devUrl) {
        setDevUrl(result.devUrl);
      } else {
        router.push('/dashboard');
      }

      // Déclenche l'e-mail de confirmation Supabase en parallèle
      const supa = await triggerEmailConfirmation(email, motDePasse);
      if (supa.ok) {
        setInfo(supa.message);
      } else if (!supa.skipped) {
        setInfo(`Compte créé, mais l'envoi de l'e-mail a échoué : ${supa.message}`);
      }
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
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Créer un compte</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Rejoignez la communauté gratuitement</p>
      </div>

      {devUrl && (
        <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--warning)' }}>
            🛠 Mode dev — SMTP non configuré
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Cliquez sur le lien ci-dessous pour vérifier votre e-mail :
          </p>
          <a href={devUrl} style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--primary)', textDecoration: 'underline' }}>
            {devUrl}
          </a>
          <div style={{ marginTop: 12 }}>
            <a href="/forum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
              Continuer sans vérifier →
            </a>
          </div>
        </div>
      )}

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
          {info && <div className="success-text">{info}</div>}

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
