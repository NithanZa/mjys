# Phase 3: Admin UI — Replace Template Dropdowns with Autocomplete Text Inputs

## Goals
- Replace the `<select>` template dropdown in the "Schedule Class" form with a text input that autocompletes from past class names.
- Add a new API endpoint to fetch distinct class names (and their associated metadata) for autocomplete suggestions.
- Update the class occurrence details sheet to display inline fields instead of template fields.
- Update the calendar page to not reference `templates` state from the API.

## Acceptance Criteria
- [ ] **AC1**: Given an admin opens the "Schedule Class" sheet, when they type in the "Class Name" field, then a dropdown appears with matching class names from past occurrences (case-insensitive, deduplicated, sorted by most recently used).
- [ ] **AC2**: Given an admin selects an autocomplete suggestion, then the `description`, `tagline`, `intensity`, `isSpecial`, and `durationMin` fields are auto-populated from the last occurrence that used that name (but remain editable).
- [ ] **AC3**: Given an admin types a completely new class name, then all metadata fields start empty/default and are fully editable.
- [ ] **AC4**: Given the calendar day cards, when rendering a class occurrence, then `occ.name` is shown (not `occ.template.name`).
- [ ] **AC5**: Given the class details sheet, when displaying class info, then inline fields (`name`, `description`, `tagline`, `intensity`, `isSpecial`) are shown (not `occ.template.*`).
- [ ] **AC6**: Given the admin calendar page loads, then it no longer fetches or stores `templates` from the API.

## Implementation Steps

### 3.1 New API: `GET /api/admin/class-suggestions`
- Returns distinct class names with the metadata from the most recent occurrence using that name.
- Query:
  ```sql
  SELECT DISTINCT ON (name) name, description, tagline, intensity, "isSpecial", "durationMin"
  FROM "ClassOccurrence"
  ORDER BY name, "startsAt" DESC
  ```
- Prisma equivalent: `prisma.classOccurrence.findMany({ orderBy: { startsAt: 'desc' }, select: { name: true, description: true, tagline: true, intensity: true, isSpecial: true, durationMin: true } })` then deduplicate by name in JS (keep first = most recent).
- Response: `[{ name, description, tagline, intensity, isSpecial, durationMin }]`

### 3.2 Update `app/(admin)/admin/calendar/page.tsx`

#### 3.2.1 Remove template state and references
- Remove `templates` state, remove `setTemplates` from `loadCalendarData`.
- Remove `Template` interface.
- Update `Occurrence` interface: replace `template: { ... }` with inline fields: `name`, `description`, `tagline`, `intensity`, `isSpecial`.

#### 3.2.2 Replace form fields
- Remove `formTemplateId` state and `handleTemplateChange`.
- Add states: `formName`, `formDescription`, `formTagline`, `formIntensity`, `formIsSpecial`.
- Add `classSuggestions` state, fetched from `/api/admin/class-suggestions` on mount.
- Build an autocomplete text input component for class name:
  - On focus/typing, filter suggestions by name (case-insensitive `includes` or `startsWith`).
  - Show dropdown list of matching names.
  - On selecting a suggestion, populate all metadata fields.
  - Allow free text input (not restricted to suggestions).
- Add inputs for `description` (textarea), `tagline` (text), `intensity` (select: Gentle/Balanced/Strong), `isSpecial` (checkbox/toggle).

#### 3.2.3 Update calendar day cards
- Replace `occ.template.name` → `occ.name`.
- Replace `occ.template.isSpecial` → `occ.isSpecial`.

#### 3.2.4 Update class details sheet
- Replace `selectedOcc.template.name` → `selectedOcc.name`.
- Replace `selectedOcc.template.intensity` → `selectedOcc.intensity`.
- Replace `selectedOcc.template.isSpecial` → `selectedOcc.isSpecial`.
- Replace `selectedOcc.template.tagline` → `selectedOcc.tagline`.
- Replace `selectedOcc.template.description` → `selectedOcc.description`.
- Sheet title uses `selectedOcc.name`.

#### 3.2.5 Update add submit handler
- Send inline fields in POST body instead of `templateId`.

### 3.3 Create reusable AutocompleteInput component (optional, inline is fine)
- If the autocomplete pattern is simple enough, implement inline in the calendar page.
- Otherwise create `components/ui/AutocompleteInput.tsx` — a controlled text input with a dropdown of suggestions.

## Files Changed
- `app/(admin)/admin/calendar/page.tsx`
- `app/api/admin/class-suggestions/route.ts` (new)
- `components/ui/AutocompleteInput.tsx` (optional, new)
