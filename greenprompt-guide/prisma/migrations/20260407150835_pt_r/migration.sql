-- CreateTable
CREATE TABLE "paper_prompt_techniques" (
    "promptTechniqueId" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_prompt_techniques_pkey" PRIMARY KEY ("promptTechniqueId","referenceId")
);

-- RenameForeignKey
ALTER TABLE "practice_categories" RENAME CONSTRAINT "practice_categories_categoryid_fkey" TO "practice_categories_categoryId_fkey";

-- RenameForeignKey
ALTER TABLE "practice_models" RENAME CONSTRAINT "practice_models_modelid_fkey" TO "practice_models_modelId_fkey";

-- RenameForeignKey
ALTER TABLE "practice_prompt_techniques" RENAME CONSTRAINT "practice_prompt_techniques_prompttechniqueid_fkey" TO "practice_prompt_techniques_promptTechniqueId_fkey";

-- AddForeignKey
ALTER TABLE "paper_prompt_techniques" ADD CONSTRAINT "paper_prompt_techniques_promptTechniqueId_fkey" FOREIGN KEY ("promptTechniqueId") REFERENCES "prompt_techniques"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_prompt_techniques" ADD CONSTRAINT "paper_prompt_techniques_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce: every prompt_techniques row must have at least one linked reference
CREATE OR REPLACE FUNCTION check_prompt_technique_has_reference(pt_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM paper_prompt_techniques ppt
    WHERE ppt."promptTechniqueId" = pt_name
  ) THEN
    RAISE EXCEPTION 'PromptTechnique "%" must have at least one Reference', pt_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_check_prompt_technique_min_one_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'prompt_techniques' THEN
    PERFORM check_prompt_technique_has_reference(NEW.name);
  ELSIF TG_TABLE_NAME = 'paper_prompt_techniques' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM check_prompt_technique_has_reference(OLD."promptTechniqueId");
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD."promptTechniqueId" IS DISTINCT FROM NEW."promptTechniqueId" THEN
        PERFORM check_prompt_technique_has_reference(OLD."promptTechniqueId");
      END IF;
      PERFORM check_prompt_technique_has_reference(NEW."promptTechniqueId");
    ELSE
      PERFORM check_prompt_technique_has_reference(NEW."promptTechniqueId");
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER prompt_technique_must_have_reference_on_prompt
AFTER INSERT OR UPDATE OF name ON prompt_techniques
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_check_prompt_technique_min_one_ref();

CREATE CONSTRAINT TRIGGER prompt_technique_must_have_reference_on_join
AFTER INSERT OR UPDATE OR DELETE ON paper_prompt_techniques
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_check_prompt_technique_min_one_ref();