# Phase 4: CSV Export/Import for Month

## Goals
- Add "Export CSV" button on the admin calendar page that downloads all occurrences for a selected month in a standardized CSV format.
- Add "Import CSV" button that uploads a CSV file and creates/updates occurrences for that month.
- The CSV format is the same for both export and import, ensuring round-trip fidelity.

## Acceptance Criteria
- [ ] **AC1**: Given an admin is on the calendar page, when they click "Export CSV", then a CSV file downloads containing all occurrences for the currently-viewed month.
- [ ] **AC2**: The CSV has headers: `date,time,durationMin,name,description,tagline,intensity,isSpecial,instructorName,capacity,bookedCount`.
- [ ] **AC3**: The CSV uses ISO date format (`YYYY-MM-DD`) and 24-hour time (`HH:MM`).
- [ ] **AC4**: Given an admin clicks "Import CSV" and selects a file, when the file is parsed, then occurrences are created or updated (matched by `date` + `time` + `name`).
- [ ] **AC5**: Import validates instructor names against the database and errors on unknown instructors.
- [ ] **AC6**: Import is transactional — if any row fails, no changes are committed.
- [ ] **AC7**: Import shows a success/error summary after completion.

## Standardized CSV Format

```
date,time,durationMin,name,description,tagline,intensity,isSpecial,instructorName,capacity,bookedCount
2026-06-01,07:00,60,Easy Flow,A gentle and slow-paced flow...,Find your flow ease your mind.,Gentle,false,Kru Shubham,15,5
2026-06-02,07:00,60,Morning Stretching,Awaken your body...,Awaken and energize.,Gentle,false,Kru Nop,15,4
```

- `date`: `YYYY-MM-DD`
- `time`: `HH:MM` (24-hour, studio timezone)
- `isSpecial`: `true` or `false`
- `intensity`: `Gentle` | `Balanced` | `Strong`
- `instructorName`: Must match an existing instructor's `name` in the database
- `bookedCount`: Optional on import — defaults to 0 if omitted

## Implementation Steps

### 4.1 New API: `GET /api/admin/export/csv`
- Query param: `month` (format `YYYY-MM`).
- Fetch all occurrences where `startsAt` is within that month (studio timezone).
- Include `instructor` relation.
- Generate CSV string with headers as specified above.
- Return as `text/csv` with `Content-Disposition: attachment; filename="schedule-YYYY-MM.csv"`.

### 4.2 New API: `POST /api/admin/import/csv`
- Accept `multipart/form-data` with a `file` field and a `month` field (`YYYY-MM`).
- Parse the CSV file (use a simple parser — no heavy dependency needed, or add `papaparse`).
- Validate each row:
  - Required fields present.
  - `instructorName` matches an existing instructor.
  - `intensity` is one of the allowed values.
  - `date` + `time` form a valid datetime within the specified month.
- For each row, upsert the occurrence:
  - Match by `startsAt` (date + time) — if an occurrence exists at that datetime with that name, update it; otherwise create.
  - Use `prisma.$transaction` for atomicity.
- Return JSON: `{ success: true, created: N, updated: N, errors: [...] }`.

### 4.3 Add CSV parsing dependency
- Add `papaparse` and `@types/papaparse` to `package.json` (or implement a simple CSV parser inline — papaparse is recommended for robustness with quoted fields).

### 4.4 Update `app/(admin)/admin/calendar/page.tsx`
- Add "Export CSV" and "Import CSV" buttons next to the "Schedule Class" button.
- Export: fetch `/api/admin/export/csv?month=YYYY-MM`, trigger download via blob.
- Import: file input (hidden), on file select → POST to `/api/admin/import/csv` with `FormData`.
- Show import results in a toast/alert.
- Determine the month from `currentDate` (the currently viewed week's month, or add a month selector).

## Files Changed
- `app/api/admin/export/csv/route.ts` (new)
- `app/api/admin/import/csv/route.ts` (new)
- `app/(admin)/admin/calendar/page.tsx`
- `package.json` (add `papaparse`)
