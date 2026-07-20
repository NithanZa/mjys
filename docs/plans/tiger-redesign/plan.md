# FEATURE: Tiger-themed home page & bottom navbar redesign

## Goals
- Redesign the home page to match the playful, tiger-driven mobile mock-up using assets already in `public/`.
- Replace generic Lucide bottom-nav icons with tiger graphics from `public/` where appropriate, keeping clear labels and active-state styling.
- Make the seasonal/top card reactive to the Thai calendar, falling back to a friendly `Sawasdee, [Name]!` greeting when no major festival is active.

## Acceptance Criteria

### Home page
- [ ] **AC1:** Given a member opens `/`, then the top of the screen shows a small tiger glyph, the studio name "MiTR Journey Yoga Studio", and the tagline "Discover the strength and soul within your everyday journey".
- [ ] **AC2:** Given the current date falls within a defined Thai festival window, then the first scrollable card displays that festival art/text (e.g. "happy SongKran Festival" with the water-gun tiger image).
- [ ] **AC3:** Given the current date is outside all festival windows, then the first scrollable card falls back to a warm "Sawasdee, [Name]!" greeting using `member.displayName` and a welcoming tiger asset.
- [ ] **AC4:** Given the home page renders, then the second scrollable card is a "Promotion" card using one of the `LINE_ALBUM_tiger_*.jpg` assets and links to `/promotion`.
- [ ] **AC5:** Given the home page renders, then the third scrollable card is a "contact us" card using another `LINE_ALBUM_tiger_*.jpg` asset and links to `/contact`.
- [ ] **AC6:** Given the existing home sections (Workshop, Quote, Pose, etc.) are still desired, then they appear beneath the three tiger cards in the same scrollable column.

### Bottom navbar
- [ ] **AC7:** Given the bottom navbar is rendered, then it still shows 5 tabs: Home, Book Classes, Promotion, Activities, Profile.
- [ ] **AC8:** Given the active tab is Home, then the house icon/tiger is highlighted in the primary brand orange and the label is emphasized.
- [ ] **AC9:** Given Promotion, Activities, and Profile tabs use tiger graphics from `public/`, then the graphics are sized consistently (≈24–28 px) and still include text labels.
- [ ] **AC10:** Given the user taps a navbar item, then the navigation target matches the existing routes (`/`, `/book`, `/promotion`, `/about`, `/profile`).

## Deliverables

### New / modified components
1. `app/(shell)/page.tsx` — reordered layout, new header, and three tiger cards.
2. `components/home/TigerHeader.tsx` — small tiger glyph + studio name + tagline.
3. `components/home/ThaiCalendarCard.tsx` — returns festival card or `Sawasdee` fallback based on `useMember().displayName` and a Thai calendar helper.
4. `components/home/TigerPromoCard.tsx` — reusable tiger-illustration card for Promotion / Contact Us.
5. `lib/dates/thai-calendar.ts` — pure helper that maps `Date` → active festival or `null`.
6. `components/layout/BottomNav.tsx` — update to render tiger image icons for Promotion/Activities/Profile, keep House for Home and CalendarCheck for Book Classes.

### Asset mapping (verified against `public/tigers/CONTENTS.md`)
Files live in `public/tigers/`, not `public/` root. Sheets #1-#9 are sticker
grids and must NOT be used as single full-bleed card images (they'd show the
whole grid). Only single-composed assets are used below:

| Usage | Asset | Native size | Notes |
|-------|-------|-------------|-------|
| Header tiger glyph (48px circle) | `LINE_ALBUM_tiger_260719_17.jpg` | 1024×1024 | standalone logo/ta-da pose, downscales cleanly |
| Sawasdee / default greeting bg | `mitr welcome.png` | large | unrelated to tiger set, already fine |
| Festival cards (Songkran, etc.) | `LINE_ALBUM_tiger_260719_{10,11,12,13,14,15,16,17}.jpg` (see `lib/dates/thai-calendar.ts`) | 359×512 – 2048×1447 | no dedicated festival art exists; #10/#17 are large (downscale), #11-16 are smaller single renders (mild upscale, acceptable) |
| Promotion card | `LINE_ALBUM_tiger_260719_10.jpg` | 2048×1447 | banner, downscales cleanly |
| Contact us card | `LINE_ALBUM_tiger_260719_17.jpg` | 1024×1024 | standalone logo pose, downscales cleanly |
| Navbar Promotion icon | `LINE_ALBUM_tiger_260719_12.jpg` | 447×558 | single render, far oversized for 24px icon |
| Navbar Activities icon | `LINE_ALBUM_tiger_260719_13.jpg` | 447×558 | single render, far oversized for 24px icon |
| Navbar Profile icon | `LINE_ALBUM_tiger_260719_14.jpg` | 447×558 | single render, far oversized for 24px icon |

### Thai calendar windows (UTC+7)
Use date ranges with 3-day grace windows around each festival for early/atmosphere display.

- `Sawasdee` fallback — always the default when no festival is active.
- **Songkran** — April 13–15 (extend Apr 12–16).
- **Loy Krathong / Yi Peng** — full moon of the 12th lunar month; approximate Nov 14–16 for 2026/2027 (configurable year map).
- **New Year's** — Dec 29–Jan 2.
- **Chinese New Year** — Jan/Feb per lunar year (configurable year map).
- **Valentine's** — Feb 13–15.
- **Halloween** — Oct 30–31.
- **Christmas** — Dec 24–26.
- **King's Birthday (Chulalongkorn Day)** — Oct 23.
- **Mother's Day** — Aug 12.
- **Father's Day** — Dec 5.

Return shape from `thai-calendar.ts`:

```ts
export interface ThaiFestival {
  id: string;           // e.g. "songkran-2026"
  key: string;          // e.g. "songkran"
  label: string;        // e.g. "happy SongKran Festival"
  image: string;        // e.g. "/LINE_ALBUM_tiger_260719_3.jpg"
  href?: string;        // optional deep link for the card
}
```

## Notes
- Keep the existing `motion/react` entrance animations (`containerVariants`, `itemVariants`).
- Keep the existing `WelcomeBanner` for the Sawasdee fallback if it already accepts `displayName`; otherwise repurpose it into `ThaiCalendarCard`.
- Home, Book, and Profile are better kept with their existing recognizable Lucide icons unless the tiger glyphs read clearly at 24 px; Promotion and Activities should definitely use tiger graphics per the mock.
- Use `next/image` with explicit `width`/`height` for all tiger graphics to avoid layout shift on the home feed.
