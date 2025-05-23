/*
  Warnings:

  - The `status` column on the `Template` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `userId` on table `Template` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PUBLIC', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_userId_fkey";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "status",
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
