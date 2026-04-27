import { NextRequest, NextResponse } from 'next/server';
import {
  AGE_GATE_ACCEPTED,
  AGE_GATE_COOKIE_NAME,
  AGE_GATE_DECLINED,
  normalizeAgeGateRedirectTarget,
} from '../../../lib/age-gate';

export const runtime = 'nodejs';

type RouteContext = {
  params: {
    decision: string;
  };
};

function applyAgeGateCookie(response: NextResponse, value: string) {
  response.cookies.set({
    name: AGE_GATE_COOKIE_NAME,
    value,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const decision = context.params.decision;
  const formData = await request.formData().catch(() => null);
  const nextTarget = normalizeAgeGateRedirectTarget(formData?.get('next')?.toString());

  if (decision === 'accept') {
    const url = request.nextUrl.clone();
    url.pathname = nextTarget;
    url.search = '';
    const response = NextResponse.redirect(url);
    applyAgeGateCookie(response, AGE_GATE_ACCEPTED);
    return response;
  }

  if (decision === 'decline') {
    const url = request.nextUrl.clone();
    url.pathname = '/acces-interdit';
    url.search = '';
    const response = NextResponse.redirect(url);
    applyAgeGateCookie(response, AGE_GATE_DECLINED);
    return response;
  }

  return NextResponse.json({ message: 'Décision invalide' }, { status: 404 });
}
