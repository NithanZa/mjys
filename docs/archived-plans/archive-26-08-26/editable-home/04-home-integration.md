# PHASE 4: Home Page Integration & Migration

## Goals
- Replace the two hardcoded `TigerPromoCard`s on the home page with a dynamic list fetched from `GET /api/home-banners`.
- Seed the new `HomeBanner` table with the current "Promotion" and "Contact Us" entries so the home page is visually unchanged immediately after this ships.
- Extend `TigerPromoCard` to support external `https://` links (open in new tab) in addition to internal paths.

## Acceptance Criteria
- [ ] AC1: `TigerPromoCard` (`components/home/TigerPromoCard.tsx`) renders an `<a target="_blank" rel="noopener noreferrer">` when `href` starts with `http://` or `https://`, and a `next/link` otherwise (unchanged behavior for internal paths) — implemented via a small internal helper so hover/tap animations stay identical for both cases.
- [ ] AC2: `app/(shell)/page.tsx` fetches active banners (via a new `lib/api/home-banners.ts` helper calling `GET /api/home-banners`) and renders a `TigerPromoCard` per banner (`sortOrder` ascending) in place of the two hardcoded `<TigerPromoCard>` blocks currently at lines ~110-126.
- [ ] AC3: A one-time seed (either a script run once via `prisma/seed.ts` addition, or a manual `prisma studio` / SQL insert documented here) creates two `HomeBanner` rows matching today's hardcoded cards:
  - `{ title: "Promotion", eyebrow: "Special offers", href: "/promotion", imageUrl: "/tigers/LINE_ALBUM_tiger_260719_10.jpg", sortOrder: 1, isActive: true }`
  - `{ title: "Contact Us", eyebrow: "We'd love to hear from you", href: "/contact", imageUrl: "/tigers/LINE_ALBUM_tiger_260719_16.jpg", sortOrder: 2, isActive: true }`

  Note: these seeded `imageUrl` values point at local `public/tigers/*.jpg` files, not the Supabase `banners` bucket — that's fine, `imageUrl` is just rendered as-is by `next/image`/`<img>`; admins can replace them with uploaded images later via `/admin/banners`.
- [ ] AC4: Given the `GET /api/home-banners` request fails or returns an empty list, when the home page renders, then it degrades gracefully (renders nothing for that section, no crash) — same resilience expectation as other home page sections.
- [ ] AC5: Loading state on the home page for the banner section doesn't cause a jarring layout shift — reserve space or fade in, consistent with the existing `motion.div` stagger pattern already used for other home page sections.

## Deliverables
- **`components/home/TigerPromoCard.tsx`**: internal/external link branching.
- **`lib/api/home-banners.ts`**: `getHomeBanners(): Promise<HomeBanner[]>` fetch helper, following the pattern of `lib/api/instructors.ts`.
- **`app/(shell)/page.tsx`**: replace the two hardcoded `TigerPromoCard` blocks with a `.map()` over fetched banners.
- **Seed data**: added to `prisma/seed.ts` (guarded so it doesn't duplicate rows on repeat runs, e.g. `upsert` by a stable identifier or a check for existing count) — or documented manual insert if the user prefers not to touch the seed script.

## Out of Scope
- Removing the unused `bannerImageUrl`/`bannerHref` fields from the `HomeContent` model (left as dead columns for now to avoid an unrelated migration; can be cleaned up separately).
- SSR/ISR caching strategy beyond "no aggressive caching" — full performance tuning is out of scope.
