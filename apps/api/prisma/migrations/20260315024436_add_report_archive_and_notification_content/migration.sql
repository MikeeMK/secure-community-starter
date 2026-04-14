-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "content" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT;
