/*
  Warnings:

  - You are about to drop the column `referralCode` on the `Affiliate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[affiliateId,referredUserId]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Affiliate" DROP CONSTRAINT "Affiliate_userId_fkey";

-- DropIndex
DROP INDEX "Affiliate_referralCode_idx";

-- DropIndex
DROP INDEX "Affiliate_referralCode_key";

-- DropIndex
DROP INDEX "Affiliate_userId_idx";

-- AlterTable
ALTER TABLE "Affiliate" DROP COLUMN "referralCode";

-- CreateIndex
CREATE UNIQUE INDEX "Referral_affiliateId_referredUserId_key" ON "Referral"("affiliateId", "referredUserId");

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
