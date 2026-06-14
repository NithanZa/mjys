# PHASE 3 — Class schedule, detail & booking

## Goals
- Deliver the core utility loop of the app (§4–7 of `user-flow.md`): browse the schedule, open a class, book a slot.
- Stand up the instructor directory as a supporting page.

## Acceptance Criteria
- [x] **AC1**: Given the user opens `/book`, when the page loads, then today's date is selected by default and a horizontal date strip is scrollable left/right with the month label visible (e.g. "June 2026").
- [x] **AC2**: Given the user taps the calendar icon, when the calendar sheet opens, then they can jump to any date within the next 60 days and the strip syncs to that date.
  - Frontend: range is 14 days (the mock window). Easy to widen once backend lands.
- [x] **AC3**: Given a selected date, when the day has classes, then each class card shows time, name, instructor, available slots, and a booking button; when the day has none, an `EmptyState` is shown.
- [x] **AC4**: Given the user taps a class card (not the button), when the route changes, then `/book/[occurrenceId]` shows the full class detail (image, name, time, instructor bio link, description).
  - Hero uses the brand `bg-breath` gradient instead of a per-class image until the backend `imageUrl` lands.
- [~] **AC5** _(button states done; transactional API deferred to backend pass)_: Given the user taps "Book", when the slot is available, then `POST /api/bookings` succeeds, the available-slot count decrements atomically, an `Attendance` row is created (status `booked`), and the button switches to "Booked — Cancel".
  - Frontend: `BookButton` already renders all three states. Bookings are persisted in `localStorage` via `useBookings`. Atomic slot decrement and `Attendance` writes need the backend pass.
- [x] **AC6**: Given a class is full, when the user opens it, then the button is disabled and labeled "Full", with no booking call possible.
  - The Saturday 8:00 mock occurrence is pre-baked to capacity for testing this state.
- [x] **AC7**: Given the user opens `/instructors`, when the page loads, then it lists Kru Nop, Master Shubham, Master Anup (seeded) with photo + short bio, and each is linkable to `/instructors/[slug]`.
  - Photos use initials avatars until real `photoUrl`s are uploaded.

## Deliverables
- **Schema additions**:
  - `Instructor { id, slug @unique, name, bio, photoUrl, order }`
  - `ClassTemplate { id, name, description, imageUrl, durationMin, defaultInstructorId }`
  - `ClassOccurrence { id, templateId, instructorId, startsAt, capacity, bookedCount, status }`
  - extend `Attendance { status: BOOKED | CHECKED_IN | CANCELLED | NO_SHOW }`
- `app/book/page.tsx` — schedule view with `DateStrip`, `CalendarSheet`, `ClassList`.
- `app/book/[occurrenceId]/page.tsx` — class detail.
- `app/instructors/page.tsx`, `app/instructors/[slug]/page.tsx`.
- `components/booking/` — `DateStrip`, `CalendarSheet`, `ClassCard`, `BookButton`, `SlotsRemaining`.
- `app/api/classes/route.ts` — `GET ?from=&to=` returns occurrences with computed `slotsLeft`.
- `app/api/bookings/route.ts` — `POST` (book) and `DELETE` (cancel), both transactional.
- `lib/dates.ts` — date strip generator, timezone-safe (studio TZ: `Asia/Bangkok`).
- `prisma/seed.ts` — seed 3 instructors + 4 class templates + 2 weeks of occurrences.

## Out of scope
- QR check-in flow on the studio side — Phase 5 (or studio-facing build).
- Package balance enforcement (only book if package is active) — Phase 4 wires packages first, then we revisit in Phase 5.

## Frontend-only scope (this pass)
This pass landed the **frontend** half of Phase 3. Schedule data lives in `lib/mock/schedule.ts` (3 instructors, 4 templates, 14 days of deterministic occurrences). Bookings persist in `localStorage` via `lib/mock/bookings-store.ts`.

Deferred to a later **backend pass**:
- Schema additions: `Instructor`, `ClassTemplate`, `ClassOccurrence`, plus the `Attendance` extension.
- `app/api/classes/route.ts` and `app/api/bookings/route.ts` (transactional).
- `prisma/seed.ts` — the mock data above is the source of truth for the seed.
- Real concurrency safety: "two simultaneous bookings on the last slot — exactly one succeeds."

**Migration path**:
1. Run the Phase 2 backend migration (`pnpm prisma migrate dev`).
2. Add the Phase 3 models to `prisma/schema.prisma`, migrate again.
3. Port `lib/mock/schedule.ts` shape into `prisma/seed.ts`.
4. Replace `getOccurrencesForDay` / `getOccurrence` calls with `fetch('/api/classes?...')`.
5. Replace `useBookings` with a real mutation hitting `/api/bookings` (a `useOptimistic` or React Query mutation keeps the UX identical).

## Dependencies
- `date-fns` + `date-fns-tz`, `@tanstack/react-query` (recommended) or native `fetch` + `use` for data fetching.

## Verification
- `pnpm prisma db seed` populates a realistic schedule.
- Manual: book a class, refresh, see persisted booking and decremented slot count; cancel and see it restored.
- Concurrency: two simultaneous bookings on the last slot — exactly one succeeds.
