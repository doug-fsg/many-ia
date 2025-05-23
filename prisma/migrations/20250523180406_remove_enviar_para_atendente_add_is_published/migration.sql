/*
  Warnings:

  - You are about to drop the column `enviarParaAtendente` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "enviarParaAtendente",
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
