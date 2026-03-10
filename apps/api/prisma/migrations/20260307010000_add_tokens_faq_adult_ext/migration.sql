-- Extend adult verification on User
ALTER TABLE "User" ADD COLUMN "adultVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "verificationProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationReference" TEXT;

-- TokenBalance table
CREATE TABLE "TokenBalance" (
  "userId"            TEXT NOT NULL,
  "balance"           INTEGER NOT NULL DEFAULT 0,
  "awardedMilestones" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "TokenBalance"
  ADD CONSTRAINT "TokenBalance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TokenTransaction table
CREATE TABLE "TokenTransaction" (
  "id"        TEXT NOT NULL,
  "amount"    INTEGER NOT NULL,
  "reason"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"    TEXT NOT NULL,
  CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");

ALTER TABLE "TokenTransaction"
  ADD CONSTRAINT "TokenTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FaqItem table
CREATE TABLE "FaqItem" (
  "id"           TEXT NOT NULL,
  "question"     TEXT NOT NULL,
  "answer"       TEXT NOT NULL,
  "category"     TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "published"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqItem_category_displayOrder_idx" ON "FaqItem"("category", "displayOrder");
