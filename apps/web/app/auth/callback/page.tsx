'use client';

import React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

type OAuthSessionResult = {
  user: { id: string; displayName: string; email: string; avatarUrl?: string | null; trustLevel: string; isAdultVerified?: boolean };
};

function CallbackCard({
  error,
}: {
  error?: string | null;
}) {
  return (
    <div style={{ maxWidth: 460, margin: '72px auto', padding: '0 24px' }}>
      <div className="card card-lg" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Connexion sociale indisponible</h1>
            <p className="error-text" style={{ marginBottom: 18 }}>{error}</p>
            <Link href="/connexion" className="btn btn-primary">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Connexion en cours</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Finalisation de votre session Google / Facebook…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connecter } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const providerError = searchParams.get('error_description') ?? searchParams.get('error');
    if (providerError) {
      setError(providerError);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase n’est pas configuré pour la connexion sociale.');
      return;
    }
    const supabaseClient: NonNullable<typeof supabase> = supabase;

    let cancelled = false;

    async function completeOAuthLogin() {
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;

        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error('Aucune session OAuth reçue depuis le provider.');
        }

        const result = await apiFetch<OAuthSessionResult>('/api/session/oauth-login', {
          method: 'POST',
          body: JSON.stringify({ providerAccessToken: accessToken }),
        });

        if (cancelled) return;

        connecter(result.user);
        await supabaseClient.auth.signOut().catch(() => {});

        const rawNext = searchParams.get('next') ?? '/dashboard';
        const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';
        router.replace(next);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Connexion sociale impossible.');
      }
    }

    completeOAuthLogin();

    return () => {
      cancelled = true;
    };
  }, [connecter, router, searchParams]);

  return <CallbackCard error={error} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackCard />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
