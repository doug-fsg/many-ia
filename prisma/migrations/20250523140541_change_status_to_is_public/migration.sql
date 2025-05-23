/*
  Warnings:

  - You are about to drop the column `status` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "status",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "TemplateStatus";
