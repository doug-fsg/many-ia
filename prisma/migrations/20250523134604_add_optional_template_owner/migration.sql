-- AlterTable
ALTER TABLE "AIConfig" ADD COLUMN     "tempoRetornoAtendimento" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
