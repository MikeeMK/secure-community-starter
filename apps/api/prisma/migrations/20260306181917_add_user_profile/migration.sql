-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "age" INTEGER,
    "city" TEXT,
    "gender" TEXT,
    "orientation" TEXT,
    "relationshipStatus" TEXT,
    "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interactionType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
