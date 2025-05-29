/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Affiliate` will be added. If there are existing duplicate values, this will fail.
  - The required column `referralCode` was added to the `Affiliate` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "referralCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_referralCode_key" ON "Affiliate"("referralCode");
