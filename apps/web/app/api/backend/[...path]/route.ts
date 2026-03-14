import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUTH_COOKIE_NAME = 'community_auth';

function getApiBaseUrl() {
  const configured =
    process.env.API_BASE_URL ??
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

async function proxy(request: NextRequest, path: string[]) {
  let url: URL;
  try {
    url = new URL(`${getApiBaseUrl()}/${path.join('/')}`);
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
  url.search = request.nextUrl.search;

  const headers = new Headers();
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {
        message: 'Backend API inaccessible. Vérifiez API_BASE_URL et le déploiement de l’API.',
      },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) {
    responseHeaders.set('Content-Type', upstreamType);
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}
