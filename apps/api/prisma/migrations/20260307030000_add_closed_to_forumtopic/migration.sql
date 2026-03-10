-- Add closed flag to forum topics
ALTER TABLE "ForumTopic" ADD COLUMN IF NOT EXISTS "closed" BOOLEAN NOT NULL DEFAULT false;
