-- CreateEnum
CREATE TYPE "TacticType" AS ENUM ('GREEN_PRACTICE', 'RED_PRACTICE');

-- CreateEnum
CREATE TYPE "DataFormatType" AS ENUM ('TEXT_ONLY', 'IMAGE', 'PDF', 'CSV', 'HTML', 'ANY_FORMAT');

-- CreateEnum
CREATE TYPE "EnergyMetricType" AS ENUM ('REDUCTION', 'CONSUMPTION', 'EFFICIENCY');

-- CreateEnum
CREATE TYPE "AccuracyLevel" AS ENUM ('WORSE', 'SAME', 'SAME_OR_BETTER', 'BETTER', 'MUCH_BETTER', 'NEAR_PERFECT');

-- CreateEnum
CREATE TYPE "MetricSubtype" AS ENUM ('ENERGY', 'ACCURACY', 'GENERIC');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('EMPIRICAL_STUDY', 'CASE_STUDY', 'COMPARATIVE_STUDY', 'DESIGN_SCIENCE_RESEARCH', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tactic" "TacticType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_categories" (
    "practiceId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_categories_pkey" PRIMARY KEY ("practiceId","categoryId")
);

-- CreateTable
CREATE TABLE "energy_metrics" (
    "metricId" INTEGER NOT NULL,
    "practiceId" INTEGER NOT NULL,
    "type" "EnergyMetricType" NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "bestGuessValue" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'PERCENTAGE',

    CONSTRAINT "energy_metrics_pkey" PRIMARY KEY ("metricId")
);

-- CreateTable
CREATE TABLE "accuracy_metrics" (
    "metricId" INTEGER NOT NULL,
    "practiceId" INTEGER NOT NULL,
    "level" "AccuracyLevel" NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "accuracy_metrics_pkey" PRIMARY KEY ("metricId")
);

-- CreateTable
CREATE TABLE "practice_examples" (
    "id" SERIAL NOT NULL,
    "practiceId" INTEGER NOT NULL,
    "scenario" TEXT NOT NULL,
    "originalPrompts" TEXT NOT NULL,
    "improvedPrompts" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_techniques" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "example" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_prompt_techniques" (
    "practiceId" INTEGER NOT NULL,
    "promptTechniqueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_prompt_techniques_pkey" PRIMARY KEY ("practiceId","promptTechniqueId")
);

-- CreateTable
CREATE TABLE "models" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT,
    "dataFormat" "DataFormatType" NOT NULL DEFAULT 'TEXT_ONLY',
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_models" (
    "practiceId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_models_pkey" PRIMARY KEY ("practiceId","modelId")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "size" TEXT,
    "dataFormatType" "DataFormatType" NOT NULL DEFAULT 'TEXT_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "references" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "abstract" TEXT,
    "keywords" TEXT,
    "year" INTEGER NOT NULL,
    "studyType" "StudyType"[],
    "domain" TEXT,
    "task" TEXT,
    "venue" TEXT,
    "toolAvailability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_practices" (
    "practiceId" INTEGER NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_practices_pkey" PRIMARY KEY ("practiceId","referenceId")
);

-- CreateTable
CREATE TABLE "paper_datasets" (
    "datasetId" INTEGER NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_datasets_pkey" PRIMARY KEY ("datasetId","referenceId")
);

-- CreateTable
CREATE TABLE "hyperparameters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hyperparameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_hyperparameters" (
    "referenceId" INTEGER NOT NULL,
    "hyperparameterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_hyperparameters_pkey" PRIMARY KEY ("referenceId","hyperparameterId")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" SERIAL NOT NULL,
    "subtype" "MetricSubtype" NOT NULL DEFAULT 'GENERIC',
    "title" TEXT,
    "value" TEXT,
    "description" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "practices_name_key" ON "practices"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_techniques_name_key" ON "prompt_techniques"("name");

-- CreateIndex
CREATE UNIQUE INDEX "models_name_key" ON "models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "datasets_name_key" ON "datasets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hyperparameters_name_value_key" ON "hyperparameters"("name", "value");

-- AddForeignKey
ALTER TABLE "practice_categories" ADD CONSTRAINT "practice_categories_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_categories" ADD CONSTRAINT "practice_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_metrics" ADD CONSTRAINT "energy_metrics_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_metrics" ADD CONSTRAINT "energy_metrics_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accuracy_metrics" ADD CONSTRAINT "accuracy_metrics_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accuracy_metrics" ADD CONSTRAINT "accuracy_metrics_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_examples" ADD CONSTRAINT "practice_examples_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_prompt_techniques" ADD CONSTRAINT "practice_prompt_techniques_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_prompt_techniques" ADD CONSTRAINT "practice_prompt_techniques_promptTechniqueId_fkey" FOREIGN KEY ("promptTechniqueId") REFERENCES "prompt_techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_models" ADD CONSTRAINT "practice_models_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_models" ADD CONSTRAINT "practice_models_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_practices" ADD CONSTRAINT "paper_practices_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_practices" ADD CONSTRAINT "paper_practices_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_datasets" ADD CONSTRAINT "paper_datasets_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_datasets" ADD CONSTRAINT "paper_datasets_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_hyperparameters" ADD CONSTRAINT "paper_hyperparameters_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_hyperparameters" ADD CONSTRAINT "paper_hyperparameters_hyperparameterId_fkey" FOREIGN KEY ("hyperparameterId") REFERENCES "hyperparameters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
