/*
  Warnings:

  - You are about to drop the `admin-requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin-requests" DROP CONSTRAINT "admin-requests_requesterUsername_fkey";

-- DropTable
DROP TABLE "admin-requests";
