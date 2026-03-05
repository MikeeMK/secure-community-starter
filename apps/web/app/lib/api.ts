const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
export const AUTH_TOKEN_STORAGE_KEY = 'community_auth_token';

export class ApiFetchError extends Error {
  status?: number;
  captchaRequired?: boolean;
  data?: unknown;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }

    const message =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? typeof (parsed as any).message === 'string'
          ? (parsed as any).message
          : JSON.stringify((parsed as any).message)
        : text || `HTTP ${res.status}`;

    const error = new ApiFetchError(message);
    error.status = res.status;
    error.data = parsed;
    error.captchaRequired =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as any).captchaRequired ??
          (typeof (parsed as any).message === 'object'
            ? (parsed as any).message?.captchaRequired
            : undefined)
        : undefined;
    throw error;
  }

  return res.json() as Promise<T>;
}
