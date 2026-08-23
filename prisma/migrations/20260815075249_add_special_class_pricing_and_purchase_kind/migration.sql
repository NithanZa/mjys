/*
  Warnings:

  - Added the required column `amountTHB` to the `PendingPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchaseKind" AS ENUM ('PACKAGE', 'SPECIAL_CLASS');

-- AlterTable
ALTER TABLE "ClassOccurrence" ADD COLUMN     "specialPriceTHB" INTEGER;

-- AlterTable
ALTER TABLE "PendingPurchase" ADD COLUMN     "amountTHB" INTEGER NOT NULL,
ADD COLUMN     "classOccurrenceId" TEXT,
ADD COLUMN     "kind" "PurchaseKind" NOT NULL DEFAULT 'PACKAGE',
ALTER COLUMN "packageOfferId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PendingPurchase_classOccurrenceId_idx" ON "PendingPurchase"("classOccurrenceId");

-- AddForeignKey
ALTER TABLE "PendingPurchase" ADD CONSTRAINT "PendingPurchase_classOccurrenceId_fkey" FOREIGN KEY ("classOccurrenceId") REFERENCES "ClassOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
