-- CreateIndex
CREATE INDEX "idx_hyperparameters_reference_title" ON "hyperparameters"("referenceTitle");

-- CreateIndex
CREATE INDEX "idx_hyperparameters_practice_name" ON "hyperparameters"("practiceName");

-- CreateIndex
CREATE INDEX "idx_metrics_practice_name" ON "metrics"("practiceName");

-- CreateIndex
CREATE INDEX "idx_model_references_reference_title" ON "model_references"("referenceTitle");

-- CreateIndex
CREATE INDEX "idx_paper_datasets_reference_title" ON "paper_datasets"("referenceTitle");

-- CreateIndex
CREATE INDEX "idx_paper_practices_reference_title" ON "paper_practices"("referenceTitle");

-- CreateIndex
CREATE INDEX "idx_paper_prompt_techniques_reference_title" ON "paper_prompt_techniques"("referenceTitle");

-- CreateIndex
CREATE INDEX "idx_practice_categories_category_name" ON "practice_categories"("categoryName");

-- CreateIndex
CREATE INDEX "idx_practice_examples_practice_name" ON "practice_examples"("practiceName");

-- CreateIndex
CREATE INDEX "idx_practice_models_model_name" ON "practice_models"("modelName");

-- CreateIndex
CREATE INDEX "idx_practice_prompt_techniques_prompt_technique_name" ON "practice_prompt_techniques"("promptTechniqueName");
