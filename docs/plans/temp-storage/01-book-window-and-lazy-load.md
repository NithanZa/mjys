# PHASE 1: Smaller Book window and lazy-load months

## Goals

- Cut the default `/api/classes` payload from ~2 years to a short studio-local window.
- Load further months only when the member actually opens them.
- Snap `from`/`to` to stable calendar boundaries so phase 2 cache keys can hit.

## Why this is first

This is the easiest vertical: client + existing `from`/`to` query params. No Next cache, Redis, or invalidation yet. It already removes most of the “load the calendar every time” cost.

## Acceptance criteria

- [ ] AC1: Given Book mounts with no month navigation, when `fetchClasses` runs, then `from` is the start of **yesterday** in studio TZ and `to` is the end of **current month + 2 months** in studio TZ (inclusive).
- [ ] AC2: Given `InlineCalendar` still allows navigating out to ~2 years, when the visible month is outside the loaded set, then Book fetches that month (snapped `startOfMonth`–`endOfMonth` studio TZ) and merges by occurrence `id`.
- [ ] AC3: Given the member returns to a month already loaded in this page session, when they navigate back, then that month is not fetched again.
- [ ] AC4: Given a month fetch is in flight, when the grid for that month is shown, then empty-day vs loading is distinguishable (do not flash “no classes” as if the month were empty).
- [ ] AC5: Given `from`/`to` are built, when they are serialized to the query string, then they are the same ISO strings for every member on that studio calendar day (not `new Date()` to the millisecond). Unique timestamps would make phase 2 caches miss forever.

## Design decisions

- **Studio TZ** (`STUDIO_TZ` in `lib/dates.ts`) owns month boundaries, not the browser timezone.
- **Default window:** yesterday → end of month+2. Yesterday keeps late-night / timezone edge classes visible; +2 months covers typical browsing without 24 months of rows.
- **Horizon:** keep `min`/`max` on `InlineCalendar` as today−1 through +2 years so far-future admin classes remain reachable.
- **Merge:** `Map<id, OccurrenceView>` (or sort after concat + dedupe). Later fetches overwrite the same id so a refetch can refresh `slotsLeft`.
- **Month callback:** `InlineCalendar` reports visible month changes (`onVisibleMonthChange`) so Book can fetch. Do not fetch every 42-cell grid including adjacent-month bleed; fetch the **named month** in the header (`MMMM yyyy`).
- **Prefetch (optional in this phase):** prefetch previous/next month after idle. Nice; not required for AC.
- **Instructors:** still one `fetchInstructors()` on Book mount. Caching them is phase 2.
- **List vs calendar:** the unfiltered “Upcoming Classes” feed only needs the default window. Selecting a far-future day may need that day’s month to be loaded first (trigger the same lazy fetch).

## Implementation plan

- [ ] Add `lib/dates` (or `lib/api/class-range.ts`) helpers, used by Book and later by the cache key:
  - `snappedClassWindow(today)` → `{ from, to }` for the default window.
  - `snappedMonthRange(year, month)` → `{ from, to }` for one month.
  - Serialize with a stable ISO (e.g. `fromZonedTime` at start/end of local day).
- [ ] Change `app/(shell)/book/page.tsx`:
  - Initial `useEffect` fetches `snappedClassWindow` only.
  - Track `loadedMonthKeys` (`yyyy-MM`) and `loadingMonth`.
  - On visible month change, if key missing, fetch that month and merge.
  - Pass calendar `min`/`max` horizon separately from loaded data.
- [ ] Extend `components/booking/InlineCalendar.tsx` with `onVisibleMonthChange` (fire on mount and when `shift` changes `cursor`).
- [ ] Keep `fetchClasses(from, to)` as-is; callers pass snapped dates.
- [ ] Do not add `localStorage` in this phase.

## Files

- `lib/dates.ts` and/or `lib/api/class-range.ts` (new helpers)
- `app/(shell)/book/page.tsx`
- `components/booking/InlineCalendar.tsx`
- Other `fetchClasses` callers — grep and leave wide ranges only if they still need them (occurrence detail uses `fetchOccurrence`, not the list).

## Data notes

- Far-future classes exist until someone navigates there; the feed will not list them until that month is loaded. That is intended.
- `slotsLeft` in the merged list is as-of the fetch that last wrote that id.

## Verification

- [ ] Open Book: network shows one `/api/classes` with a ~3-month span, not +2 years.
- [ ] Page to a month 6+ months out: a second request for that month only; list/calendar populate without a false empty state.
- [ ] Page back: no third request for that month in the same session.
- [ ] Filters (instructor, intensity, open spots) still apply to the merged set.
- [ ] Pick a day in an unloaded month: fetch runs, then that day’s classes show.
