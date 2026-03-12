-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "totalHands" INTEGER NOT NULL DEFAULT 0,
    "handsWon" INTEGER NOT NULL DEFAULT 0,
    "handsLost" INTEGER NOT NULL DEFAULT 0,
    "handsFolded" INTEGER NOT NULL DEFAULT 0,
    "totalProfit" INTEGER NOT NULL DEFAULT 0,
    "biggestPot" INTEGER NOT NULL DEFAULT 0,
    "biggestWin" INTEGER NOT NULL DEFAULT 0,
    "vpipHands" INTEGER NOT NULL DEFAULT 0,
    "pfrHands" INTEGER NOT NULL DEFAULT 0,
    "advisorFollowed" INTEGER NOT NULL DEFAULT 0,
    "advisorShown" INTEGER NOT NULL DEFAULT 0,
    "sessionsPlayed" INTEGER NOT NULL DEFAULT 0,
    "correctDecisions" INTEGER NOT NULL DEFAULT 0,
    "totalDecisions" INTEGER NOT NULL DEFAULT 0,
    "totalPlaytimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "quizAnswered" INTEGER NOT NULL DEFAULT 0,
    "quizCorrect" INTEGER NOT NULL DEFAULT 0,
    "quizPlaytimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "mode" TEXT NOT NULL,
    "handsPlayed" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "finalStack" INTEGER NOT NULL DEFAULT 10000,
    "startStack" INTEGER NOT NULL DEFAULT 10000,
    "savedState" TEXT,
    "playtimeSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hand" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "handNumber" INTEGER NOT NULL,
    "holeCards" TEXT NOT NULL,
    "communityCards" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "profitLoss" INTEGER NOT NULL,
    "potSize" INTEGER NOT NULL,
    "handStrength" TEXT,
    "advisorAction" TEXT,
    "playerAction" TEXT NOT NULL,
    "followedAdvisor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_userId_key" ON "PlayerStats"("userId");

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hand" ADD CONSTRAINT "Hand_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
