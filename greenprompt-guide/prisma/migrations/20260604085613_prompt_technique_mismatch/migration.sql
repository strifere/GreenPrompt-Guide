CREATE OR REPLACE FUNCTION public.check_prompt_technique_has_reference(pt_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM paper_prompt_techniques ppt
    WHERE ppt."promptTechniqueName" = pt_name  -- Fixed column name here
  ) THEN
    RAISE EXCEPTION 'PromptTechnique "%" must have at least one Reference', pt_name;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_check_prompt_technique_min_one_ref() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_TABLE_NAME = 'prompt_techniques' THEN
    PERFORM check_prompt_technique_has_reference(NEW.name);
  ELSIF TG_TABLE_NAME = 'paper_prompt_techniques' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM check_prompt_technique_has_reference(OLD."promptTechniqueName"); -- Fixed
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD."promptTechniqueName" IS DISTINCT FROM NEW."promptTechniqueName" THEN -- Fixed
        PERFORM check_prompt_technique_has_reference(OLD."promptTechniqueName"); -- Fixed
      END IF;
      PERFORM check_prompt_technique_has_reference(NEW."promptTechniqueName"); -- Fixed
    ELSE
      PERFORM check_prompt_technique_has_reference(NEW."promptTechniqueName"); -- Fixed
    END IF;
  END IF;

  RETURN NULL;
END;
$$;