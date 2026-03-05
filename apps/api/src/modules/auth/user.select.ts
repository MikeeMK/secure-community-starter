export const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  trustLevel: true,
  createdAt: true,
} as const;

export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  trustLevel: string;
  createdAt: Date;
};
