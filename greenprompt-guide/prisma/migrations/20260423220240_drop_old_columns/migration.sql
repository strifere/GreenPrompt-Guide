-- Migration B: cleanup legacy key columns and residual old-key constraints.
-- This script assumes Migration A already backfilled new key columns and created new PK/FK model.

BEGIN;

-- 1) Drop new-model FKs first so legacy unique indexes can be removed safely.
ALTER TABLE IF EXISTS "practice_examples" DROP CONSTRAINT IF EXISTS "practice_examples_practiceName_fkey";
ALTER TABLE IF EXISTS "hyperparameters" DROP CONSTRAINT IF EXISTS "hyperparameters_referenceTitle_fkey";
ALTER TABLE IF EXISTS "hyperparameters" DROP CONSTRAINT IF EXISTS "hyperparameters_practiceName_fkey";
ALTER TABLE IF EXISTS "metrics" DROP CONSTRAINT IF EXISTS "metrics_practiceName_fkey";
ALTER TABLE IF EXISTS "practice_categories" DROP CONSTRAINT IF EXISTS "practice_categories_practiceName_fkey";
ALTER TABLE IF EXISTS "practice_prompt_techniques" DROP CONSTRAINT IF EXISTS "practice_prompt_techniques_practiceName_fkey";
ALTER TABLE IF EXISTS "practice_models" DROP CONSTRAINT IF EXISTS "practice_models_practiceName_fkey";
ALTER TABLE IF EXISTS "model_references" DROP CONSTRAINT IF EXISTS "model_references_referenceTitle_fkey";
ALTER TABLE IF EXISTS "paper_practices" DROP CONSTRAINT IF EXISTS "paper_practices_practiceName_fkey";
ALTER TABLE IF EXISTS "paper_practices" DROP CONSTRAINT IF EXISTS "paper_practices_referenceTitle_fkey";
ALTER TABLE IF EXISTS "paper_datasets" DROP CONSTRAINT IF EXISTS "paper_datasets_datasetName_fkey";
ALTER TABLE IF EXISTS "paper_datasets" DROP CONSTRAINT IF EXISTS "paper_datasets_referenceTitle_fkey";
ALTER TABLE IF EXISTS "paper_prompt_techniques" DROP CONSTRAINT IF EXISTS "paper_prompt_techniques_referenceTitle_fkey";

-- 2) Remove residual unique constraints/indexes from old interim state.
ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "users_username_key";
ALTER TABLE IF EXISTS "practices" DROP CONSTRAINT IF EXISTS "practices_name_key";
ALTER TABLE IF EXISTS "datasets" DROP CONSTRAINT IF EXISTS "datasets_name_key";
ALTER TABLE IF EXISTS "references" DROP CONSTRAINT IF EXISTS "references_title_key";
ALTER TABLE IF EXISTS "hyperparameters" DROP CONSTRAINT IF EXISTS "hyperparameters_name_value_referenceId_key";

DROP INDEX IF EXISTS "users_username_key";
DROP INDEX IF EXISTS "practices_name_key";
DROP INDEX IF EXISTS "datasets_name_key";
DROP INDEX IF EXISTS "references_title_key";
DROP INDEX IF EXISTS "hyperparameters_name_value_referenceId_key";

-- 3) Drop old legacy key columns.
ALTER TABLE "users" DROP COLUMN IF EXISTS "id";
ALTER TABLE "practices" DROP COLUMN IF EXISTS "id";
ALTER TABLE "practice_examples" DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "datasets" DROP COLUMN IF EXISTS "id";
ALTER TABLE "references" DROP COLUMN IF EXISTS "id";
ALTER TABLE "hyperparameters" DROP COLUMN IF EXISTS "referenceId", DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "metrics" DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "practice_categories" DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "practice_prompt_techniques" DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "practice_models" DROP COLUMN IF EXISTS "practiceId";
ALTER TABLE "model_references" DROP COLUMN IF EXISTS "referenceId";
ALTER TABLE "paper_practices" DROP COLUMN IF EXISTS "practiceId", DROP COLUMN IF EXISTS "referenceId";
ALTER TABLE "paper_datasets" DROP COLUMN IF EXISTS "datasetId", DROP COLUMN IF EXISTS "referenceId";
ALTER TABLE "paper_prompt_techniques" DROP COLUMN IF EXISTS "referenceId";

-- 4) Ensure final required unique on hyperparameters exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hyperparameters_name_value_referenceTitle_key'
      AND conrelid = 'hyperparameters'::regclass
  ) THEN
    ALTER TABLE "hyperparameters"
      ADD CONSTRAINT "hyperparameters_name_value_referenceTitle_key"
      UNIQUE ("name", "value", "referenceTitle");
  END IF;
END $$;

-- 5) Recreate final FKs so they depend on final PKs, not old unique indexes.
ALTER TABLE "practice_examples"
  ADD CONSTRAINT "practice_examples_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hyperparameters"
  ADD CONSTRAINT "hyperparameters_referenceTitle_fkey"
  FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hyperparameters"
  ADD CONSTRAINT "hyperparameters_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "metrics"
  ADD CONSTRAINT "metrics_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_categories"
  ADD CONSTRAINT "practice_categories_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_prompt_techniques"
  ADD CONSTRAINT "practice_prompt_techniques_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_models"
  ADD CONSTRAINT "practice_models_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "model_references"
  ADD CONSTRAINT "model_references_referenceTitle_fkey"
  FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_practices"
  ADD CONSTRAINT "paper_practices_practiceName_fkey"
  FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_practices"
  ADD CONSTRAINT "paper_practices_referenceTitle_fkey"
  FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_datasets"
  ADD CONSTRAINT "paper_datasets_datasetName_fkey"
  FOREIGN KEY ("datasetName") REFERENCES "datasets"("name") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_datasets"
  ADD CONSTRAINT "paper_datasets_referenceTitle_fkey"
  FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_prompt_techniques"
  ADD CONSTRAINT "paper_prompt_techniques_referenceTitle_fkey"
  FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
