-- Migração para adicionar campo featureFlags na tabela User
-- Execute este SQL diretamente no banco de dados de produção

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'featureFlags'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "featureFlags" JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna featureFlags adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna featureFlags já existe';
    END IF;
END $$;

