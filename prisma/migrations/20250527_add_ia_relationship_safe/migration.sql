-- AddColumn
ALTER TABLE "WhatsAppConnection" ADD COLUMN IF NOT EXISTS "iaId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WhatsAppConnection_iaId_idx" ON "WhatsAppConnection"("iaId");

-- AddForeignKey (com verificação de existência)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'WhatsAppConnection_iaId_fkey'
    ) THEN
        ALTER TABLE "WhatsAppConnection" 
        ADD CONSTRAINT "WhatsAppConnection_iaId_fkey" 
        FOREIGN KEY ("iaId") 
        REFERENCES "AIConfig"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$; 