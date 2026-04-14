export const AGE_GATE_COOKIE_NAME = 'velentra_age_gate';
export const AGE_GATE_ACCEPTED = 'accepted';
export const AGE_GATE_DECLINED = 'declined';

export function normalizeAgeGateRedirectTarget(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}
