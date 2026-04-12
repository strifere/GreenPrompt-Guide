-- CreateTable
CREATE TABLE "model_references" (
    "modelId" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_references_pkey" PRIMARY KEY ("modelId","referenceId")
);

-- AddForeignKey
ALTER TABLE "model_references" ADD CONSTRAINT "model_references_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_references" ADD CONSTRAINT "model_references_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
