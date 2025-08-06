-- CreateTable
CREATE TABLE "GoogleCalendarIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "calendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarIntegration_userId_key" ON "GoogleCalendarIntegration"("userId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarIntegration" ADD CONSTRAINT "GoogleCalendarIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 

-- Adicionar campos de configuração do Google Calendar na tabela AIConfig
ALTER TABLE "AIConfig" ADD COLUMN "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AIConfig" ADD COLUMN "defaultEventDuration" INTEGER;
ALTER TABLE "AIConfig" ADD COLUMN "workingHoursStart" TEXT;
ALTER TABLE "AIConfig" ADD COLUMN "workingHoursEnd" TEXT;
ALTER TABLE "AIConfig" ADD COLUMN "allowedDays" TEXT[];
ALTER TABLE "AIConfig" ADD COLUMN "minAdvanceTime" INTEGER;
ALTER TABLE "AIConfig" ADD COLUMN "maxAdvanceTime" INTEGER;
ALTER TABLE "AIConfig" ADD COLUMN "defaultReminder" INTEGER;
ALTER TABLE "AIConfig" ADD COLUMN "autoCreateEvents" BOOLEAN NOT NULL DEFAULT false; 