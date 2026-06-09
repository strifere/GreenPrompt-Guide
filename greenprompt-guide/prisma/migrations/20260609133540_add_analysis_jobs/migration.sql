-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "status" "AnalysisJobStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_jobs_requestId_key" ON "analysis_jobs"("requestId");

-- AddForeignKey
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "collaboration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
