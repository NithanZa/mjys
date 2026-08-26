# FEATURE: Client About Page Revamp

## Goals
- Improve the public `/about` page so it feels more polished and studio-branded.
- Focus on the **Instructors** tab: better use of photos, cleaner cards, and richer instructor information.
- Keep the existing tabbed structure (Instructors / Staff / Map) while upgrading visuals and interactions.

## Background
- Page: `app/(shell)/about/page.tsx`.
- Tabs: `components/about/AboutTabs.tsx` (currently uses emoji + `grid-cols-3` buttons).
- Instructor grid: `components/about/InstructorGrid.tsx` (`grid-cols-2 sm:grid-cols-3`, `Avatar` in a gray `h-36` placeholder box).
- Data: `GET /api/instructors` returns `Instructor[]` with `id`, `slug`, `name`, `title`, `bio`, `photoUrl`, `initials`, `order`.
- Staff: `components/about/StaffList.tsx`, `StaffCard.tsx`, `lib/mock/about.ts`.
- Dependencies: project uses `motion/react` (not `framer-motion`) and `@phosphor-icons/react` (Icon suffix only).

## Acceptance Criteria
- [x] AC1: The **Instructors** tab shows each instructor in a card with a large, full-bleed `next/image` photo (when `photoUrl` exists) and an `Avatar` fallback only for missing photos.
- [x] AC2: Instructor cards use a consistent aspect-ratio image area, rounded corners, and a subtle hover lift/scale animation using `motion/react`.
- [x] AC3: Each instructor card displays `name`, `title`, and the full `bio` directly on the about page (no "View profile" link since the detail page shows the same content).
- [x] AC4: Tab buttons replace emoji with `@phosphor-icons/react` icons (e.g., `UsersIcon`, `UsersThreeIcon`, `MapPinIcon`) and keep active + hover states; never alias plain names.
- [x] AC5: Loading and empty states are handled for the instructor list (skeleton/placeholder cards and an empty message).
- [x] AC6: The **Staff** and **Map** tabs are visually aligned (spacing, border, typography, backgrounds) with the new Instructors tab style.
- [x] AC7: No visual regressions on mobile; the layout remains usable and the grid does not overflow.

## Deliverables
1. `app/(shell)/about/page.tsx` — wire up the new `InstructorGrid` and any shared page-level layout/spacing updates.
2. `components/about/InstructorGrid.tsx` — redesign instructor cards (image, hover, bio excerpt, profile link, responsive grid).
3. `components/about/AboutTabs.tsx` — switch to Phosphor icons and refine visual styles.
4. `components/about/StaffCard.tsx` / `StaffList.tsx` — minor polish to match the new card language.
5. `docs/plans/about-revamp/01-design-notes.md` (optional) — final photo sizes, color tokens, and any new copy.

## Out of Scope
- Admin or API changes for instructors/staff (handled by `docs/plans/staff-directory`).
- `Instructor` detail page (`/instructors/[slug]`) redesign.
- New fields or data migrations for the `Instructor` model.
