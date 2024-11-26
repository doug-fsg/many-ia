/*
  Warnings:

  - Made the column `embedding` on table `AIConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AIConfig" ALTER COLUMN "embedding" SET NOT NULL,
ALTER COLUMN "embedding" SET DATA TYPE JSONB;
