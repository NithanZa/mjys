# FEATURE: Shared schedule cache and smaller Book fetches

## Goals

- Stop downloading ~2 years of class occurrences on every visit to Book.
- Cache **public, shared** schedule (and later catalogs) on the server for a few minutes so every member hits Prisma less often.
- Keep booking, cancel, pay, remaining classes, and QR check-in on live data.
- Leave optional device snapshots (`localStorage`) until after the server path works — LINE WebView storage is unreliable.

## Product decisions (locked)

1. **Staleness:** A few minutes is OK for the class grid, instructor list, packages, and banners. Live paths stay live: `POST /api/bookings`, occurrence detail, remaining classes, QR.
2. **Where:** Server/shared cache first (Next cache tags / `unstable_cache` / `'use cache'` per current Next docs). Do **not** introduce Redis for this unless the host cannot use the Next data cache. Upstash stays rate-limit only unless that fallback is required.
3. **Calendar payload:** Shrink the default Book window and lazy-load other months. Do not cache a 2-year blob.
4. **Device PII:** Allowed later if namespaced by member/admin id and cleared on logout. Not phase 1.
5. **First slice:** Member Book calendar (easiest). Shared catalogs next, then admin aggregates, then optional device snapshot / member-profile cache.

## Current system (why this exists)

Member Book (`app/(shell)/book/page.tsx`) fetches `today−1` through `+2 years` on every mount via `GET /api/classes`. Instructors refetch the same way. Almost every API sets `dynamic = "force-dynamic"`. There is no `revalidateTag`, no shared query cache, and no React Query/SWR. Redis is used only for auth rate limits.

`slotsLeft` is derived from `bookedCount` inside `GET /api/classes`. Caching that JSON means spot counts can lag a few minutes. **Overbook is still prevented** because `POST /api/bookings` reads Prisma live.

## Target mental model

```
Book UI  →  small date window (this month + 2) → GET /api/classes?from&to
                ↓
         server cache keyed by snapped range + tag `classes`
                ↓
         Prisma only on miss or after admin schedule write (revalidateTag)

Month change in InlineCalendar → fetch that month if not already loaded → merge by occurrence id

Book / cancel → live API; do not bust the shared class list cache
```

## Acceptance criteria

- [ ] AC1: Given a member opens Book, when the schedule loads, then the first request covers **yesterday through the end of the current month + 2 months** (studio TZ), not +2 years.
- [ ] AC2: Given they page the calendar into a month outside the loaded window, when that month is shown, then that month is fetched and merged; days already loaded are not refetched.
- [ ] AC3: Given two members request the same snapped `from`/`to` within the TTL, when no admin schedule write happened, then Prisma is not queried twice for that range (server cache hit).
- [ ] AC4: Given staff create, edit, cancel, delete, or CSV-import classes, when the next member request arrives, then the cached schedule is gone (tag revalidation) and the new class can appear before TTL expiry.
- [ ] AC5: Given a class fills up, when another member books during the cache TTL, then the book API still rejects at capacity; the grid may still show a stale `slotsLeft` for a few minutes.
- [ ] AC6: Given a member opens occurrence detail or books/cancels, when those requests run, then they are not served from the shared class-list cache.

## Deliverables

- **Phase 1** (`01-book-window-and-lazy-load.md`): Snap ranges, shrink default fetch, lazy-load months. Biggest win, no cache infra.
- **Phase 2** (`02-server-cache-classes.md`): Cache `GET /api/classes` (and instructors) ~3 minutes; `revalidateTag` on admin class/staff writes.
- **Phase 3** (`03-server-cache-catalogs.md`): Same pattern for packages and home banners.
- **Phase 4** (`04-admin-calendar-and-stats.md`): Short TTL for admin calendar range + heavy stats (optional after member path).
- **Phase 5** (`05-optional-device-and-member-cache.md`): Namespaced device snapshot and shared `useMember` — only if still needed.

## Out of scope

- Caching QR tokens, admin JWT, LINE tokens, or slip images.
- Busting the public class list on every member book/cancel.
- Replacing LIFF/session cookies with `localStorage` auth.
- React Query/SWR as a product requirement (in-memory merge on Book is enough for phase 1).
- Changing how far ahead staff **may** schedule classes (calendar can still navigate ~2 years; we just do not fetch it all up front).
