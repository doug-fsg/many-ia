/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `embedding` on the `AIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `inboxId` on the `AIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `inboxName` on the `AIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AIConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AIConfig" DROP COLUMN "createdAt",
DROP COLUMN "embedding",
DROP COLUMN "inboxId",
DROP COLUMN "inboxName",
DROP COLUMN "updatedAt",
ALTER COLUMN "isActive" SET DEFAULT false,
ALTER COLUMN "enviarParaAtendente" SET DEFAULT false;
