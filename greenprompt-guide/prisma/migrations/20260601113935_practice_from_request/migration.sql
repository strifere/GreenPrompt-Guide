/*
  Warnings:

  - A unique constraint covering the columns `[createdFromRequestId]` on the table `practices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "collaboration_requests" ALTER COLUMN "referenceLink" DROP DEFAULT;

-- AlterTable
ALTER TABLE "practices" ADD COLUMN     "createdFromRequestId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "practices_createdFromRequestId_key" ON "practices"("createdFromRequestId");

-- AddForeignKey
ALTER TABLE "practices" ADD CONSTRAINT "practices_createdFromRequestId_fkey" FOREIGN KEY ("createdFromRequestId") REFERENCES "collaboration_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
