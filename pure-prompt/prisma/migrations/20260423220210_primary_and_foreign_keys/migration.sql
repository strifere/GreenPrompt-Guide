-- Migrate key model from schema_old.prisma to schema.prisma
-- Nondestructive approach:
-- 1) Add new key columns if missing
-- 2) Backfill new columns from old FK/PK relations
-- 3) Enforce NOT NULL where required by new schema
-- 4) Create UNIQUE/PK/FK constraints for the new model (if not already present)
-- 5) Keep old columns intact (drop them in a later dedicated cleanup script)

BEGIN;

-- =========================
-- 1) ADD NEW COLUMNS
-- =========================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" TEXT;

ALTER TABLE "practices"
  ADD COLUMN IF NOT EXISTS "name" TEXT;

ALTER TABLE "datasets"
  ADD COLUMN IF NOT EXISTS "name" TEXT;

ALTER TABLE "references"
  ADD COLUMN IF NOT EXISTS "title" TEXT;

ALTER TABLE "practice_examples"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "hyperparameters"
  ADD COLUMN IF NOT EXISTS "referenceTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "metrics"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "practice_categories"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "practice_prompt_techniques"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "practice_models"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT;

ALTER TABLE "model_references"
  ADD COLUMN IF NOT EXISTS "referenceTitle" TEXT;

ALTER TABLE "paper_practices"
  ADD COLUMN IF NOT EXISTS "practiceName" TEXT,
  ADD COLUMN IF NOT EXISTS "referenceTitle" TEXT;

ALTER TABLE "paper_datasets"
  ADD COLUMN IF NOT EXISTS "datasetName" TEXT,
  ADD COLUMN IF NOT EXISTS "referenceTitle" TEXT;

ALTER TABLE "paper_prompt_techniques"
  ADD COLUMN IF NOT EXISTS "referenceTitle" TEXT;

-- =========================
-- 2) BACKFILL NEW COLUMNS
-- =========================

-- users.username (new PK) from itself if already present; fallback deterministic value from id.
-- In most real migrations this was already created/fillable before this script.
UPDATE "users"
SET "username" = COALESCE("username", 'user_' || "id"::text)
WHERE "username" IS NULL;

-- practices.name (new PK)
UPDATE "practices"
SET "name" = COALESCE("name", 'practice_' || "id"::text)
WHERE "name" IS NULL;

-- datasets.name (new PK)
UPDATE "datasets"
SET "name" = COALESCE("name", 'dataset_' || "id"::text)
WHERE "name" IS NULL;

-- references.title (new PK)
UPDATE "references"
SET "title" = COALESCE("title", 'reference_' || "id"::text)
WHERE "title" IS NULL;

-- references.title must be unique for the new PK model.
-- If duplicates exist, keep the first title and append id to subsequent duplicates.
WITH ranked_titles AS (
  SELECT
    "id",
    "title",
    ROW_NUMBER() OVER (PARTITION BY "title" ORDER BY "id") AS rn
  FROM "references"
)
UPDATE "references" r
SET "title" = r."title" || ' #' || r."id"::text
FROM ranked_titles rt
WHERE r."id" = rt."id"
  AND rt.rn > 1;

-- practice_examples.practiceName from practices.id -> practices.name
UPDATE "practice_examples" pe
SET "practiceName" = p."name"
FROM "practices" p
WHERE pe."practiceName" IS NULL
  AND pe."practiceId" IS NOT NULL
  AND pe."practiceId" = p."id";

-- hyperparameters.referenceTitle from references.id -> references.title
UPDATE "hyperparameters" h
SET "referenceTitle" = r."title"
FROM "references" r
WHERE h."referenceTitle" IS NULL
  AND h."referenceId" IS NOT NULL
  AND h."referenceId" = r."id";

-- hyperparameters.practiceName from practices.id -> practices.name
UPDATE "hyperparameters" h
SET "practiceName" = p."name"
FROM "practices" p
WHERE h."practiceName" IS NULL
  AND h."practiceId" IS NOT NULL
  AND h."practiceId" = p."id";

-- metrics.practiceName from practices.id -> practices.name
UPDATE "metrics" m
SET "practiceName" = p."name"
FROM "practices" p
WHERE m."practiceName" IS NULL
  AND m."practiceId" IS NOT NULL
  AND m."practiceId" = p."id";

