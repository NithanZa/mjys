# Phase 5: XLSX Export — Beautiful Format for Social Media Posting

## Goals
- Add "Export XLSX" button on the admin calendar page that downloads a beautifully formatted Excel file for the selected month.
- The XLSX should be visually appealing — styled headers, color-coded by intensity, alternating row colors, studio branding — suitable for posting on social media or sharing with members.

## Acceptance Criteria
- [ ] **AC1**: Given an admin clicks "Export XLSX", then an `.xlsx` file downloads containing the month's schedule.
- [ ] **AC2**: The XLSX has a branded title row with the studio name "MiTR Journey" and the month name.
- [ ] **AC3**: The XLSX has styled column headers (bold, colored background, white text).
- [ ] **AC4**: Class rows are color-coded by intensity (Gentle = soft green, Balanced = soft blue, Strong = soft red/orange).
- [ ] **AC5**: Special classes are highlighted (e.g., gold border or star icon in the name).
- [ ] **AC6**: The XLSX includes columns: Date, Day, Time, Class Name, Instructor, Duration, Intensity, Capacity, Special.
- [ ] **AC7**: Column widths are auto-sized for readability.
- [ ] **AC8**: The file opens correctly in Excel, Google Sheets, and Numbers.

## Implementation Steps

### 5.1 Add XLSX library dependency
- Add `exceljs` to `package.json` — it supports styling, formulas, and is well-maintained.
- (Alternative: `xlsx`/SheetJS, but the community version has limited styling support. `exceljs` is recommended for beautiful formatting.)

### 5.2 New API: `GET /api/admin/export/xlsx`
- Query param: `month` (format `YYYY-MM`).
- Fetch all occurrences for that month, including `instructor`.
- Create workbook with `exceljs`:
  - **Title row**: Merge cells A1:I1, set value to `MiTR Journey — {Month Name} {Year}`, font: bold 16px, fill: studio primary color, alignment: center.
  - **Spacer row**: Empty row for visual breathing room.
  - **Header row**: Bold white text on dark primary background.
    - Columns: Date | Day | Time | Class | Instructor | Duration | Intensity | Capacity | Special
  - **Data rows**: One per occurrence, sorted by `startsAt`.
    - Date: `YYYY-MM-DD` format.
    - Day: `Monday`, `Tuesday`, etc.
    - Time: `HH:MM`.
    - Class: Name (prefix with "★ " if special).
    - Instructor: Instructor name.
    - Duration: `{N} min`.
    - Intensity: Color-coded cell fill.
    - Capacity: `{bookedCount}/{capacity}` or just `{capacity}`.
    - Special: "Yes" or "" — with gold fill if yes.
  - **Styling**:
    - Alternating row background (white / very light gray).
    - Intensity cell fills: Gentle = `#E8F5E9` (light green), Balanced = `#E3F2FD` (light blue), Strong = `#FFF3E0` (light orange).
    - Special class row: Left border accent in gold (`#FFD700`).
    - Borders: Thin light gray on all cells.
    - Font: Sans-serif, 11px for data, 12px for headers.
  - **Column widths**: Auto-fit based on content (or set sensible fixed widths).
  - **Freeze panes**: Freeze the header row.
- Set response headers:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="schedule-YYYY-MM.xlsx"`
- Write workbook to buffer and return.

### 5.3 Update `app/(admin)/admin/calendar/page.tsx`
- Add "Export XLSX" button next to "Export CSV".
- Same pattern: fetch `/api/admin/export/xlsx?month=YYYY-MM`, trigger download via blob.

## Files Changed
- `app/api/admin/export/xlsx/route.ts` (new)
- `app/(admin)/admin/calendar/page.tsx`
- `package.json` (add `exceljs`)
