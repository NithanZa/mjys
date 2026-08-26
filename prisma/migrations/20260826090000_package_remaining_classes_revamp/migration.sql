-- This migration intentionally stops if legacy unlimited/null balances exist.
-- Convert those rows to finite values before deploying.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "PackageOffer"
    WHERE "type" = 'UNLIMITED' OR "classCount" IS NULL
  ) THEN
    RAISE EXCEPTION 'Package revamp requires finite PackageOffer.classCount values';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Package"
    WHERE "classesRemaining" IS NULL
  ) THEN
    RAISE EXCEPTION 'Package revamp requires finite Package.classesRemaining values';
  END IF;
END $$;

ALTER TYPE "PackageType" RENAME TO "PackageType_old";
CREATE TYPE "PackageType" AS ENUM ('CLASSES_5', 'CLASSES_10', 'CLASSES_20', 'WALK_IN');
ALTER TABLE "PackageOffer"
  ALTER COLUMN "type" TYPE "PackageType"
  USING ("type"::text::"PackageType");
DROP TYPE "PackageType_old";

ALTER TABLE "PackageOffer"
  ALTER COLUMN "classCount" SET NOT NULL;
ALTER TABLE "Package"
  ALTER COLUMN "classesRemaining" SET NOT NULL;

ALTER TABLE "PackageOffer"
  ADD CONSTRAINT "PackageOffer_classCount_positive" CHECK ("classCount" > 0);
ALTER TABLE "Package"
  ADD CONSTRAINT "Package_classesRemaining_nonnegative" CHECK ("classesRemaining" >= 0);

ALTER TABLE "Attendance" ADD COLUMN "consumedPackageId" TEXT;
CREATE INDEX "Attendance_consumedPackageId_idx" ON "Attendance"("consumedPackageId");
ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_consumedPackageId_fkey"
  FOREIGN KEY ("consumedPackageId") REFERENCES "Package"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep legacy labels useful without making status the source of truth.
UPDATE "Package"
SET "status" = 'EXPIRED'
WHERE "expiresAt" < NOW() AND "status" = 'ACTIVE';

UPDATE "Package"
SET "status" = 'EXHAUSTED'
WHERE "classesRemaining" = 0 AND "status" = 'ACTIVE';
