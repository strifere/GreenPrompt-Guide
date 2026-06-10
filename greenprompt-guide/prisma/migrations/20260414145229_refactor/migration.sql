/*
  Warnings:

  - The primary key for the `model_references` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `modelId` on the `model_references` table. All the data in the column will be lost.
  - The primary key for the `paper_prompt_techniques` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `promptTechniqueId` on the `paper_prompt_techniques` table. All the data in the column will be lost.
  - The primary key for the `practice_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `practice_categories` table. All the data in the column will be lost.
  - The primary key for the `practice_models` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `modelId` on the `practice_models` table. All the data in the column will be lost.
  - The primary key for the `practice_prompt_techniques` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `promptTechniqueId` on the `practice_prompt_techniques` table. All the data in the column will be lost.
  - Added the required column `modelName` to the `model_references` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptTechniqueName` to the `paper_prompt_techniques` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryName` to the `practice_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelName` to the `practice_models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptTechniqueName` to the `practice_prompt_techniques` table without a default value. This is not possible if the table is not empty.

*/
-- Drop old FK constraints only if they still exist (safe for partially applied runs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'model_references_modelId_fkey'
      AND conrelid = 'public.model_references'::regclass
  ) THEN
    ALTER TABLE "model_references" DROP CONSTRAINT "model_references_modelId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'paper_prompt_techniques_promptTechniqueId_fkey'
      AND conrelid = 'public.paper_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "paper_prompt_techniques" DROP CONSTRAINT "paper_prompt_techniques_promptTechniqueId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_categories_categoryId_fkey'
      AND conrelid = 'public.practice_categories'::regclass
  ) THEN
    ALTER TABLE "practice_categories" DROP CONSTRAINT "practice_categories_categoryId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_models_modelId_fkey'
      AND conrelid = 'public.practice_models'::regclass
  ) THEN
    ALTER TABLE "practice_models" DROP CONSTRAINT "practice_models_modelId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_prompt_techniques_promptTechniqueId_fkey'
      AND conrelid = 'public.practice_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "practice_prompt_techniques" DROP CONSTRAINT "practice_prompt_techniques_promptTechniqueId_fkey";
  END IF;
END $$;

-- Rename columns only if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'model_references' AND column_name = 'modelId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'model_references' AND column_name = 'modelName'
  ) THEN
    ALTER TABLE "model_references" RENAME COLUMN "modelId" TO "modelName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paper_prompt_techniques' AND column_name = 'promptTechniqueId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paper_prompt_techniques' AND column_name = 'promptTechniqueName'
  ) THEN
    ALTER TABLE "paper_prompt_techniques" RENAME COLUMN "promptTechniqueId" TO "promptTechniqueName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_categories' AND column_name = 'categoryId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_categories' AND column_name = 'categoryName'
  ) THEN
    ALTER TABLE "practice_categories" RENAME COLUMN "categoryId" TO "categoryName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_models' AND column_name = 'modelId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_models' AND column_name = 'modelName'
  ) THEN
    ALTER TABLE "practice_models" RENAME COLUMN "modelId" TO "modelName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_prompt_techniques' AND column_name = 'promptTechniqueId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'practice_prompt_techniques' AND column_name = 'promptTechniqueName'
  ) THEN
    ALTER TABLE "practice_prompt_techniques" RENAME COLUMN "promptTechniqueId" TO "promptTechniqueName";
  END IF;
END $$;

-- Create new FK constraints only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_categories_categoryName_fkey'
      AND conrelid = 'public.practice_categories'::regclass
  ) THEN
    ALTER TABLE "practice_categories"
      ADD CONSTRAINT "practice_categories_categoryName_fkey"
      FOREIGN KEY ("categoryName") REFERENCES "categories"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_prompt_techniques_promptTechniqueName_fkey'
      AND conrelid = 'public.practice_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "practice_prompt_techniques"
      ADD CONSTRAINT "practice_prompt_techniques_promptTechniqueName_fkey"
      FOREIGN KEY ("promptTechniqueName") REFERENCES "prompt_techniques"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'practice_models_modelName_fkey'
      AND conrelid = 'public.practice_models'::regclass
  ) THEN
    ALTER TABLE "practice_models"
      ADD CONSTRAINT "practice_models_modelName_fkey"
      FOREIGN KEY ("modelName") REFERENCES "models"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'model_references_modelName_fkey'
      AND conrelid = 'public.model_references'::regclass
  ) THEN
    ALTER TABLE "model_references"
      ADD CONSTRAINT "model_references_modelName_fkey"
      FOREIGN KEY ("modelName") REFERENCES "models"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'paper_prompt_techniques_promptTechniqueName_fkey'
      AND conrelid = 'public.paper_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "paper_prompt_techniques"
      ADD CONSTRAINT "paper_prompt_techniques_promptTechniqueName_fkey"
      FOREIGN KEY ("promptTechniqueName") REFERENCES "prompt_techniques"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
