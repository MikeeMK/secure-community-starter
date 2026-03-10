-- Add isAnnouncement to ForumTopic
ALTER TABLE "ForumTopic" ADD COLUMN "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "ForumTopic_isAnnouncement_idx" ON "ForumTopic"("isAnnouncement");

-- ForumTopicLike
CREATE TABLE "ForumTopicLike" (
  "topicId"   TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForumTopicLike_pkey" PRIMARY KEY ("topicId", "userId")
);
CREATE INDEX "ForumTopicLike_userId_idx" ON "ForumTopicLike"("userId");
ALTER TABLE "ForumTopicLike" ADD CONSTRAINT "ForumTopicLike_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumTopicLike" ADD CONSTRAINT "ForumTopicLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatConversation
CREATE TABLE "ChatConversation" (
  "id"             TEXT NOT NULL,
  "announcementId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user1Id"        TEXT NOT NULL,
  "user2Id"        TEXT NOT NULL,
  CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatConversation_user1Id_user2Id_key" ON "ChatConversation"("user1Id", "user2Id");
CREATE INDEX "ChatConversation_user1Id_idx" ON "ChatConversation"("user1Id");
CREATE INDEX "ChatConversation_user2Id_idx" ON "ChatConversation"("user2Id");
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_user1Id_fkey"
  FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_user2Id_fkey"
  FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage
CREATE TABLE "ChatMessage" (
  "id"             TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "read"           BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
