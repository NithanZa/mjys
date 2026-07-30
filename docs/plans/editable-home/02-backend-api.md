# PHASE 2: Backend API — Banner CRUD & Image Upload

## Goals
- Admin-authenticated REST endpoints to list, create, update, and delete `HomeBanner` records.
- Admin-authenticated endpoint to upload a (pre-cropped) banner image to the `banners` bucket and return its public URL, plus delete the old image on replace.
- A public read endpoint so the home page can render only active banners in order.

## Acceptance Criteria
- [ ] AC1: All `/api/admin/**` routes call `verifyAdmin(request)` from `lib/admin-auth.ts` first and return its `NextResponse` immediately if non-null.
- [ ] AC2: `GET /api/admin/home-banners` returns **all** banners (active + inactive) ordered by `sortOrder` ascending, for the admin list view.
- [ ] AC3: `POST /api/admin/home-banners` creates a `HomeBanner`. Required: `title`, `imageUrl`, `href`. Optional: `eyebrow`, `sortOrder` (defaults to `max(sortOrder) + 1` if omitted), `isActive` (defaults `true`).
- [ ] AC4: `PATCH /api/admin/home-banners/[id]` updates any subset of `title`, `eyebrow`, `imageUrl`, `href`, `sortOrder`, `isActive`. If `imageUrl` changes and the previous `imageUrl` pointed into the `banners` bucket, delete the old object via `supabase.storage.from(BANNER_BUCKET).remove([extractBannerPath(oldUrl)])` (best-effort — log and continue on failure, don't fail the request).
- [ ] AC5: `DELETE /api/admin/home-banners/[id]` deletes the `HomeBanner` row and best-effort deletes its image from the `banners` bucket via `extractBannerPath` + `.remove(...)`.
- [ ] AC6: `POST /api/admin/home-banners/upload` accepts `multipart/form-data` (field `file`), validates type (`jpeg`/`png`/`webp`) and size (max 5 MB, matching `app/api/admin/staff/upload-avatar/route.ts` conventions), uploads to the `banners` bucket under a unique filename (`banner_<timestamp>_<random>.<ext>`), and returns `{ url: string }` via `getBannerPublicUrl` from `lib/storage.ts`. The client is expected to have already center-cropped the image to 3:2 before sending it (see `03-admin-ui.md`); this endpoint does not re-validate aspect ratio server-side.
- [ ] AC7: `GET /api/home-banners` (public, no auth) returns only `isActive: true` banners ordered by `sortOrder` ascending — consumed by the home page. Marked `export const dynamic = "force-dynamic"` (or a short `revalidate`) so admin edits show up promptly, matching the no-caching convention used by other admin-editable public endpoints (e.g. `/api/instructors`).

## Deliverables
- **`app/api/admin/home-banners/route.ts`**: `GET` (list all) + `POST` (create).
- **`app/api/admin/home-banners/[id]/route.ts`**: `PATCH` (update, with old-image cleanup) + `DELETE` (delete, with image cleanup).
- **`app/api/admin/home-banners/upload/route.ts`**: `POST` (image upload to `banners` bucket, admin-authed).
- **`app/api/home-banners/route.ts`**: `GET` (public, active banners only) — used by `lib/api/` consumer added in Phase 4.
- **`lib/storage.ts`**: extended per `01-storage-schema.md`.

## Notes
- Reuse the `supabase` service-role client from `lib/supabase.ts` for storage operations — same as every other upload route.
- Href validation: accept any non-empty string; no server-side allowlist (per the "internal + external URLs" decision) — just trim whitespace. Client-side UI nudges toward valid formats (see Phase 3).
- Follow `app/api/admin/staff/[id]/route.ts`'s pattern of building a partial `data: Record<string, unknown>` object for `PATCH` (only include fields present in the request body).

## Out of Scope
- Bulk import/export for banners.
- Rate limiting / CSRF beyond the existing `verifyAdmin` cookie-session check.
