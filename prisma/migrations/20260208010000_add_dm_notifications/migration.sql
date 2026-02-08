-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DIRECT_MESSAGE';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "conversationId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
