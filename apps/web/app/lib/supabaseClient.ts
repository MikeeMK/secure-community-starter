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

export async function triggerEmailConfirmation(email: string, password: string) {
  if (!supabase) return { ok: false as const, skipped: true, message: 'Supabase non configuré' };
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/connexion` : undefined },
  });
  if (error && error.message?.toLowerCase().includes('already registered')) {
    return { ok: true as const, already: true, message: 'Compte déjà enregistré côté Supabase.' };
  }
  if (error) {
    return { ok: false as const, skipped: false, message: error.message };
  }
  return { ok: true as const, already: false, message: 'E-mail de confirmation envoyé.' };
}

export async function checkSupabaseLogin(email: string, password: string) {
  if (!supabase) return { ok: true as const, skipped: true };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const notConfirmed =
      error.message.toLowerCase().includes('email not confirmed') ||
      error.message.toLowerCase().includes('confirm your email');
    return {
      ok: false as const,
      skipped: false,
      message: notConfirmed
        ? 'Merci de confirmer votre e-mail via le lien reçu avant de vous connecter.'
        : error.message,
    };
  }
  await supabase.auth.signOut().catch(() => {});
  return { ok: true as const, skipped: false };
}
