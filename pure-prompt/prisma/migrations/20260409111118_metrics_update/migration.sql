/*
  Warnings:

  - You are about to drop the column `practiceId` on the `accuracy_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `practiceId` on the `energy_metrics` table. All the data in the column will be lost.
  - Added the required column `practiceId` to the `metrics` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accuracy_metrics" DROP CONSTRAINT "accuracy_metrics_practiceId_fkey";

-- DropForeignKey
ALTER TABLE "energy_metrics" DROP CONSTRAINT "energy_metrics_practiceId_fkey";

-- AlterTable
ALTER TABLE "accuracy_metrics" DROP COLUMN "practiceId";

-- AlterTable
ALTER TABLE "energy_metrics" DROP COLUMN "practiceId";

-- AlterTable
ALTER TABLE "metrics" ADD COLUMN     "practiceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
