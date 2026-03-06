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

export default function RegisterPage() {
  const router = useRouter();
  const { connecter } = useAuth();

  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Please solve the captcha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<RegisterResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          displayName,
          password,
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
      setError(e instanceof Error ? e.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto' }}>
      <div className="card">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create account</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Join the community
        </p>

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Display name</label>
            <input
              type="text"
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={32}
              placeholder="Your name"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
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

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
            By registering, you agree to the community rules.
          </p>
        </form>

        <hr className="divider" style={{ marginTop: 16 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
