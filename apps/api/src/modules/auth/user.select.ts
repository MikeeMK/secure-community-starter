export const safeUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  trustLevel: true,
  accountStatus: true,
  moderationReason: true,
  suspendedUntil: true,
  canReRegisterAfter: true,
  moderatedAt: true,
  chatRestrictedUntil: true,
  chatRestrictionReason: true,
  publishRestrictedUntil: true,
  publishRestrictionReason: true,
  replyRestrictedUntil: true,
  replyRestrictionReason: true,
  emailVerifiedAt: true,
  isAdultVerified: true,
  createdAt: true,
} as const;

export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  trustLevel: string;
  accountStatus: string;
  moderationReason: string | null;
  suspendedUntil: Date | null;
  canReRegisterAfter: Date | null;
  moderatedAt: Date | null;
  chatRestrictedUntil: Date | null;
  chatRestrictionReason: string | null;
  publishRestrictedUntil: Date | null;
  publishRestrictionReason: string | null;
  replyRestrictedUntil: Date | null;
  replyRestrictionReason: string | null;
  emailVerifiedAt: Date | null;
  isAdultVerified: boolean;
  createdAt: Date;
};
