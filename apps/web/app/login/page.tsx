'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiFetchError, apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '';

type LoginResult = {
  user: { id: string; displayName: string; email: string; trustLevel: string };
  accessToken: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { connecter } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaRequired && !captchaToken) {
      setError('Please complete the captcha before continuing.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...(captchaToken ? { turnstileToken: captchaToken } : {}),
        }),
      });
      connecter(result.user, result.accessToken);
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setCaptchaReset((v) => v + 1);
      router.push('/forum');
    } catch (e) {
      if (e instanceof ApiFetchError && e.captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaToken(null);
        setCaptchaReset((v) => v + 1);
      }
      setError(e instanceof Error ? e.message : 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '48px auto' }}>
      <div className="card">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Log in to your account
        </p>

        <form onSubmit={handleSubmit} className="stack">
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

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <hr className="divider" style={{ marginTop: 24 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          No account?{' '}
          <Link href="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
