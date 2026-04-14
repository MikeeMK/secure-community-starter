'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = !!supabase;

export async function signInWithOAuthProvider(provider: 'google' | 'facebook', nextPath = '/dashboard') {
  if (!supabase) {
    return { ok: false as const, message: 'Supabase non configuré' };
  }

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const, url: data.url };
}
