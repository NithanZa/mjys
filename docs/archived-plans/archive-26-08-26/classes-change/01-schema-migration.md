# Phase 1: Schema Migration — Remove ClassTemplate, Inline Fields on ClassOccurrence

## Goals
- Drop the `ClassTemplate` model entirely.
- Move `name`, `description`, `tagline`, `intensity`, `isSpecial`, `durationMin` directly onto `ClassOccurrence`.
- Update seed script to create occurrences with inline fields instead of template references.

## Acceptance Criteria
- [ ] **AC1**: `ClassTemplate` model no longer exists in `schema.prisma`.
- [ ] **AC2**: `ClassOccurrence` has inline fields: `name`, `description`, `tagline`, `intensity`, `isSpecial`, `durationMin`.
- [ ] **AC3**: `ClassOccurrence.templateId` FK and relation are removed.
- [ ] **AC4**: Migration runs successfully (data migrated from template fields into occurrence fields before FK drop).
- [ ] **AC5**: `prisma/seed.ts` updated to create occurrences with inline fields.
- [ ] **AC6**: `lib/mock/schedule.ts` updated — `ClassTemplate` interface removed, `ClassOccurrence` interface has inline fields, `OccurrenceView` no longer extends with `template`.

## Implementation Steps

### 1.1 Update `prisma/schema.prisma`
- Delete the `ClassTemplate` model (lines 66-76).
- Add to `ClassOccurrence`:
  ```prisma
  name         String
  description  String
  tagline      String
  intensity    String   // "Gentle" | "Balanced" | "Strong"
  isSpecial    Boolean  @default(false)
  ```
- Remove `templateId` field and `template` relation from `ClassOccurrence`.
- Remove `@@index([templateId])` from `ClassOccurrence`.
- Remove `occurrences ClassOccurrence[]` from `Instructor` (keep it — it's still useful).

### 1.2 Create migration
- Run `prisma migrate dev --name remove_class_templates` via the MCP tool.
- **Important**: Before the FK drop, Prisma needs to copy data. Use a custom migration SQL:
  ```sql
  -- Add new columns
  ALTER TABLE "ClassOccurrence" ADD COLUMN "name" TEXT;
  ALTER TABLE "ClassOccurrence" ADD COLUMN "description" TEXT;
  ALTER TABLE "ClassOccurrence" ADD COLUMN "tagline" TEXT;
  ALTER TABLE "ClassOccurrence" ADD COLUMN "intensity" TEXT;
  ALTER TABLE "ClassOccurrence" ADD COLUMN "isSpecial" BOOLEAN NOT NULL DEFAULT false;

  -- Backfill from joined template
  UPDATE "ClassOccurrence" o
  SET "name" = t."name",
      "description" = t."description",
      "tagline" = t."tagline",
      "intensity" = t."intensity",
      "isSpecial" = t."isSpecial"
  FROM "ClassTemplate" t
  WHERE o."templateId" = t."id";

  -- Set NOT NULL constraints
  ALTER TABLE "ClassOccurrence" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "ClassOccurrence" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "ClassOccurrence" ALTER COLUMN "tagline" SET NOT NULL;
  ALTER TABLE "ClassOccurrence" ALTER COLUMN "intensity" SET NOT NULL;

  -- Drop FK and templateId column
  ALTER TABLE "ClassOccurrence" DROP COLUMN "templateId";
  DROP TABLE "ClassTemplate";
  ```
- If the auto-generated migration doesn't handle the backfill, manually edit the migration SQL file before applying.

### 1.3 Update `prisma/seed.ts`
- Remove `CLASS_TEMPLATES` array and the template seeding loop (lines 78-268, 334-342).
- Inline the class metadata into `DAILY_SCHEDULE_MAP` entries. Each slot should have `name`, `description`, `tagline`, `intensity`, `isSpecial` directly.
- Update the `prisma.classOccurrence.create` call to use inline fields instead of `templateId`.

### 1.4 Update `lib/mock/schedule.ts`
- Remove `ClassTemplate` interface (lines 20-28).
- Remove `CLASS_TEMPLATES` array (lines 111-241).
- Add inline fields to `ClassOccurrence` interface: `name`, `description`, `tagline`, `intensity`, `isSpecial`.
- Update `OccurrenceView` to remove `template: ClassTemplate`.
- Update `Slot` interface to include inline class fields.
- Update `DAILY_SCHEDULE_MAP` entries to include inline class metadata.
- Update `ensureOccurrences()` to populate inline fields.
- Update `toView()` to not look up template.
- Remove `getTemplate()` function.

## Files Changed
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_remove_class_templates/migration.sql` (new)
- `prisma/seed.ts`
- `lib/mock/schedule.ts`
