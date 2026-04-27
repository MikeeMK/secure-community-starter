-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'plus', 'premium');

-- AlterTable
ALTER TABLE "ForumTopic" ADD COLUMN     "boostExpiresAt" TIMESTAMP(3),
ADD COLUMN     "featuredExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isBoosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'free',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
