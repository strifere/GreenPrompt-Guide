-- Convert datasets.dataFormatType from enum scalar to enum array safely.
ALTER TABLE "datasets"
  ALTER COLUMN "dataFormatType" DROP DEFAULT;

ALTER TABLE "datasets"
  ALTER COLUMN "dataFormatType" TYPE "DataFormatType"[]
  USING ARRAY["dataFormatType"]::"DataFormatType"[];

ALTER TABLE "datasets"
  ALTER COLUMN "dataFormatType" SET DEFAULT ARRAY['TEXT_ONLY'::"DataFormatType"];
