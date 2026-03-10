export const PROFILE_BIO_MAX_LENGTH = 300;
export const PROFILE_ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
export const LOOKING_FOR_CASUAL_LABEL = 'Relation éphémère';
export const LOOKING_FOR_BASE = ['Amitié', LOOKING_FOR_CASUAL_LABEL, 'Relation sérieuse'] as const;

const LOOKING_FOR_LABEL_MAP: Record<string, string> = {
  Relation: LOOKING_FOR_CASUAL_LABEL,
  Rencontre: LOOKING_FOR_CASUAL_LABEL,
};

export function normalizeLookingForValue(value: string): string {
  return LOOKING_FOR_LABEL_MAP[value] ?? value;
}

export function normalizeLookingForValues(values?: string[] | null): string[] {
  if (!values?.length) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of values) {
    if (!raw) continue;
    const value = normalizeLookingForValue(raw);
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function isUserOnline(lastActiveAt?: string | Date | null): boolean {
  if (!lastActiveAt) return false;

  const timestamp =
    typeof lastActiveAt === 'string' ? new Date(lastActiveAt).getTime() : lastActiveAt.getTime();

  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= PROFILE_ONLINE_THRESHOLD_MS;
}
