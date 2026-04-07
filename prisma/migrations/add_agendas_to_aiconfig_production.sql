-- Adiciona coluna JSON opcional para múltiplas agendas no AIConfig (compatível com produção)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'AIConfig'
          AND column_name = 'agendas'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "agendas" JSONB;
    END IF;
END $$;
