-- AlterTable
ALTER TABLE "WhatsAppConnection" ADD COLUMN     "iaId" TEXT;

-- CreateIndex
CREATE INDEX "WhatsAppConnection_iaId_idx" ON "WhatsAppConnection"("iaId");

-- AddForeignKey
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_iaId_fkey" FOREIGN KEY ("iaId") REFERENCES "AIConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
