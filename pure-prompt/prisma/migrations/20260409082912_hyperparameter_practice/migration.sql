ALTER TABLE "practice_categories" DROP CONSTRAINT IF EXISTS "practice_categories_categoryId_fkey";
ALTER TABLE "practice_models" DROP CONSTRAINT IF EXISTS "practice_models_modelId_fkey";
ALTER TABLE "practice_prompt_techniques" DROP CONSTRAINT IF EXISTS "practice_prompt_techniques_promptTechniqueId_fkey";
ALTER TABLE "model_references" DROP CONSTRAINT IF EXISTS "model_references_modelId_fkey";
ALTER TABLE "paper_prompt_techniques" DROP CONSTRAINT IF EXISTS "paper_prompt_techniques_promptTechniqueId_fkey";

DROP INDEX IF EXISTS "categories_name_key";
DROP INDEX IF EXISTS "models_name_key";
DROP INDEX IF EXISTS "prompt_techniques_name_key";

ALTER TABLE "practice_categories"
  ADD CONSTRAINT "practice_categories_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("name")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_models"
  ADD CONSTRAINT "practice_models_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "models"("name")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "model_references"
  ADD CONSTRAINT "model_references_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "models"("name")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_prompt_techniques"
  ADD CONSTRAINT "practice_prompt_techniques_promptTechniqueId_fkey"
  FOREIGN KEY ("promptTechniqueId") REFERENCES "prompt_techniques"("name")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paper_prompt_techniques"
  ADD CONSTRAINT "paper_prompt_techniques_promptTechniqueId_fkey"
  FOREIGN KEY ("promptTechniqueId") REFERENCES "prompt_techniques"("name")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "hyperparameters" ADD COLUMN     "practiceId" INTEGER;

-- AddForeignKey
ALTER TABLE "hyperparameters" ADD CONSTRAINT "hyperparameters_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
