-- AlterEnum
ALTER TYPE "TrainingStatus" ADD VALUE 'SIGNED';

-- AlterTable
ALTER TABLE "TrainingProgress" ADD COLUMN     "isHistorical" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TrainingProgress_isHistorical_idx" ON "TrainingProgress"("isHistorical");
