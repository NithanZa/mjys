# PHASE 5: Testing & Rollout

## Goals
- Verify the banner CRUD flow end-to-end, including image upload/crop/delete, before considering the feature done.
- Confirm the home page renders migrated + newly added banners correctly, both internal and external links.

## Acceptance Criteria
- [ ] AC1: Manual smoke test — after migration, `/` shows the same two "Promotion" and "Contact Us" cards as before, now sourced from the `HomeBanner` table via `/api/home-banners`.
- [ ] AC2: Manual smoke test — add a new banner via `/admin/banners` with an uploaded image (verify the 3:2 crop step works with a non-3:2 source image) and an internal href (e.g. `/about`); confirm it appears on `/` in the correct `sortOrder` position and navigates correctly on tap.
- [ ] AC3: Manual smoke test — add a banner with an external `https://` href; confirm it opens in a new tab from the home page and does not break the `next/link` routing of other cards.
- [ ] AC4: Manual smoke test — edit a banner's image (replace it); confirm the old file is removed from the `banners` Supabase bucket (check via Supabase Dashboard) and the new image renders on `/`.
- [ ] AC5: Manual smoke test — toggle a banner to inactive; confirm it disappears from `/` immediately (or on next load) but still appears in the `/admin/banners` list for re-activation.
- [ ] AC6: Manual smoke test — delete a banner; confirm it's removed from both `/admin/banners` and `/`, and its image is removed from the `banners` bucket.
- [ ] AC7: Confirm `verifyAdmin` blocks all `/api/admin/home-banners*` routes when the admin session cookie is missing/invalid (expect `401`), while `GET /api/home-banners` remains publicly accessible without auth.
- [ ] AC8: Confirm reordering two banners' `sortOrder` values correctly swaps their display order on `/`.

## Rollout Notes
- Requires `prisma migrate deploy` (or equivalent) in each environment to create the `HomeBanner` table before the admin UI or home page changes are deployed.
- Requires the `banners` Supabase bucket to exist and be public in each environment (already done in the user's current project — confirm for any other environments, e.g. staging/production, before deploying).
- Update this checklist by ticking boxes as each item is verified during implementation review.
