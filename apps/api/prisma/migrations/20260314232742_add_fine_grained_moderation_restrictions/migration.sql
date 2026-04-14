-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatRestrictedUntil" TIMESTAMP(3),
ADD COLUMN     "chatRestrictionReason" TEXT,
ADD COLUMN     "publishRestrictedUntil" TIMESTAMP(3),
ADD COLUMN     "publishRestrictionReason" TEXT,
ADD COLUMN     "replyRestrictedUntil" TIMESTAMP(3),
ADD COLUMN     "replyRestrictionReason" TEXT;
