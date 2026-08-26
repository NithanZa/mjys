# PHASE 3: Shared server cache for packages and home banners

## Goals

- Apply the same ~3 minute tagged cache to other **public, rarely written** lists: active package offers and home banners.
- Invalidate on admin pricing and banner writes so the home/promotion pages do not wait out TTL.

## Acceptance criteria

- [ ] AC1: Given `GET /api/packages` twice within TTL with no pricing write, when the second runs, then Prisma is not queried for active offers.
- [ ] AC2: Given staff create/update/deactivate a `PackageOffer`, when the next `GET /api/packages` runs, then it is fresh.
- [ ] AC3: Given `GET /api/home-banners` twice within TTL with no banner write, when the second runs, then Prisma is not queried for banners.
- [ ] AC4: Given staff create/update/reorder/deactivate a home banner, when the next home load runs, then it is fresh.
- [ ] AC5: Member purchase, slip upload, and remaining-classes APIs stay uncached / live.

## Design decisions

- **Tags:** `package-offers`, `home-banners` in `lib/cache/tags.ts`.
- **TTL:** 180 seconds, same as classes, unless banner campaigns need faster default expiry — still bust on write.
- **Client `cache: "no-store"`** on `lib/api/home-banners.ts` today bypasses the browser HTTP cache. Keep that. Server-side Prisma cache still helps every SSR/server hit; the client fetch still reaches the route, which may return a cached Prisma result.
- **Do not cache** `/api/purchases`, `/api/members/me`, bookings, or slip lists.

## Implementation plan

- [ ] Wrap `packageOffer.findMany({ where: { active: true } })` and `homeBanner.findMany({ where: { isActive: true } })` with the same cache helper pattern as phase 2.
- [ ] `revalidateTag` from admin package routes and admin banner routes (POST/PATCH/DELETE/reorder).
- [ ] Grep `PackageOffer` and `HomeBanner` mutations so none are missed.

## Files

- `lib/cache/tags.ts`
- `app/api/packages/route.ts`
- `app/api/home-banners/route.ts`
- `app/api/admin/packages/route.ts` and `[id]/route.ts`
- `app/api/admin/banners/` (confirm exact paths)

## Verification

- [ ] Promotion page: two reloads within TTL do not double the offers query.
- [ ] Admin toggles a package inactive: member Promotion no longer shows it on the next request.
- [ ] Admin adds a home banner: Home shows it on the next request without waiting 3 minutes.
- [ ] `getHomeBanners()` still uses `cache: "no-store"` on the client fetch.
