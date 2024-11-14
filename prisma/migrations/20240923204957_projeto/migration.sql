/*
  Warnings:

  - You are about to drop the column `model` on the `AIConfig` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AIConfig` table. All the data in the column will be lost.
  - Added the required column `cargoUsuario` to the `AIConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `condicoesAtendimento` to the `AIConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enviarParaAtendente` to the `AIConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horarioAtendimento` to the `AIConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instrucoesAtendenteVirtual` to the `AIConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeAtendenteDigital` to the `AIConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PaymentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "aiConfigId" TEXT NOT NULL,
    CONSTRAINT "PaymentLink_aiConfigId_fkey" FOREIGN KEY ("aiConfigId") REFERENCES "AIConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nomeAtendenteDigital" TEXT NOT NULL,
    "enviarParaAtendente" BOOLEAN NOT NULL,
    "cargoUsuario" TEXT NOT NULL,
    "instrucoesAtendenteVirtual" TEXT NOT NULL,
    "horarioAtendimento" TEXT NOT NULL,
    "anexarInstrucoesPdf" TEXT,
    "condicoesAtendimento" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AIConfig" ("createdAt", "id", "isActive", "updatedAt", "userId") SELECT "createdAt", "id", "isActive", "updatedAt", "userId" FROM "AIConfig";
DROP TABLE "AIConfig";
ALTER TABLE "new_AIConfig" RENAME TO "AIConfig";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
