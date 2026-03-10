export const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  trustLevel: true,
  isAdultVerified: true,
  createdAt: true,
} as const;

export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  trustLevel: string;
  isAdultVerified: boolean;
  createdAt: Date;
};
