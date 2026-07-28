# FEATURE: Booking Frontend — Real Data Migration + RLS Hardening

## Root Cause
`app/(shell)/book/page.tsx` and related client pages read from
`lib/mock/schedule.ts`, a hardcoded generator that only produces occurrences
for `2026-06-01`..`2026-06-30`. Admin CSV imports write real rows into
`ClassOccurrence` via Prisma (`app/api/admin/classes/import/csv/route.ts`),
and a real read endpoint already exists (`app/api/classes/route.ts`), but no
client page calls it — so imported classes outside June (e.g. August) never
render, regardless of DB state.

## Goals
- Client pages render real DB data so any admin-imported class (any month)
  shows up immediately.
- Booking/cancel actions always hit the real `/api/bookings` (already fully
  implemented with LINE-token + package-decrement logic), never the
  localStorage mock, including in standalone-cookie-auth mode.
- Harden the underlying Supabase Postgres project with RLS as defense in
  depth, since all app tables live in the `public` schema which Supabase
  auto-exposes via PostgREST/Data API unless RLS blocks it. The app itself
  never talks to Postgres via anon/authenticated Supabase roles (it uses a
  direct Prisma/`pg` pooled connection + `service_role` for storage), so
  correct policy is deny-all for `anon`/`authenticated` on every table.

## Acceptance Criteria
- [x] AC1: Given classes imported via the admin CSV importer (any date,
      including August 2026+), when a member opens `/book`, then those
      classes appear in the calendar and upcoming list.
- [x] AC2: Given a class occurrence id, when visiting `/book/[occurrenceId]`,
      then real DB fields (name, instructor, capacity, slotsLeft) render.
- [x] AC3: Given the About/Instructors pages, when rendered, then real
      `Instructor` rows from the DB are shown (via new `/api/instructors`).
- [x] AC4: Given a logged-in member (LIFF or standalone-cookie), when they
      book/cancel a class, then the request goes to `/api/bookings`
      (POST/DELETE), not `localStorage`.
- [x] AC5: Given the Supabase Postgres project, when RLS is audited, then
      every table in `public` schema has RLS enabled with restrictive
      policies. **Verified via `scripts/check-rls.ts`** — all 13 public
      tables report `rowsecurity = true`; PII/financial tables (`Member`,
      `Attendance`, `Package`, `PendingPurchase`, `MemberToyPart`,
      `MemberMilestone`) have zero policies (deny-all for
      `anon`/`authenticated`), and content tables (`Instructor`,
      `ClassOccurrence`, `HomeContent`, `PackageOffer`, `ToyPart`,
      `Milestone`) expose SELECT-only policies. Already covered by
      migrations `20260709065931_enable_rls_sensitive_tables` and
      `20260709071003_enable_rls_public_content` — **no new migration
      needed**.
- [x] AC6: Admin dashboard code untouched; `pnpm build` succeeds and the
      admin routes/APIs still compile and are unchanged.

## Deliverables
1. New endpoint `app/api/instructors/route.ts` — `GET` all instructors,
   ordered by `order`.
2. `app/(shell)/book/page.tsx` — fetch `/api/classes?from&to` instead of
   `getAllOccurrences()`/`getScheduleRange()`. Use a wide static range
   (e.g. today - 1 day .. +2 years) since there's no admin UI constraint on
   how far out classes can be scheduled.
3. `app/(shell)/book/[occurrenceId]/page.tsx` — fetch via `POST /api/classes`
   (existing single-occurrence lookup) instead of `getOccurrence()`.
4. `components/booking/ClassCard.tsx`, `components/booking/InlineCalendar.tsx`
   — retype against the real API shape (Prisma `ClassOccurrence & { instructor }`
   with computed `slotsLeft`) instead of importing `OccurrenceView` from the
   mock module. `InlineCalendar` takes an `occurrences` list as a prop instead
   of calling `getOccurrencesForDay()` itself.
5. `app/(shell)/instructors/[slug]/page.tsx`, `app/(shell)/about/page.tsx`,
   `components/about/InstructorGrid.tsx` — use `/api/instructors` data
   instead of the mock `INSTRUCTORS` array / `getInstructor()`.
6. `lib/api/bookings.ts` (new, replaces `lib/mock/bookings-store.ts`) —
   `useBookings` now accounts for `NEXT_PUBLIC_STANDALONE_MODE`, matching the
   pattern in `lib/profile/use-member.ts`, so standalone-mode bookings never
   silently fall back to localStorage. Also exposes `error` and `refresh`.
7. `lib/mock/schedule.ts` and `lib/mock/bookings-store.ts` — **deleted**; no
   production code referenced them any more (the only remaining consumer,
   the unused `getNextBooking()` helper, went with them).
8. RLS: no migration required — already enabled and correctly scoped (see
   AC5). Added `scripts/check-rls.ts` as a repeatable audit
   (`pnpm exec tsx scripts/check-rls.ts`) that fails if any `public` table
   lacks RLS.
9. `app/api/classes/route.ts` — invalid `from`/`to` params now return 400
   instead of falling through to a Prisma error and a 500.
10. Manual verification steps (see below) — no automated test harness exists
    in this repo currently.

## Verification (done)
- `pnpm exec tsc --noEmit` — clean.
- `pnpm build` — succeeds; `/api/instructors` appears in the route manifest.
- `GET /api/instructors` — returns 9 instructors from the DB.
- `GET /api/classes?from=…&to=…` (today-1d .. +2y) — returns 56 occurrences,
  54 of them in **2026-08**, i.e. exactly the August imports that were
  previously invisible to the client.
- `pnpm exec tsx scripts/check-rls.ts` — all public tables RLS-enabled.

## Remaining manual UI checks
- Import a class dated in August 2026 via the admin dashboard CSV importer.
- Visit `/book` as a member and confirm the class appears in the calendar
  and upcoming list; open its detail page; book and cancel it.
- Confirm `/about` and `/instructors/[slug]` show DB-backed instructors
  (including any instructor auto-created by the CSV import).
- Run `select tablename, rowsecurity from pg_tables where schemaname='public';`
  and confirm `rowsecurity = true` for all app tables after the RLS migration.
