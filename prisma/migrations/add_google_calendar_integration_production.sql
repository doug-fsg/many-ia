-- Migração para adicionar integração do Google Calendar
-- Esta migração é segura para produção e pode ser executada múltiplas vezes

-- Criar tabela GoogleCalendarIntegration se não existir
CREATE TABLE IF NOT EXISTS "GoogleCalendarIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "calendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleCalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- Criar índice único se não existir
CREATE UNIQUE INDEX IF NOT EXISTS "GoogleCalendarIntegration_userId_key" ON "GoogleCalendarIntegration"("userId");

-- Adicionar foreign key se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'GoogleCalendarIntegration_userId_fkey'
    ) THEN
        ALTER TABLE "GoogleCalendarIntegration" 
        ADD CONSTRAINT "GoogleCalendarIntegration_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Adicionar campos do Google Calendar na tabela AIConfig se não existirem
DO $$
BEGIN
    -- googleCalendarEnabled
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'googleCalendarEnabled'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- calendarId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'calendarId'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "calendarId" TEXT;
    END IF;

    -- defaultEventDuration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'defaultEventDuration'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "defaultEventDuration" INTEGER;
    END IF;

    -- weeklySchedule
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'weeklySchedule'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "weeklySchedule" JSONB;
    END IF;

    -- minAdvanceTime
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'minAdvanceTime'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "minAdvanceTime" INTEGER;
    END IF;

    -- maxAdvanceTime
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'maxAdvanceTime'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "maxAdvanceTime" INTEGER;
    END IF;

    -- defaultReminder
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'defaultReminder'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "defaultReminder" INTEGER;
    END IF;

    -- reminderMessage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'reminderMessage'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "reminderMessage" TEXT;
    END IF;

    -- autoCreateEvents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'autoCreateEvents'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "autoCreateEvents" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- eventType
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'eventType'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "eventType" TEXT DEFAULT 'video_call';
    END IF;

    -- responsibleEmails
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'responsibleEmails'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "responsibleEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- aiPrompt
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'aiPrompt'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "aiPrompt" TEXT;
    END IF;

    -- enableScarcityMode
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'enableScarcityMode'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "enableScarcityMode" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- maxSlotsToShow
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'AIConfig' AND column_name = 'maxSlotsToShow'
    ) THEN
        ALTER TABLE "AIConfig" ADD COLUMN "maxSlotsToShow" INTEGER;
    END IF;
END $$;

