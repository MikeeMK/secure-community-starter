import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AGE_GATE_ACCEPTED,
  AGE_GATE_COOKIE_NAME,
  AGE_GATE_DECLINED,
  normalizeAgeGateRedirectTarget,
} from './app/lib/age-gate';

// Routes accessibles sans authentification
const ROUTES_PUBLIQUES = [
  '/',
  '/connexion',
  '/inscription',
  '/auth',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/verifier-email',
  '/legal',
  '/faq',
  '/changelog',
  '/majorite',
  '/acces-interdit',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ageGate = request.cookies.get(AGE_GATE_COOKIE_NAME)?.value;
  const surPageMajorite = pathname === '/majorite' || pathname.startsWith('/majorite/');
  const surPageBlocage = pathname === '/acces-interdit' || pathname.startsWith('/acces-interdit/');

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

  // Vérifier si la route est publique
  const estPublique = ROUTES_PUBLIQUES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (estPublique) {
    return NextResponse.next();
  }

  // Vérifier le cookie d'authentification
  const cookieAuth = request.cookies.get('community_auth');

  if (!cookieAuth?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    // Conserver la destination pour rediriger après connexion
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Correspondance sur toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     * - fichiers avec extension (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