-- practice_categories.practiceName from practices.id -> practices.name
UPDATE "practice_categories" pc
SET "practiceName" = p."name"
FROM "practices" p
WHERE pc."practiceName" IS NULL
  AND pc."practiceId" IS NOT NULL
  AND pc."practiceId" = p."id";

-- practice_prompt_techniques.practiceName from practices.id -> practices.name
UPDATE "practice_prompt_techniques" ppt
SET "practiceName" = p."name"
FROM "practices" p
WHERE ppt."practiceName" IS NULL
  AND ppt."practiceId" IS NOT NULL
  AND ppt."practiceId" = p."id";

-- practice_models.practiceName from practices.id -> practices.name
UPDATE "practice_models" pm
SET "practiceName" = p."name"
FROM "practices" p
WHERE pm."practiceName" IS NULL
  AND pm."practiceId" IS NOT NULL
  AND pm."practiceId" = p."id";

-- model_references.referenceTitle from references.id -> references.title
UPDATE "model_references" mr
SET "referenceTitle" = r."title"
FROM "references" r
WHERE mr."referenceTitle" IS NULL
  AND mr."referenceId" IS NOT NULL
  AND mr."referenceId" = r."id";

-- paper_practices.practiceName/referenceTitle
UPDATE "paper_practices" pp
SET "practiceName" = p."name"
FROM "practices" p
WHERE pp."practiceName" IS NULL
  AND pp."practiceId" IS NOT NULL
  AND pp."practiceId" = p."id";

UPDATE "paper_practices" pp
SET "referenceTitle" = r."title"
FROM "references" r
WHERE pp."referenceTitle" IS NULL
  AND pp."referenceId" IS NOT NULL
  AND pp."referenceId" = r."id";

-- paper_datasets.datasetName/referenceTitle
UPDATE "paper_datasets" pd
SET "datasetName" = d."name"
FROM "datasets" d
WHERE pd."datasetName" IS NULL
  AND pd."datasetId" IS NOT NULL
  AND pd."datasetId" = d."id";

UPDATE "paper_datasets" pd
SET "referenceTitle" = r."title"
FROM "references" r
WHERE pd."referenceTitle" IS NULL
  AND pd."referenceId" IS NOT NULL
  AND pd."referenceId" = r."id";

-- paper_prompt_techniques.referenceTitle
UPDATE "paper_prompt_techniques" ppt
SET "referenceTitle" = r."title"
FROM "references" r
WHERE ppt."referenceTitle" IS NULL
  AND ppt."referenceId" IS NOT NULL
  AND ppt."referenceId" = r."id";

-- =========================
-- 3) ENFORCE REQUIRED NULLABILITY
-- =========================

-- Required by target schema (nullable fields are intentionally skipped)
ALTER TABLE "users"
  ALTER COLUMN "username" SET NOT NULL;

ALTER TABLE "practices"
  ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "datasets"
  ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "references"
  ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "practice_examples"
  ALTER COLUMN "practiceName" SET NOT NULL;

ALTER TABLE "hyperparameters"
  ALTER COLUMN "referenceTitle" SET NOT NULL;

ALTER TABLE "metrics"
  ALTER COLUMN "practiceName" SET NOT NULL;

ALTER TABLE "practice_categories"
  ALTER COLUMN "practiceName" SET NOT NULL;

ALTER TABLE "practice_prompt_techniques"
  ALTER COLUMN "practiceName" SET NOT NULL;

ALTER TABLE "practice_models"
  ALTER COLUMN "practiceName" SET NOT NULL;

ALTER TABLE "model_references"
  ALTER COLUMN "referenceTitle" SET NOT NULL;

ALTER TABLE "paper_practices"
  ALTER COLUMN "practiceName" SET NOT NULL,
  ALTER COLUMN "referenceTitle" SET NOT NULL;

ALTER TABLE "paper_datasets"
  ALTER COLUMN "datasetName" SET NOT NULL,
  ALTER COLUMN "referenceTitle" SET NOT NULL;

ALTER TABLE "paper_prompt_techniques"
  ALTER COLUMN "referenceTitle" SET NOT NULL;

