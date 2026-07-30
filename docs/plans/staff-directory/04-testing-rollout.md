# PHASE 4: Testing & Rollout

## Goals
- Verify the staff directory CRUD flow end-to-end before considering the feature done.
- Confirm public pages (`/about`, `/instructors/[slug]`) still render correctly after admin edits.

## Acceptance Criteria
- [ ] AC1: Manual smoke test — create a staff member with an uploaded avatar via `/admin/staff`, confirm it appears correctly on `/about` (`InstructorGrid`) and its own `/instructors/[slug]` page.
- [ ] AC2: Manual smoke test — edit an existing staff member's name/title/bio/order/avatar, confirm changes reflect on public pages immediately (no caching issues — check if `/about` or `/api/instructors` uses `fetch` caching that needs `revalidate`/`cache: "no-store"`).
- [ ] AC3: Manual smoke test — attempt to delete a staff member who has scheduled `ClassOccurrence`s, confirm the `409` warning appears, then confirm "Delete Anyway" removes them and cascades their occurrences (verify against `app/(admin)/admin/calendar/page.tsx` that the deleted instructor's classes are gone).
- [ ] AC4: Manual smoke test — delete a staff member with no scheduled classes, confirm immediate removal with no warning.
- [ ] AC5: Confirm avatar re-upload does not leave orphaned files accumulating unbounded in the `avatars` bucket for the same staff member (either overwrite old file on edit, or accept minor storage growth as a known tradeoff — decide during implementation and document the choice here).
- [ ] AC6: Confirm `verifyAdmin` blocks all new `/api/admin/staff*` routes when the admin session cookie is missing/invalid (test via an unauthenticated `curl`/Postman request expecting `401`).

## Rollout Notes
- No `prisma migrate` is required for this feature (no schema changes) — only the Supabase `avatars` bucket (manual, see `01-storage-setup.md`) and `next.config.ts` remote pattern need to be applied to each environment (local `.env`/dev, and production) before avatars will render.
- Update this checklist by ticking boxes as each item is verified during implementation review.
