# FEATURE: Editable Home Banner Cards

## Goals
- Let studio admins add/edit/remove the standardised image banner cards shown on the home page (the `TigerPromoCard` style — full-bleed 3:2 image, eyebrow, title, tap-through link) without touching code.
- Store banner images in the new Supabase Storage bucket `banners` (already created by the user), uploaded directly through the admin dashboard.
- Support both internal app paths (e.g. `/contact`, `/book/occ_2026-06-28_0`) and external `https://` links.
- Give admins control over display order and an active/inactive toggle per banner.

## Background
- The home page (`app/(shell)/page.tsx`) currently renders two **hardcoded** `TigerPromoCard`s (`components/home/TigerPromoCard.tsx`): "Promotion" → `/promotion` and "Contact Us" → `/contact`.
- `TigerPromoCard` is already the exact "standardised card with image banner" shape referenced in the request: 3:2 image (`aspect-[3/2]`, `object-contain`), optional `eyebrow` caption, `title`, and a `href` wrapping the whole card in a `next/link`.
- There's a pre-existing but unrelated singleton `HomeContent` model (`prisma/schema.prisma`) with a single `bannerImageUrl`/`bannerHref` pair — that model is for the hero/quote/pose-of-the-week content and is **not** reused here; this feature needs a **list** of banners, not a singleton.
- Closest existing precedent for this whole feature (schema + storage + admin CRUD + image upload) is the Staff Directory (`docs/plans/staff-directory/`): `Instructor.photoUrl` stored as a full public URL from the public `avatars` bucket, uploaded via an admin-authed multipart endpoint, managed in `app/(admin)/admin/staff/page.tsx`. This plan follows the same shape.
- Admin auth pattern: every `app/api/admin/**` route calls `verifyAdmin(request)` from `lib/admin-auth.ts` first.
- Admin UI pattern: client component pages under `app/(admin)/admin/<section>/page.tsx` using `components/ui` primitives (`Button`, `Card`, `Sheet`, `Modal`, `Input`, `Badge`).

## Decisions (from clarifying questions)
1. **Migration strategy**: Replace the two hardcoded `TigerPromoCard`s on the home page with a dynamic list rendered from the new table, and seed that table with the current "Promotion" (`/promotion`) and "Contact Us" (`/contact`) entries so the home page looks unchanged immediately after migration.
2. **Ordering & visibility**: Each banner has a numeric `sortOrder` (admin-controlled) and an `isActive` boolean toggle so admins can hide a banner without deleting it.
3. **Link targets**: The `href` field accepts both internal paths (`/contact`) and external `https://` URLs. Internal links render as `next/link`; external links render as `<a target="_blank" rel="noopener noreferrer">`.
4. **Storage**: The `banners` Supabase bucket is **public**. The DB stores the resolved public URL directly (same pattern as `Instructor.photoUrl`), and images are uploaded through the admin dashboard via a dedicated multipart endpoint.
5. **Image lifecycle & aspect ratio**: Replacing a banner's image deletes the old file from the `banners` bucket. The admin upload UI center-crops the selected image to a 3:2 ratio client-side (via `<canvas>`) before upload, matching `TigerPromoCard`'s `aspect-[3/2]` display area.

## Phases
1. `01-storage-schema.md` — Supabase `banners` bucket config + `lib/storage.ts` helpers + new `HomeBanner` Prisma model & migration.
2. `02-backend-api.md` — Admin CRUD API routes for banners + image upload/delete endpoint.
3. `03-admin-ui.md` — `/admin/banners` page (list, add/edit sheet with cropped upload, delete) + sidebar nav entry.
4. `04-home-integration.md` — Public home page renders banners dynamically from `GET /api/home-banners`; seed script/migration for the two existing entries; `TigerPromoCard` gains external-link support.
5. `05-testing-rollout.md` — Manual verification checklist and rollout notes.

## Out of Scope
- Editing the unrelated singleton `HomeContent` hero/quote/pose fields (`bannerImageUrl`/`bannerHref` on that model are left as-is, unused by this feature going forward).
- Drag-and-drop reordering UI — `sortOrder` is a plain numeric field for v1 (consistent with how `Instructor.order` works today).
- Analytics/click-tracking on banners.
- Scheduling banners to auto-activate/deactivate on a date range.
