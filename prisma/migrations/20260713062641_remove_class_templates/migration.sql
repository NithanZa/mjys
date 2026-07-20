/*
  Migration: remove ClassTemplate and inline all metadata onto ClassOccurrence.
  Steps:
    1. Drop FK + index on templateId.
    2. Add new nullable columns.
    3. Backfill new columns from ClassTemplate.
    4. Make new columns NOT NULL.
    5. Drop templateId column + ClassTemplate table.
*/

-- DropForeignKey
ALTER TABLE "ClassOccurrence" DROP CONSTRAINT "ClassOccurrence_templateId_fkey";

-- DropIndex
DROP INDEX "ClassOccurrence_templateId_idx";

-- AlterTable: add new columns as nullable first so we can backfill existing rows
ALTER TABLE "ClassOccurrence"
ADD COLUMN "description" TEXT,
ADD COLUMN "intensity" TEXT,
ADD COLUMN "isSpecial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "name" TEXT,
ADD COLUMN "tagline" TEXT;

-- Backfill new columns from joined ClassTemplate
UPDATE "ClassOccurrence" o
SET "name" = t."name",
    "description" = t."description",
    "tagline" = t."tagline",
    "intensity" = t."intensity",
    "isSpecial" = t."isSpecial"
FROM "ClassTemplate" t
WHERE o."templateId" = t."id";

-- Make new columns NOT NULL now that all rows are populated
ALTER TABLE "ClassOccurrence"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "intensity" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "tagline" SET NOT NULL;

-- AlterTable: drop templateId column
ALTER TABLE "ClassOccurrence" DROP COLUMN "templateId";

-- DropTable
DROP TABLE "ClassTemplate";
