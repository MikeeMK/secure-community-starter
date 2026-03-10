-- Add isAdultVerified to User
ALTER TABLE "User" ADD COLUMN "isAdultVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add category to ForumTopic
ALTER TABLE "ForumTopic" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Autre';
