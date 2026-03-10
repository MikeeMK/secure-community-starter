export const PROFILE_BIO_MAX_LENGTH = 300;
export const LOOKING_FOR_CASUAL_LABEL = 'Relation éphémère';

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

export function normalizeProfileRecord<T extends { lookingFor?: string[] | null }>(
  profile: T | null | undefined,
): T | null | undefined {
  if (!profile) return profile;
  return {
    ...profile,
    lookingFor: normalizeLookingForValues(profile.lookingFor),
  };
}
