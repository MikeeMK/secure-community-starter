-- CreateTable
CREATE TABLE "ModerationChat" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "reportId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,

    CONSTRAINT "ModerationChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "ModerationChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModerationChat_reportId_key" ON "ModerationChat"("reportId");

-- CreateIndex
CREATE INDEX "ModerationChat_reporterId_idx" ON "ModerationChat"("reporterId");

-- CreateIndex
CREATE INDEX "ModerationChat_staffId_idx" ON "ModerationChat"("staffId");

-- CreateIndex
CREATE INDEX "ModerationChatMessage_chatId_createdAt_idx" ON "ModerationChatMessage"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "ModerationChat" ADD CONSTRAINT "ModerationChat_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationChat" ADD CONSTRAINT "ModerationChat_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationChat" ADD CONSTRAINT "ModerationChat_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationChatMessage" ADD CONSTRAINT "ModerationChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ModerationChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationChatMessage" ADD CONSTRAINT "ModerationChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
