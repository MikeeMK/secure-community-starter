-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "albumPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
