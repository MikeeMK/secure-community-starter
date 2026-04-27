import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AGE_GATE_ACCEPTED,
  AGE_GATE_COOKIE_NAME,
  AGE_GATE_DECLINED,
  normalizeAgeGateRedirectTarget,
} from './app/lib/age-gate';

// Toujours privées, même si un préfixe parent est public
function estToujoursPrivee(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/compte') ||
    pathname.startsWith('/messagerie') ||
    pathname.startsWith('/mes-annonces') ||
    pathname.startsWith('/admin') ||
    pathname === '/profil/modifier' ||
    pathname.startsWith('/profil/modifier/') ||
    pathname === '/annonces/favoris' ||
    pathname.startsWith('/annonces/favoris/') ||
    // /annonces/[id]/modifier
    (pathname.startsWith('/annonces/') && pathname.endsWith('/modifier'))
  );
}

// Accessibles sans compte (navigation publique)
const PREFIXES_PUBLICS = [
  '/',
  '/connexion',
  '/inscription',
  '/login',
  '/register',
  '/auth',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/verifier-email',
  '/legal',
  '/faq',
  '/changelog',
  '/majorite',
  '/acces-interdit',
  // Navigation publique — lecture seule
  '/annonces',
  '/forum',
  '/groupes',
  '/groups',
  '/membres',
  '/profil',
  '/profile',
];

function estPublique(pathname: string): boolean {
  return PREFIXES_PUBLICS.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== '/' && pathname.startsWith(prefix + '/')),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ageGate = request.cookies.get(AGE_GATE_COOKIE_NAME)?.value;
  const surPageMajorite = pathname === '/majorite' || pathname.startsWith('/majorite/');
  const surPageBlocage = pathname === '/acces-interdit' || pathname.startsWith('/acces-interdit/');

  // ── 1. Age gate ───────────────────────────────────────────────────────────
  if (ageGate === AGE_GATE_DECLINED && !surPageBlocage) {
    const url = request.nextUrl.clone();
    url.pathname = '/acces-interdit';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (ageGate !== AGE_GATE_ACCEPTED && ageGate !== AGE_GATE_DECLINED) {
    if (!surPageMajorite) {
      const url = request.nextUrl.clone();
      url.pathname = '/majorite';
      url.search = '';
      url.searchParams.set('next', normalizeAgeGateRedirectTarget(`${pathname}${search}`));
      return NextResponse.redirect(url);
    }
  }

  if (ageGate === AGE_GATE_ACCEPTED && (surPageMajorite || surPageBlocage)) {
    const url = request.nextUrl.clone();
    url.pathname = normalizeAgeGateRedirectTarget(request.nextUrl.searchParams.get('next'));
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (ageGate === AGE_GATE_DECLINED && surPageMajorite) {
    const url = request.nextUrl.clone();
    url.pathname = '/acces-interdit';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!ageGate && surPageBlocage) {
    const url = request.nextUrl.clone();
    url.pathname = '/majorite';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // ── 2. Auth ───────────────────────────────────────────────────────────────
  const cookieAuth = request.cookies.get('community_auth');

  // Les routes toujours privées passent avant la vérification publique
  if (estToujoursPrivee(pathname)) {
    if (!cookieAuth?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Routes de navigation publique : accessibles sans compte
  if (estPublique(pathname)) {
    return NextResponse.next();
  }

  // Tout le reste nécessite un compte
  if (!cookieAuth?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
