-- CreateEnum
-- Adiciona campo customCreditLimit na tabela User
-- Campo opcional para permitir limites personalizados por usuário

-- Adicionar coluna customCreditLimit (nullable para não quebrar dados existentes)
ALTER TABLE "User" ADD COLUMN "customCreditLimit" INTEGER;

-- Adicionar índice para performance em consultas (sem CONCURRENTLY para funcionar na transação)
CREATE INDEX IF NOT EXISTS "User_customCreditLimit_idx" ON "User"("customCreditLimit");

-- Comentário para documentação
COMMENT ON COLUMN "User"."customCreditLimit" IS 'Limite personalizado de créditos por usuário. Se NULL, usa o limite padrão do plano.';
