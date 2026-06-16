/*
  Warnings:

  - Added the required column `address` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "dob" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "tocAccepted" BOOLEAN NOT NULL DEFAULT false;
