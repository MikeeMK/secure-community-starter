-- Add region field to ForumTopic
ALTER TABLE "ForumTopic" ADD COLUMN "region" TEXT;

-- Create AnnouncementFavorite table
CREATE TABLE "AnnouncementFavorite" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementFavorite_pkey" PRIMARY KEY ("userId","topicId")
);

CREATE INDEX "AnnouncementFavorite_userId_idx" ON "AnnouncementFavorite"("userId");

ALTER TABLE "AnnouncementFavorite" ADD CONSTRAINT "AnnouncementFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementFavorite" ADD CONSTRAINT "AnnouncementFavorite_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
