import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessibles sans authentification
const ROUTES_PUBLIQUES = [
  '/',
  '/connexion',
  '/inscription',
  '/legal',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
