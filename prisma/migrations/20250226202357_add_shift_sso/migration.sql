-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shift" "Shift" DEFAULT 'FIRST',
ADD COLUMN     "ssoId" TEXT;
