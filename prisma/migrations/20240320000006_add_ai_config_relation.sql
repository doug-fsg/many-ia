-- AlterTable
ALTER TABLE "WhatsAppConnection" 
ADD CONSTRAINT "WhatsAppConnection_iaId_fkey" 
FOREIGN KEY ("iaId") 
REFERENCES "AIConfig"("id") 
ON DELETE SET NULL; 