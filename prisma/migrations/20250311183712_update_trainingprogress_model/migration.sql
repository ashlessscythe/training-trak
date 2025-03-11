/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `TrainingProgress` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `TrainingProgress` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrainingProgress" DROP CONSTRAINT "TrainingProgress_approvedById_fkey";

-- DropIndex
DROP INDEX "TrainingProgress_approvedById_idx";

-- AlterTable
ALTER TABLE "TrainingProgress" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById";
