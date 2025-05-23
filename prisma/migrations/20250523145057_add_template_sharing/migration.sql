/*
  Warnings:

  - You are about to drop the `TemplateAccess` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TemplateAccess" DROP CONSTRAINT "TemplateAccess_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateAccess" DROP CONSTRAINT "TemplateAccess_userId_fkey";

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "isPublic" SET DEFAULT true;

-- DropTable
DROP TABLE "TemplateAccess";

-- CreateTable
CREATE TABLE "TemplateSharing" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateSharing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateSharing_userId_idx" ON "TemplateSharing"("userId");

-- CreateIndex
CREATE INDEX "TemplateSharing_templateId_idx" ON "TemplateSharing"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSharing_templateId_userId_key" ON "TemplateSharing"("templateId", "userId");

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- AddForeignKey
ALTER TABLE "TemplateSharing" ADD CONSTRAINT "TemplateSharing_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSharing" ADD CONSTRAINT "TemplateSharing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
