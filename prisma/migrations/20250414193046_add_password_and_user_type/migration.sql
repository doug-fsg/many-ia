-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isIntegrationUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;
