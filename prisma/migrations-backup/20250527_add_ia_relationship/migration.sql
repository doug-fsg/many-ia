-- Adicionar coluna iaId na tabela WhatsAppConnection
ALTER TABLE "WhatsAppConnection" ADD COLUMN IF NOT EXISTS "iaId" TEXT REFERENCES "AIConfig"("id");

-- Criar índice para iaId para melhorar performance
CREATE INDEX IF NOT EXISTS "WhatsAppConnection_iaId_idx" ON "WhatsAppConnection"("iaId"); 