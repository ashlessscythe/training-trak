/*
  Warnings:

  - A unique constraint covering the columns `[name,siteId]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,siteId]` on the table `Position` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `siteId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Position_name_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "siteId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "siteId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Department_siteId_idx" ON "Department"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_siteId_key" ON "Department"("name", "siteId");

-- CreateIndex
CREATE INDEX "Position_siteId_idx" ON "Position"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_siteId_key" ON "Position"("name", "siteId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
