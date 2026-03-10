-- Migration: update TrustLevel enum
-- old values: new, normal, trusted, restricted
-- new values: new, member, moderator, super_admin

-- Step 1: map old values to new ones (all current rows have 'new', but be safe)
UPDATE "User" SET "trustLevel" = 'new' WHERE "trustLevel" = 'new';

-- Step 2: recreate the enum with new values
ALTER TABLE "User" ALTER COLUMN "trustLevel" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "trustLevel" TYPE TEXT;

DROP TYPE "TrustLevel";

CREATE TYPE "TrustLevel" AS ENUM ('new', 'member', 'moderator', 'super_admin');

-- Remap any old values that may exist
UPDATE "User" SET "trustLevel" = 'member' WHERE "trustLevel" = 'normal';
UPDATE "User" SET "trustLevel" = 'moderator' WHERE "trustLevel" = 'trusted';
UPDATE "User" SET "trustLevel" = 'member' WHERE "trustLevel" = 'restricted';

ALTER TABLE "User" ALTER COLUMN "trustLevel" TYPE "TrustLevel" USING "trustLevel"::"TrustLevel";
ALTER TABLE "User" ALTER COLUMN "trustLevel" SET DEFAULT 'new';
