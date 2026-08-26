# PHASE 1 — Foundation: Design system, app shell & LIFF

## Goals
- Lock the design-token plumbing and a reusable UI primitive library so feature work in later phases never has to invent components.
- Establish a LIFF-safe app shell (safe areas, bottom nav, route layout) inside a working `liff.init()` flow.

## Acceptance Criteria
- [x] **AC1**: Given the app is opened in the LINE in-app browser, when it loads, then `liff.init()` resolves and `liff.isInClient()` is logged without errors.
- [x] **AC2**: Given any route, when it renders, then the warm background, Mitr headings, and Noto Sans Thai body are applied and safe-area insets are honored on iPhone notch/home-indicator.
- [x] **AC3**: Given `<html data-semantic-theme="warm|earthy|bright">` is toggled, when components using semantic tokens render, then success/warning/error/info colors switch with no rebuild.
- [x] **AC4**: Given a UI primitive (`Button`, `Card`, `Input`, `Badge`, `Chip`, `Avatar`, `BottomNav`, `TopBar`, `Sheet`), when used, then it consumes only design tokens from `globals.css` and matches §3 of `brand-guideline.md`.
- [x] **AC5**: Given the 5 main routes (`/`, `/book`, `/promotion`, `/instructors`, `/profile`), when navigated via the bottom nav, then the active route highlights with `primary/500` and the route renders inside the shell.
- [x] **AC6**: Given a tap on any interactive element, when the user touches it, then there is no blue/grey iOS tap-flash and a custom `:active` / `:focus-visible` state is shown.

## Deliverables
- `app/(shell)/layout.tsx` — authenticated/shell layout with `<TopBar>` + `<BottomNav>` + safe-area handling.
- `app/page.tsx`, `app/book/page.tsx`, `app/promotion/page.tsx`, `app/instructors/page.tsx`, `app/profile/page.tsx` — placeholder route files wired to the shell.
- `components/ui/` — `Button`, `IconButton`, `Card`, `Input`, `TextField`, `Badge`, `Chip`, `Avatar`, `Sheet`, `Modal`, `Skeleton`, `EmptyState`.
- `components/layout/` — `TopBar`, `BottomNav`, `Container`, `SafeArea`, `Section`.
- `components/typography/` — `Display`, `Heading`, `Body`, `Caption`, `Overline` helpers wrapping Tailwind text classes.
- `lib/cn.ts` — `clsx` + `tailwind-merge` helper.
- `lib/liff/` — refactor `providers/liff-providers.tsx` into `LiffProvider` + `useLiff` + `lib/liff/client.ts` (singleton init).
- `lib/icons.ts` — barrel re-export of Lucide icons used by the app, so swaps are centralized.
- `docs/plans/mvp/components.md` — quick storybook-style index of every primitive with usage snippet (no Storybook yet).

## Out of scope
- Real data, real auth identity verification, persistence — Phase 2.
- Any class/booking/promotion UI — Phases 3–4.

## Dependencies
- `lucide-react`, `clsx`, `tailwind-merge`, `motion` (for later animation), `@line/liff` (already installed).

## Verification
- `pnpm build` passes.
- Manual: open LIFF URL on iOS Safari simulator + Android Chrome → no `window is not defined`, no tap-flash, safe areas respected.
