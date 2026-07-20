# FEATURE: Classes System Overhaul — Remove Templates, Add CSV/XLSX Import-Export

## Goals
- Eliminate the `ClassTemplate` model — each class occurrence is self-contained with its own text fields (name, description, tagline, intensity, isSpecial, durationMin).
- Replace template `<select>` dropdowns with text inputs that autocomplete from past class names.
- Add month-level CSV export/import in a standardized format for interoperability.
- Add beautiful XLSX export for social-media posting.

## Acceptance Criteria
- [ ] **AC1**: Given the schema is migrated, when any code references `ClassTemplate`, then it no longer exists — `ClassOccurrence` stores all class metadata inline (name, description, tagline, intensity, isSpecial, durationMin).
- [ ] **AC2**: Given an admin is scheduling a class, when they type the class name, then an autocomplete dropdown suggests names from past occurrences (case-insensitive, deduplicated).
- [ ] **AC3**: Given an admin is on the calendar page, when they click "Export CSV" for a month, then a CSV file downloads containing all occurrences for that month in the standardized format.
- [ ] **AC4**: Given an admin has a CSV file in the standard format, when they click "Import CSV" and select the file, then all occurrences for that month are created/updated in the database.
- [ ] **AC5**: Given an admin is on the calendar page, when they click "Export XLSX" for a month, then a beautifully formatted XLSX file downloads suitable for social-media posting.
- [ ] **AC6**: Given the public booking pages, when they render class details, then they read from the inline fields on `ClassOccurrence` (not a template relation).

## Deliverables
- **Phase 1** (`01-schema-migration.md`): Prisma schema changes, data migration, seed update.
- **Phase 2** (`02-api-refactor.md`): Update all API routes to remove template references.
- **Phase 3** (`03-admin-ui-autocomplete.md`): Replace template dropdowns with autocomplete text inputs.
- **Phase 4** (`04-csv-export-import.md`): CSV export/import endpoints and UI buttons.
- **Phase 5** (`05-xlsx-export.md`): XLSX export endpoint and UI button with beautiful formatting.

## Out of Scope
- Bulk recurring class generation UI (can be done via CSV import).
- Editing class metadata after occurrence creation beyond what's already editable (capacity, instructor, cancel, delete).
