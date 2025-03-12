/*
  Warnings:

  - The values [SIGNED] on the enum `TrainingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrainingStatus_new" AS ENUM ('IN_PROGRESS', 'COMPLETED');
ALTER TABLE "TrainingProgress" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TrainingProgress" ALTER COLUMN "status" TYPE "TrainingStatus_new" USING ("status"::text::"TrainingStatus_new");
ALTER TYPE "TrainingStatus" RENAME TO "TrainingStatus_old";
ALTER TYPE "TrainingStatus_new" RENAME TO "TrainingStatus";
DROP TYPE "TrainingStatus_old";
ALTER TABLE "TrainingProgress" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
COMMIT;

-- AlterTable
ALTER TABLE "TrainingProgress" ADD COLUMN     "isSigned" BOOLEAN NOT NULL DEFAULT false;
