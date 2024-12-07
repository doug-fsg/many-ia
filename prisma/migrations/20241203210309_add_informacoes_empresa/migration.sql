/*
  Warnings:

  - Added the required column `informacoesEmpresa` to the `AIConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AIConfig" ADD COLUMN     "informacoesEmpresa" TEXT NOT NULL;
