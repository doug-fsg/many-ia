-- DropIndex
DROP INDEX "Inbox_userId_idx";

-- DropIndex
DROP INDEX "Inbox_userId_inboxId_key";

-- AlterTable
ALTER TABLE "Inbox" ADD COLUMN     "doneAt" TIMESTAMP(3);
