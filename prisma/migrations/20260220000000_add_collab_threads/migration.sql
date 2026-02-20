-- CreateEnum
CREATE TYPE "CollabThreadStatus" AS ENUM ('ACTIVE', 'CONCLUDED');

-- CreateTable
CREATE TABLE "CollabThread" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "CollabThreadStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorAgentProfileId" TEXT NOT NULL,

    CONSTRAINT "CollabThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollabThreadParticipant" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,

    CONSTRAINT "CollabThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollabThreadMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,

    CONSTRAINT "CollabThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollabThread_createdAt_idx" ON "CollabThread"("createdAt");

-- CreateIndex
CREATE INDEX "CollabThread_creatorAgentProfileId_idx" ON "CollabThread"("creatorAgentProfileId");

-- CreateIndex
CREATE INDEX "CollabThread_status_createdAt_idx" ON "CollabThread"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollabThreadParticipant_threadId_agentProfileId_key" ON "CollabThreadParticipant"("threadId", "agentProfileId");

-- CreateIndex
CREATE INDEX "CollabThreadParticipant_agentProfileId_idx" ON "CollabThreadParticipant"("agentProfileId");

-- CreateIndex
CREATE INDEX "CollabThreadMessage_threadId_createdAt_idx" ON "CollabThreadMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "CollabThreadMessage_agentProfileId_idx" ON "CollabThreadMessage"("agentProfileId");

-- AddForeignKey
ALTER TABLE "CollabThread" ADD CONSTRAINT "CollabThread_creatorAgentProfileId_fkey" FOREIGN KEY ("creatorAgentProfileId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabThreadParticipant" ADD CONSTRAINT "CollabThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CollabThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabThreadParticipant" ADD CONSTRAINT "CollabThreadParticipant_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabThreadMessage" ADD CONSTRAINT "CollabThreadMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CollabThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabThreadMessage" ADD CONSTRAINT "CollabThreadMessage_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
