-- CreateEnum
CREATE TYPE "CollaborationRequestStatus" AS ENUM ('PENDING', 'REQUESTED_MORE_INFO', 'DENIED', 'APPROVED');

-- CreateEnum
CREATE TYPE "CollaborationRequestMessageType" AS ENUM ('MORE_INFO_REQUEST', 'RESPONSE', 'NOTE');

-- CreateTable
CREATE TABLE "collaboration_requests" (
    "id" SERIAL NOT NULL,
    "requesterUsername" TEXT NOT NULL,
    "reviewerUsername" TEXT,
    "status" "CollaborationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "practiceTitle" TEXT NOT NULL,
    "practiceSummary" TEXT NOT NULL,
    "practiceDescription" TEXT NOT NULL,
    "practiceExamples" TEXT,
    "hyperparameters" TEXT,
    "promptTechniques" TEXT,
    "supportingPdfName" TEXT NOT NULL,
    "supportingPdfPath" TEXT NOT NULL,
    "supportingPdfMimeType" TEXT NOT NULL,
    "supportingPdfSizeBytes" INTEGER NOT NULL,
    "rejectionReason" TEXT,
    "reviewerNotes" TEXT,
    "requestedMoreInfoAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_request_messages" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "authorRole" "UserRole" NOT NULL,
    "type" "CollaborationRequestMessageType" NOT NULL DEFAULT 'NOTE',
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaboration_request_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collaboration_requests_requesterUsername_idx" ON "collaboration_requests"("requesterUsername");

-- CreateIndex
CREATE INDEX "collaboration_requests_status_idx" ON "collaboration_requests"("status");

-- CreateIndex
CREATE INDEX "collaboration_request_messages_requestId_idx" ON "collaboration_request_messages"("requestId");

-- CreateIndex
CREATE INDEX "collaboration_request_messages_authorUsername_idx" ON "collaboration_request_messages"("authorUsername");

-- CreateIndex
CREATE INDEX "collaboration_request_messages_requestId_readAt_idx" ON "collaboration_request_messages"("requestId", "readAt");

-- AddForeignKey
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_requesterUsername_fkey" FOREIGN KEY ("requesterUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_reviewerUsername_fkey" FOREIGN KEY ("reviewerUsername") REFERENCES "users"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_request_messages" ADD CONSTRAINT "collaboration_request_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "collaboration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_request_messages" ADD CONSTRAINT "collaboration_request_messages_authorUsername_fkey" FOREIGN KEY ("authorUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;