-- =========================
-- 4) BRIDGE CONSTRAINT ADJUSTMENTS
-- =========================

-- Only this UNIQUE exists in the final schema after key migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hyperparameters_name_value_referenceTitle_key'
      AND conrelid = 'hyperparameters'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'hyperparameters_name_value_referenceTitle_key'
      AND n.nspname = current_schema()
  ) THEN
    ALTER TABLE "hyperparameters"
      ADD CONSTRAINT "hyperparameters_name_value_referenceTitle_key"
      UNIQUE ("name", "value", "referenceTitle");
  END IF;
END $$;

-- =========================
-- 5) DROP OLD FK CONSTRAINTS USING LEGACY ID COLUMNS
-- =========================

DO $$
DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT
      con.conname,
      con.conrelid::regclass AS tbl
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND (
        (con.conrelid = 'practice_examples'::regclass AND att.attname = 'practiceId') OR
        (con.conrelid = 'hyperparameters'::regclass AND att.attname IN ('referenceId', 'practiceId')) OR
        (con.conrelid = 'metrics'::regclass AND att.attname = 'practiceId') OR
        (con.conrelid = 'practice_categories'::regclass AND att.attname = 'practiceId') OR
        (con.conrelid = 'practice_prompt_techniques'::regclass AND att.attname = 'practiceId') OR
        (con.conrelid = 'practice_models'::regclass AND att.attname = 'practiceId') OR
        (con.conrelid = 'model_references'::regclass AND att.attname = 'referenceId') OR
        (con.conrelid = 'paper_practices'::regclass AND att.attname IN ('practiceId', 'referenceId')) OR
        (con.conrelid = 'paper_datasets'::regclass AND att.attname IN ('datasetId', 'referenceId')) OR
        (con.conrelid = 'paper_prompt_techniques'::regclass AND att.attname = 'referenceId')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', rec.tbl, rec.conname);
  END LOOP;
END $$;

-- Remove redundant UNIQUE constraints/indexes on columns that are now PRIMARY KEYs,
-- before creating new FKs, so FKs bind to *_pkey and not legacy *_key indexes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_username_key'
      AND conrelid = 'users'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE "users" DROP CONSTRAINT "users_username_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practices_name_key'
      AND conrelid = 'practices'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE "practices" DROP CONSTRAINT "practices_name_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'datasets_name_key'
      AND conrelid = 'datasets'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE "datasets" DROP CONSTRAINT "datasets_name_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'references_title_key'
      AND conrelid = 'references'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE "references" DROP CONSTRAINT "references_title_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hyperparameters_name_value_referenceId_key'
      AND conrelid = 'hyperparameters'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE "hyperparameters" DROP CONSTRAINT "hyperparameters_name_value_referenceId_key";
  END IF;
END $$;

-- =========================
-- 6) PRIMARY KEYS (new model)
-- =========================

DO $$
DECLARE
  rec record;
  current_pk_name text;
  current_pk_cols text[];
BEGIN
  FOR rec IN
    SELECT 'users'::text AS table_name, 'users_pkey'::text AS pkey_name, ARRAY['username']::text[] AS target_cols
    UNION ALL SELECT 'practices', 'practices_pkey', ARRAY['name']
    UNION ALL SELECT 'datasets', 'datasets_pkey', ARRAY['name']
    UNION ALL SELECT 'references', 'references_pkey', ARRAY['title']
    UNION ALL SELECT 'practice_categories', 'practice_categories_pkey', ARRAY['practiceName','categoryName']
    UNION ALL SELECT 'practice_prompt_techniques', 'practice_prompt_techniques_pkey', ARRAY['practiceName','promptTechniqueName']
    UNION ALL SELECT 'practice_models', 'practice_models_pkey', ARRAY['practiceName','modelName']
    UNION ALL SELECT 'model_references', 'model_references_pkey', ARRAY['modelName','referenceTitle']
    UNION ALL SELECT 'paper_practices', 'paper_practices_pkey', ARRAY['practiceName','referenceTitle']
    UNION ALL SELECT 'paper_datasets', 'paper_datasets_pkey', ARRAY['datasetName','referenceTitle']
    UNION ALL SELECT 'paper_prompt_techniques', 'paper_prompt_techniques_pkey', ARRAY['promptTechniqueName','referenceTitle']
  LOOP
    SELECT
      c.conname,
      ARRAY(
        SELECT a.attname
        FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = k.attnum
        ORDER BY k.ord
      )
    INTO current_pk_name, current_pk_cols
    FROM pg_constraint c
    WHERE c.conrelid = to_regclass(rec.table_name)
      AND c.contype = 'p';

    IF current_pk_cols IS DISTINCT FROM rec.target_cols THEN
      IF current_pk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', rec.table_name, current_pk_name);
      END IF;
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I PRIMARY KEY (%s)',
        rec.table_name,
        rec.pkey_name,
        array_to_string(ARRAY(SELECT format('%I', c) FROM unnest(rec.target_cols) AS c), ', ')
      );
    END IF;
  END LOOP;
