import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUTH_COOKIE_NAME = 'community_auth';
const SESSION_ACTIONS = {
  login: '/auth/login',
  register: '/auth/register',
  'dev-login': '/auth/dev-login',
} as const;

type RouteContext = { params: { action: string } };
type UpstreamAuthResponse = { accessToken?: string };

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

function getApiBaseUrl() {
  const configured =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    `http://localhost:${process.env.API_PORT ?? 4000}`;

  if (process.env.NODE_ENV === 'production') {
    const normalized = configured.trim().toLowerCase();
    if (!normalized || normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
      throw new Error('API_BASE_URL doit pointer vers votre backend public en production.');
    }
  }

  return configured;
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

function setAuthCookie(response: NextResponse, token: string) {
  let expires: Date | undefined;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as { exp?: number };
    if (payload.exp) {
      expires = new Date(payload.exp * 1000);
    }
  } catch {
    expires = undefined;
  }

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    ...(expires ? { expires } : {}),
  });
}

function normalizeDisplayName(rawValue: unknown, email: string) {
  const emailLocalPart = email.split('@')[0] ?? 'membre';
  const fallback = emailLocalPart.replace(/[^a-zA-Z0-9._-]+/g, '').trim() || 'membre';
  const candidate = typeof rawValue === 'string' ? rawValue.trim() : '';
  const collapsed = candidate.replace(/\s+/g, ' ');
  const normalized = (collapsed || fallback).slice(0, 32).trim();

  if (normalized.length >= 2) {
    return normalized;
  }

  return `Membre ${fallback}`.slice(0, 32).trim();
}

function normalizeProvider(value: unknown) {
  return value === 'google' || value === 'facebook' ? value : null;
}

async function resolveOAuthPayload(providerAccessToken: string) {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase n’est pas configuré sur le serveur web.');
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(providerAccessToken);
  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;
  if (!user?.email) {
    throw new Error('Le provider OAuth n’a pas renvoyé d’adresse e-mail exploitable.');
  }

  const provider =
    normalizeProvider(user.app_metadata?.provider) ??
    normalizeProvider(user.identities?.[0]?.provider) ??
    normalizeProvider(user.user_metadata?.provider);

  if (!provider) {
    throw new Error('Provider OAuth non pris en charge.');
  }

  return {
    email: user.email,
    displayName: normalizeDisplayName(
      user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.user_metadata?.preferred_username,
      user.email,
    ),
    provider,
    emailVerified: Boolean(user.email_confirmed_at ?? user.user_metadata?.email_verified),
  };
}

async function proxyAuthRequest(endpoint: string, body: string, authToken?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error &&
          error.message.includes('API_BASE_URL')
            ? error.message
            : 'Backend API inaccessible. Vérifiez API_BASE_URL et le déploiement de l’API.',
      },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';

  if (!upstream.ok) {
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': contentType },
    });
  }

  const parsed = text ? (JSON.parse(text) as UpstreamAuthResponse) : {};
  const { accessToken, ...payload } = parsed;
  const response = NextResponse.json(payload, { status: upstream.status });

  if (accessToken) {
    setAuthCookie(response, accessToken);
  } else {
    clearAuthCookie(response);
  }

  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const action = context.params.action;

  if (action === 'logout') {
    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  }

  if (action === 'refresh') {
    const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!authToken) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }
    return proxyAuthRequest('/auth/refresh', '{}', authToken);
  }

  const endpoint = SESSION_ACTIONS[action as keyof typeof SESSION_ACTIONS];
  if (action === 'oauth-login') {
    const body = (await request.json().catch(() => null)) as
      | { providerAccessToken?: string }
      | null;

    if (!body?.providerAccessToken) {
      return NextResponse.json(
        { message: 'Token OAuth manquant' },
        { status: 400 },
      );
    }

    try {
      const oauthPayload = await resolveOAuthPayload(body.providerAccessToken);
      return proxyAuthRequest('/auth/oauth-login', JSON.stringify(oauthPayload));
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : 'Connexion sociale impossible.',
        },
        { status: 401 },
      );
    }
  }

  if (!endpoint) {
    return NextResponse.json({ message: 'Action inconnue' }, { status: 404 });
  }

  return proxyAuthRequest(endpoint, await request.text());
}
