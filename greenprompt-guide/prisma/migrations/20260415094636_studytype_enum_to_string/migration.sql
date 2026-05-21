/*
  Warnings:

  - Changed the type of `studyType` on the `references` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/

-- 1) Add temporary text column
ALTER TABLE "references"
ADD COLUMN "studyType_new" TEXT;

-- 2) Copy + translate enum[] -> string
-- Example output:
--   {CASE_STUDY,EMPIRICAL_STUDY} -> "Case Study, Empirical Study"
UPDATE "references"
SET "studyType_new" = COALESCE(
  (
    SELECT string_agg(initcap(replace(x::text, '_', ' ')), ', ')
    FROM unnest("studyType") AS x
  ),
  'Other'
)
WHERE "studyType_new" IS NULL;

-- 3) Replace old column
ALTER TABLE "references" DROP COLUMN "studyType";
ALTER TABLE "references" RENAME COLUMN "studyType_new" TO "studyType";
ALTER TABLE "references" ALTER COLUMN "studyType" SET NOT NULL;

-- 4) Drop old enum type (now unused)
DROP TYPE "StudyType";