-- DropForeignKey
ALTER TABLE "WhatsAppConnection" DROP CONSTRAINT "WhatsAppConnection_iaId_fkey";

-- AlterTable
ALTER TABLE "AIConfig" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promptEspecial" TEXT,
ADD COLUMN     "regrasEspeciais" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isInfluencer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PurchasedTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasedTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasedTemplate_userId_idx" ON "PurchasedTemplate"("userId");

-- CreateIndex
CREATE INDEX "PurchasedTemplate_templateId_idx" ON "PurchasedTemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedTemplate_userId_templateId_key" ON "PurchasedTemplate"("userId", "templateId");

-- AddForeignKey
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_iaId_fkey" FOREIGN KEY ("iaId") REFERENCES "AIConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedTemplate" ADD CONSTRAINT "PurchasedTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedTemplate" ADD CONSTRAINT "PurchasedTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AIConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
