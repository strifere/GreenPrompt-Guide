BEGIN;

-- -----------------------------
-- 1) Category: id -> name
-- -----------------------------
ALTER TABLE practice_categories
  DROP CONSTRAINT IF EXISTS practice_categories_categoryId_fkey;

ALTER TABLE practice_categories
  ADD COLUMN category_name TEXT;

UPDATE practice_categories pc
SET category_name = c.name
FROM categories c
WHERE pc."categoryId" = c.id;

ALTER TABLE practice_categories
  ALTER COLUMN category_name SET NOT NULL;

ALTER TABLE practice_categories
  DROP CONSTRAINT IF EXISTS practice_categories_pkey;

ALTER TABLE practice_categories
  DROP COLUMN "categoryId";

ALTER TABLE practice_categories
  RENAME COLUMN category_name TO "categoryId";

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_pkey;

ALTER TABLE categories
  ADD CONSTRAINT categories_pkey PRIMARY KEY (name);

ALTER TABLE categories
  DROP COLUMN id;

ALTER TABLE practice_categories
  ADD CONSTRAINT practice_categories_pkey PRIMARY KEY ("practiceId", "categoryId");

ALTER TABLE practice_categories
  ADD CONSTRAINT practice_categories_categoryId_fkey
  FOREIGN KEY ("categoryId") REFERENCES categories(name)
  ON DELETE CASCADE ON UPDATE CASCADE;


-- -----------------------------
-- 2) PromptTechnique: id -> name
-- -----------------------------
ALTER TABLE practice_prompt_techniques
  DROP CONSTRAINT IF EXISTS practice_prompt_techniques_promptTechniqueId_fkey;

ALTER TABLE practice_prompt_techniques
  ADD COLUMN prompt_technique_name TEXT;

UPDATE practice_prompt_techniques ppt
SET prompt_technique_name = pt.name
FROM prompt_techniques pt
WHERE ppt."promptTechniqueId" = pt.id;

ALTER TABLE practice_prompt_techniques
  ALTER COLUMN prompt_technique_name SET NOT NULL;

ALTER TABLE practice_prompt_techniques
  DROP CONSTRAINT IF EXISTS practice_prompt_techniques_pkey;

ALTER TABLE practice_prompt_techniques
  DROP COLUMN "promptTechniqueId";

ALTER TABLE practice_prompt_techniques
  RENAME COLUMN prompt_technique_name TO "promptTechniqueId";

ALTER TABLE prompt_techniques
  DROP CONSTRAINT IF EXISTS prompt_techniques_pkey;

ALTER TABLE prompt_techniques
  ADD CONSTRAINT prompt_techniques_pkey PRIMARY KEY (name);

ALTER TABLE prompt_techniques
  DROP COLUMN id;

ALTER TABLE practice_prompt_techniques
  ADD CONSTRAINT practice_prompt_techniques_pkey
  PRIMARY KEY ("practiceId", "promptTechniqueId");

ALTER TABLE practice_prompt_techniques
  ADD CONSTRAINT practice_prompt_techniques_promptTechniqueId_fkey
  FOREIGN KEY ("promptTechniqueId") REFERENCES prompt_techniques(name)
  ON DELETE CASCADE ON UPDATE CASCADE;


-- -----------------------------
-- 3) Model: id -> name
-- -----------------------------
ALTER TABLE practice_models
  DROP CONSTRAINT IF EXISTS practice_models_modelId_fkey;

ALTER TABLE practice_models
  ADD COLUMN model_name TEXT;

UPDATE practice_models pm
SET model_name = m.name
FROM models m
WHERE pm."modelId" = m.id;

ALTER TABLE practice_models
  ALTER COLUMN model_name SET NOT NULL;

ALTER TABLE practice_models
  DROP CONSTRAINT IF EXISTS practice_models_pkey;

ALTER TABLE practice_models
  DROP COLUMN "modelId";

ALTER TABLE practice_models
  RENAME COLUMN model_name TO "modelId";

ALTER TABLE models
  DROP CONSTRAINT IF EXISTS models_pkey;

ALTER TABLE models
  ADD CONSTRAINT models_pkey PRIMARY KEY (name);

ALTER TABLE models
  DROP COLUMN id;

ALTER TABLE practice_models
  ADD CONSTRAINT practice_models_pkey PRIMARY KEY ("practiceId", "modelId");

ALTER TABLE practice_models
  ADD CONSTRAINT practice_models_modelId_fkey
  FOREIGN KEY ("modelId") REFERENCES models(name)
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;