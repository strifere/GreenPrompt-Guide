/*
  Warnings:

  - Made the column `title` on table `metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `value` on table `metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confidence` on table `metrics` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "metrics" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "value" SET NOT NULL,
ALTER COLUMN "confidence" SET NOT NULL;
ALTER TABLE "energy_metrics" ALTER COLUMN "bestGuessValue" SET NOT NULL;
