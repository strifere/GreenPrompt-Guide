-- CreateTable
CREATE TABLE "admin-requests" (
    "id" SERIAL NOT NULL,
    "request" TEXT NOT NULL,
    "requesterUsername" TEXT NOT NULL,

    CONSTRAINT "admin-requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin-requests_requesterUsername_key" ON "admin-requests"("requesterUsername");

-- AddForeignKey
ALTER TABLE "admin-requests" ADD CONSTRAINT "admin-requests_requesterUsername_fkey" FOREIGN KEY ("requesterUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;
