-- CreateTable
CREATE TABLE IF NOT EXISTS "WhatsAppConnection" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "name" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "webhookConfigured" BOOLEAN NOT NULL DEFAULT false,
  "qrCodeUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "WhatsAppConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppConnection_token_key" ON "WhatsAppConnection"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WhatsAppConnection_userId_idx" ON "WhatsAppConnection"("userId");

-- AddForeignKey
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 