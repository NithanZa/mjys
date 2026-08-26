# PHASE 2: Shared server cache for classes and instructors

## Goals

- Cache Prisma results for `GET /api/classes` and `GET /api/instructors` for about **3 minutes**.
- Invalidate immediately when staff change the schedule or instructor directory.
- Do **not** invalidate on member book/cancel (stale `slotsLeft` for a few minutes is accepted).

## Acceptance criteria

- [ ] AC1: Given two `GET /api/classes` with the same snapped `from`/`to` within TTL and no schedule write, when the second runs, then it does not hit Prisma for that query.
- [ ] AC2: Given staff POST/PATCH/DELETE a class or CSV-import, when the next `GET /api/classes` runs, then it is a cache miss (or a fresh query) and includes the write.
- [ ] AC3: Given staff create/update/delete an instructor, when the next `GET /api/instructors` runs, then it is fresh.
- [ ] AC4: Given `POST /api/classes` (single occurrence) or `POST /api/bookings`, when they run, then they still read/write Prisma live — not the list cache.
- [ ] AC5: Given `force-dynamic` is still required for some routes, when caching is added, then it is **query-level** (`unstable_cache` / `'use cache'` + `cacheTag`) so the HTTP route can stay dynamic. Confirm against `node_modules/next/dist/docs/` for this Next version before coding.
- [ ] AC6: Range keys use the snapped ISO strings from phase 1. Unsnapped millisecond timestamps must not be cache keys.

## Design decisions

- **Current Next integration:** use `unstable_cache` with tags so existing
  `dynamic = "force-dynamic"` route handlers remain dynamic while Prisma query
  results are shared.
- **TTL:** 180 seconds (a few minutes). Prefer tag + TTL so admin writes win over waiting out the clock.
- **Tags:** `classes` for occurrence lists; `instructors` for the public instructor list. Centralize names in `lib/cache/tags.ts`.
- **Key:** `["classes", fromIso, toIso]`. Drop cancelled classes in the cached payload the same way the route does today (`isCancelled: false`).
- **Do not cache `slotsLeft` separately.** It rides along in the list JSON; all known occupancy writes invalidate the class tag. Capacity enforcement still stays live in `app/api/bookings/route.ts`.
- **Do not use Redis** unless Next data cache does not work on the deployment. If fallback is needed, reuse Upstash with prefix `cache:classes:` and the same TTL/tag story — document the choice in a comment.
- **Remove or narrow `export const dynamic = "force-dynamic"`** on these two GET handlers only if docs say that blocks `unstable_cache`. Prefer caching the Prisma call inside the handler over turning the route into a full static fetch cache.
- **Admin calendar** stays uncached in this phase (`/api/admin/calendar` is a different payload and includes cancelled classes / rosters).

## Implementation plan

- [ ] Read this repo’s Next docs for `cacheTag`, `revalidateTag`, `unstable_cache`, `'use cache'`, `cacheLife`.
- [ ] Add `lib/cache/tags.ts` (`CLASSES`, `INSTRUCTORS`) and a small `lib/cache/classes.ts` that wraps `prisma.classOccurrence.findMany` (+ `slotsLeft` mapping) and instructor `findMany`.
- [ ] Call the wrappers from `app/api/classes/route.ts` GET and `app/api/instructors/route.ts`.
- [ ] Leave POST `app/api/classes` uncached.
- [ ] Call `revalidateTag(CLASSES)` from:
  - `app/api/admin/classes/route.ts` POST
  - `app/api/admin/classes/[id]/route.ts` PATCH and DELETE
  - `app/api/admin/classes/import/csv/route.ts` after successful import
- [ ] Call `revalidateTag(INSTRUCTORS)` (and `CLASSES` if denormalized instructor fields are embedded on occurrences) from staff create/update/delete routes (`app/api/admin/staff/...`).
- [ ] Grep admin class writes (xlsx import if any) so none are missed.
- [x] Expire `CLASSES` after successful booking/cancellation and approved special-class reservations.

## Files

- `lib/cache/tags.ts` (new)
- `lib/cache/classes.ts` (new) — server-only
- `app/api/classes/route.ts`
- `app/api/instructors/route.ts`
- `app/api/admin/classes/route.ts`
- `app/api/admin/classes/[id]/route.ts`
- `app/api/admin/classes/import/csv/route.ts`
- `app/api/admin/staff/route.ts` and `app/api/admin/staff/[id]/route.ts` (confirm paths)

## Data notes

- Cached rows still include `bookedCount` / `slotsLeft`; successful occupancy mutations expire them.
- Occurrence detail (`fetchOccurrence`) should remain the source of truth before pay/book UI that needs exact spots — keep it uncached.

## Verification

- [ ] Two identical GETs to `/api/classes?from=&to=` (snapped): second is faster / no extra Prisma in logs.
- [ ] Admin adds a class in the window: next Book load shows it without waiting 3 minutes.
- [ ] Book a class to capacity: second member’s **book request** fails even if the card still shows a spot.
- [ ] Instructor rename: About / Book filter dropdown updates after revalidation.
