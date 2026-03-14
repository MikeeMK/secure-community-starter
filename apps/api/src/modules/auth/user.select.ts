export const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  trustLevel: true,
  emailVerifiedAt: true,
  isAdultVerified: true,
  createdAt: true,
} as const;

export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  trustLevel: string;
  emailVerifiedAt: Date | null;
  isAdultVerified: boolean;
  createdAt: Date;
};
