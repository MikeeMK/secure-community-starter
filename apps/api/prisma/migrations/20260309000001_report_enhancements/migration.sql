-- Add optional handling info to reports
ALTER TABLE "Report"
ADD COLUMN "resolutionReason" TEXT,
ADD COLUMN "handledById" TEXT,
ADD COLUMN "rewardTokens" INTEGER NOT NULL DEFAULT 0;

-- handledBy relation
ALTER TABLE "Report"
ADD CONSTRAINT "Report_handledById_fkey"
FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
