# FEATURE: Admin Staff Directory

## Goals
- Give studio admins a dedicated page to manage instructor/staff profiles (create, edit, delete) instead of editing the database directly.
- Support uploading/setting an avatar photo per staff member, stored in a new public Supabase Storage bucket named `avatars`.
- Reuse the existing `Instructor` Prisma model — this is the same entity already powering the public `/about` page (`InstructorGrid`) and `/instructors/[slug]` detail pages — so no data duplication or migration is required.

## Background
- `Instructor` (`prisma/schema.prisma`) already has: `id`, `slug`, `name`, `title`, `bio`, `photoUrl`, `initials`, `order`.
- Public read access exists via `GET /api/instructors` (`app/api/instructors/route.ts`) and is consumed by `lib/api/instructors.ts`.
- There is currently **no admin CRUD** for instructors — they can only be seeded (`prisma/seed.ts`) or edited directly in the DB. This plan adds that missing admin surface.
- Admin auth pattern: every admin API route calls `verifyAdmin(request)` from `lib/admin-auth.ts` and returns early on failure.
- Admin UI pattern: client component pages under `app/(admin)/admin/<section>/page.tsx` using `components/ui` primitives (`Button`, `Card`, `Sheet`, `Modal`, `Input`, `Badge`), following `app/(admin)/admin/members/page.tsx` as the closest reference (search + list + details sheet + delete confirmation modal).
- File upload pattern: `app/api/upload/route.ts` shows validation (type/size) + `supabase.storage.from(bucket).upload(...)`, but it's LINE-member-token authed and targets the private `slips` bucket. Staff avatars need a **new admin-authed upload route** targeting a **public** `avatars` bucket (photos are shown on public marketing pages, so no signed URLs needed — just `getPublicUrl`).

## Phases
1. `01-storage-setup.md` — Supabase `avatars` bucket (manual step for the user) + `lib/storage.ts` helper additions.
2. `02-backend-api.md` — Admin CRUD API routes for staff + avatar upload endpoint.
3. `03-admin-ui.md` — `/admin/staff` page (list, add/edit sheet, delete) + sidebar nav entry.
4. `04-testing-rollout.md` — Manual verification checklist and rollout notes.

## Out of Scope
- Changing the public `/about` or `/instructors/[slug]` pages (they already render whatever `Instructor` rows exist).
- Instructor scheduling logic (already covered by `03-calendar-management.md` in `docs/plans/admin-dashboard/`).
- Role-based staff accounts / login for instructors — "staff directory" here means the public-facing instructor roster, managed by admins.
