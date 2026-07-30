# PHASE 2: Backend API — Staff CRUD & Avatar Upload

## Goals
- Provide admin-authenticated REST endpoints to list, create, update, and delete `Instructor` (staff) records.
- Provide an admin-authenticated endpoint to upload an avatar image to the `avatars` bucket and return its public URL.

## Acceptance Criteria
- [ ] AC1: All new routes call `verifyAdmin(request)` from `lib/admin-auth.ts` first and return its `NextResponse` immediately if it is non-null (matches every existing `app/api/admin/**` route).
- [ ] AC2: `GET /api/admin/staff` returns all instructors ordered by `order` ascending, including a computed count of upcoming `ClassOccurrence`s (nice-to-have, not blocking) so admins see who's actively scheduled.
- [ ] AC3: `POST /api/admin/staff` creates a new `Instructor`. Required: `name`, `title`, `bio`, `initials`. Optional: `photoUrl`, `order` (defaults to `max(order) + 1` if omitted). `slug` is auto-generated from `name` (kebab-case) if not provided, with a uniqueness check/suffix.
- [ ] AC4: `PATCH /api/admin/staff/[id]` updates any subset of `name`, `title`, `bio`, `photoUrl`, `initials`, `order`, `slug`.
- [ ] AC5: `DELETE /api/admin/staff/[id]` deletes the instructor. If the instructor has existing `ClassOccurrence`s (relation is `onDelete: Cascade` on `ClassOccurrence.instructor`), require a confirmation query param `?confirm=true` and return a `409` with the occurrence count if not confirmed, so admins don't accidentally wipe class history.
- [ ] AC6: `POST /api/admin/staff/upload-avatar` accepts `multipart/form-data` (field `file`), validates type (`jpeg`/`png`/`webp`) and size (max 5 MB, matching `app/api/upload/route.ts` conventions), uploads to the `avatars` bucket under a unique filename (`avatar_<timestamp>_<random>.<ext>`), and returns `{ url: string }` using `getAvatarPublicUrl` from `lib/storage.ts`.

## Deliverables
- **`app/api/admin/staff/route.ts`**: `GET` (list) + `POST` (create).
- **`app/api/admin/staff/[id]/route.ts`**: `PATCH` (update) + `DELETE` (delete, with cascade-confirmation guard).
- **`app/api/admin/staff/upload-avatar/route.ts`**: `POST` (image upload to `avatars` bucket, admin-authed — distinct from the member-authed `app/api/upload/route.ts`).
- **`lib/storage.ts`**: extended per `01-storage-setup.md`.

## Notes
- Slug generation: lowercase, spaces/non-alphanumerics → `-`, collapse repeats, trim; append `-2`, `-3`, etc. on collision (checked against `prisma.instructor.findUnique({ where: { slug } })`).
- Reuse the `supabase` client from `lib/supabase.ts` (service-role key) for storage uploads — same as `app/api/upload/route.ts`.

## Out of Scope
- Bulk import/export (CSV) for staff — only the calendar/classes import exists today (`app/api/admin/classes/import/csv/route.ts`); can be added later if needed.
