-- Add displayNameUpdatedAt to User
ALTER TABLE "User" ADD COLUMN "displayNameUpdatedAt" TIMESTAMP(3);

-- UserSettings
CREATE TABLE "UserSettings" (
  "userId"              TEXT NOT NULL,
  "allowChat"           BOOLEAN NOT NULL DEFAULT true,
  "hideFromSuggestions" BOOLEAN NOT NULL DEFAULT false,
  "allowNotifLikes"     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
