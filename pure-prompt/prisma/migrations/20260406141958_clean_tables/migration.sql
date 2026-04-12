/*
  Warnings:

  - You are about to drop the `paper_hyperparameters` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,value,referenceId]` on the table `hyperparameters` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `hyperparameters` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "paper_hyperparameters" DROP CONSTRAINT IF EXISTS "paper_hyperparameters_hyperparameterId_fkey";

-- DropForeignKey
ALTER TABLE "paper_hyperparameters" DROP CONSTRAINT IF EXISTS "paper_hyperparameters_referenceId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "hyperparameters_name_value_key";

-- AlterTable
ALTER TABLE "hyperparameters" ADD COLUMN     "referenceId" INTEGER NOT NULL;

-- DropTable
DROP TABLE IF EXISTS "paper_hyperparameters";

-- CreateIndex
CREATE UNIQUE INDEX "hyperparameters_name_value_referenceId_key" ON "hyperparameters"("name", "value", "referenceId");

-- AddForeignKey
ALTER TABLE "hyperparameters" ADD CONSTRAINT "hyperparameters_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
