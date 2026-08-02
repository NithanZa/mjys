<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:home-page-assets -->
## Home Page Assets

When working on the home page (`app/(shell)/page.tsx`) and its components under `components/home/`:

- Store promotional images in `public/` and reference them with root paths (e.g., `/mitr welcome.png`, `/2026_0628 workshop kruEX line.png`).
- Use `next/image` with `fill` and `object-cover` / `object-center` for banner images.
- Time-bound promotional cards should auto-hide when expired, mirroring `WorkshopPromo` (it compares the current date to the workshop date and returns `null` outside the promotion window).
- Export new home page components from `components/home/index.ts` so `app/(shell)/page.tsx` can import them from `@/components/home`.

Current home page rendering order:

1. `TigerHeader` — studio header with mascot image.
2. `ThaiCalendarCard` — calendar/greeting card; accepts `displayName`.
3. `MilestoneCelebrationCard` — shown only when the member has an unseen milestone.
4. `TigerPromoCard` list — dynamic home banners fetched from `/api/home-banners`.
5. `WorkshopPromo` — links to `/book/occ_2026-06-28_0`; auto-hides after the promotion window.
6. `QuoteCard` and `PoseCard` — weekly quote and pose.
<!-- END:home-page-assets -->