END $$;

-- =========================
-- 7) FOREIGN KEYS (new model)
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practice_examples_practiceName_fkey'
      AND conrelid = 'practice_examples'::regclass
  ) THEN
    ALTER TABLE "practice_examples"
      ADD CONSTRAINT "practice_examples_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hyperparameters_referenceTitle_fkey'
      AND conrelid = 'hyperparameters'::regclass
  ) THEN
    ALTER TABLE "hyperparameters"
      ADD CONSTRAINT "hyperparameters_referenceTitle_fkey"
      FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hyperparameters_practiceName_fkey'
      AND conrelid = 'hyperparameters'::regclass
  ) THEN
    ALTER TABLE "hyperparameters"
      ADD CONSTRAINT "hyperparameters_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metrics_practiceName_fkey'
      AND conrelid = 'metrics'::regclass
  ) THEN
    ALTER TABLE "metrics"
      ADD CONSTRAINT "metrics_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practice_categories_practiceName_fkey'
      AND conrelid = 'practice_categories'::regclass
  ) THEN
    ALTER TABLE "practice_categories"
      ADD CONSTRAINT "practice_categories_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practice_prompt_techniques_practiceName_fkey'
      AND conrelid = 'practice_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "practice_prompt_techniques"
      ADD CONSTRAINT "practice_prompt_techniques_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'practice_models_practiceName_fkey'
      AND conrelid = 'practice_models'::regclass
  ) THEN
    ALTER TABLE "practice_models"
      ADD CONSTRAINT "practice_models_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'model_references_referenceTitle_fkey'
      AND conrelid = 'model_references'::regclass
  ) THEN
    ALTER TABLE "model_references"
      ADD CONSTRAINT "model_references_referenceTitle_fkey"
      FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'paper_practices_practiceName_fkey'
      AND conrelid = 'paper_practices'::regclass
  ) THEN
    ALTER TABLE "paper_practices"
      ADD CONSTRAINT "paper_practices_practiceName_fkey"
      FOREIGN KEY ("practiceName") REFERENCES "practices"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'paper_practices_referenceTitle_fkey'
      AND conrelid = 'paper_practices'::regclass
  ) THEN
    ALTER TABLE "paper_practices"
      ADD CONSTRAINT "paper_practices_referenceTitle_fkey"
      FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'paper_datasets_datasetName_fkey'
      AND conrelid = 'paper_datasets'::regclass
  ) THEN
    ALTER TABLE "paper_datasets"
      ADD CONSTRAINT "paper_datasets_datasetName_fkey"
      FOREIGN KEY ("datasetName") REFERENCES "datasets"("name") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'paper_datasets_referenceTitle_fkey'
      AND conrelid = 'paper_datasets'::regclass
  ) THEN
    ALTER TABLE "paper_datasets"
      ADD CONSTRAINT "paper_datasets_referenceTitle_fkey"
      FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'paper_prompt_techniques_referenceTitle_fkey'
      AND conrelid = 'paper_prompt_techniques'::regclass
  ) THEN
    ALTER TABLE "paper_prompt_techniques"
      ADD CONSTRAINT "paper_prompt_techniques_referenceTitle_fkey"
      FOREIGN KEY ("referenceTitle") REFERENCES "references"("title") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Keep old *_id and old FK columns untouched in this script.
-- They can be dropped safely in a separate cleanup migration once this migration is validated.

COMMIT;