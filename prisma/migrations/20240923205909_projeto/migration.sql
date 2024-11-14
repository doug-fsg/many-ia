/*
  Warnings:

  - You are about to drop the column `objetivo` on the `PaymentLink` table. All the data in the column will be lost.
  - Added the required column `objective` to the `PaymentLink` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "aiConfigId" TEXT NOT NULL,
    CONSTRAINT "PaymentLink_aiConfigId_fkey" FOREIGN KEY ("aiConfigId") REFERENCES "AIConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentLink" ("aiConfigId", "id", "url") SELECT "aiConfigId", "id", "url" FROM "PaymentLink";
DROP TABLE "PaymentLink";
ALTER TABLE "new_PaymentLink" RENAME TO "PaymentLink";
CREATE TABLE "new_AIConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nomeAtendenteDigital" TEXT NOT NULL,
    "enviarParaAtendente" BOOLEAN NOT NULL,
    "cargoUsuario" TEXT NOT NULL,
    "instrucoesAtendenteVirtual" TEXT NOT NULL,
    "horarioAtendimento" TEXT NOT NULL,
    "anexarInstrucoesPdf" TEXT,
    "condicoesAtendimento" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AIConfig" ("anexarInstrucoesPdf", "cargoUsuario", "condicoesAtendimento", "createdAt", "enviarParaAtendente", "horarioAtendimento", "id", "instrucoesAtendenteVirtual", "isActive", "nomeAtendenteDigital", "updatedAt", "userId") SELECT "anexarInstrucoesPdf", "cargoUsuario", "condicoesAtendimento", "createdAt", "enviarParaAtendente", "horarioAtendimento", "id", "instrucoesAtendenteVirtual", "isActive", "nomeAtendenteDigital", "updatedAt", "userId" FROM "AIConfig";
DROP TABLE "AIConfig";
ALTER TABLE "new_AIConfig" RENAME TO "AIConfig";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
