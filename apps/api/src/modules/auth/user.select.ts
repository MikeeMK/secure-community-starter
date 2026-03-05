import { Prisma } from '@prisma/client';

export const safeUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  displayName: true,
  trustLevel: true,
  createdAt: true,
});

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;
