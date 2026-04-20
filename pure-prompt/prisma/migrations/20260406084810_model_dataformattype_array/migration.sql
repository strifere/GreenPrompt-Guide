/*
  Warnings:

  - You are about to drop the column `dataFormat` on the `models` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudyType" ADD VALUE 'BENCHMARKING';
ALTER TYPE "StudyType" ADD VALUE 'COMPARATIVE_EVALUATION';
ALTER TYPE "StudyType" ADD VALUE 'EXPERIMENTAL_INVESTIGATION';
ALTER TYPE "StudyType" ADD VALUE 'EXPLORATORY_STUDY';
ALTER TYPE "StudyType" ADD VALUE 'EMPIRICAL_EVALUATION';
ALTER TYPE "StudyType" ADD VALUE 'FRAMEWORK_EVALUATION';
ALTER TYPE "StudyType" ADD VALUE 'STRUCTURED_EVALUATION';
ALTER TYPE "StudyType" ADD VALUE 'ORIGINAL_RESEARCH';

-- AlterTable
ALTER TABLE "models" DROP COLUMN "dataFormat",
ADD COLUMN     "dataFormatType" "DataFormatType"[] DEFAULT ARRAY['TEXT_ONLY']::"DataFormatType"[];
