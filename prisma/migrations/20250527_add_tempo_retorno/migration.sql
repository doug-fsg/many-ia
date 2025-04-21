-- Adicionar campo tempoRetornoAtendimento na tabela AIConfig
ALTER TABLE "AIConfig" ADD COLUMN "tempoRetornoAtendimento" TEXT;

-- Adicionar campo iaId na tabela WhatsAppConnection caso não exista
ALTER TABLE "WhatsAppConnection" ADD COLUMN IF NOT EXISTS "iaId" TEXT REFERENCES "AIConfig"("id");

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS "WhatsAppConnection_iaId_idx" ON "WhatsAppConnection"("iaId"); 