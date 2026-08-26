# PHASE 4: Admin calendar and stats (short TTL)

## Goals

- Make admin week/month navigation cheaper without serving a stale roster at check-in time.
- Cache heavy aggregate endpoints (member stats, staff stats) with a short TTL.

## When to do this

After phases 1–3. Admin traffic is small; Prisma cost per request is high (especially stats). Skip this phase if admin already feels fine once member Book is fixed.

## Acceptance criteria

- [ ] AC1: Given admin calendar GETs the same `start`/`end` twice within TTL with no class write, when the second runs, then the occurrence query is cached.
- [ ] AC2: Given a class write that already `revalidateTag(CLASSES)`, when admin calendar is opened, then it is fresh (share the `classes` tag or a dedicated `admin-calendar` tag that those writes also bust).
- [ ] AC3: Given `/api/admin/members/stats` or `/api/admin/staff/stats` for a month, when refetched within TTL, then aggregates are reused.
- [ ] AC4: Given scanner verify or roster fetch, when they run, then they are **not** served from the calendar list cache (live attendance).
- [ ] AC5: Cached admin JSON is not written to `localStorage` in this phase (session is cookie-based; optional device cache is phase 5).

## Design decisions

- **TTL:** 60–180 seconds. Stats can be longer (e.g. 5 minutes) because they are historical; calendar should share class-write invalidation.
- **Auth:** Cache **after** `verifyAdmin`. Never cache a 401. Keys must not include other members’ data; these endpoints are studio-global (except affinity, which is per member id — key by `memberId`, TTL short).
- **Affinity** (`/api/admin/members/affinity`): optional; key by member id; bust on attendance writes if we bother. Easy to leave uncached.
- **Do not cache** `/api/admin/scanner/verify`, roster GET, pending slips (must be fresh for operations).

## Implementation plan

- [ ] Cache `GET /api/admin/calendar` occurrence+instructor pair with tag `classes` (or `admin-calendar` also revalidated from the same admin class writes as phase 2).
- [ ] Cache stats routes keyed by month query param.
- [ ] Confirm admin calendar UI already fetches a week/month window (not 2 years). If it fetches unbounded when params are missing, snap a default window like Book.

## Files

- `app/api/admin/calendar/route.ts`
- `app/api/admin/members/stats/route.ts`
- `app/api/admin/staff/stats/route.ts`
- Admin class mutation routes (already tagging from phase 2)

## Verification

- [ ] Flip week on admin calendar: repeat of the same week is cheap.
- [ ] Edit a class: calendar reflects it on the next load.
- [ ] Scanner still checks in against live QR/attendance.
- [ ] Change stats month: new key; changing back within TTL hits cache.
