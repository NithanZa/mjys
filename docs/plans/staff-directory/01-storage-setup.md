# PHASE 1: Avatar Storage Setup

## Goals
- Provision a public Supabase Storage bucket for staff avatar images.
- Add a small helper in `lib/storage.ts` to keep avatar path/URL handling consistent with the existing `slips` bucket helpers.

## Acceptance Criteria
- [ ] AC1: A Supabase Storage bucket named `avatars` exists and is configured **public** (so `photoUrl` can be rendered directly on `/about` and `/instructors/[slug]` without signed URLs).
- [ ] AC2: `lib/storage.ts` exports an `AVATAR_BUCKET` constant and a `getAvatarPublicUrl(path: string): string` helper that wraps `supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl`.
- [ ] AC3: `Instructor.photoUrl` continues to store a full URL (as it does today) so existing seed data and public pages keep working unchanged — new uploads store the resolved public URL directly (not a bare object path), avoiding any need to touch `InstructorGrid.tsx` or the instructor detail page.
- [ ] AC4: `next.config.ts`'s `images.remotePatterns` includes the Supabase Storage hostname so `next/image` (used by `components/ui/Avatar.tsx`) can render uploaded avatar URLs without runtime errors.

## Manual Step (User Action Required)
> This cannot be automated from the codebase — it must be done once in the Supabase Dashboard (or via the Supabase CLI) by the project owner:
1. Go to **Storage** in the Supabase Dashboard for this project.
2. Create a new bucket named exactly `avatars`.
3. Set it to **Public bucket**.
4. (Optional) Restrict allowed MIME types to images and set a reasonable file size limit (e.g. 5 MB) in the bucket settings.

## Deliverables
- **`lib/storage.ts`**: add alongside the existing `SLIP_BUCKET` exports:
  ```ts
  export const AVATAR_BUCKET = "avatars";

  export function getAvatarPublicUrl(path: string): string {
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      return data.publicUrl;
  }
  ```
- **`next.config.ts`**: all seeded `Instructor.photoUrl` values are currently `null` (see `prisma/seed.ts`), so `next/image` has never needed to load a remote image for staff avatars — `images.remotePatterns` is not yet configured. Add the Supabase project's storage hostname (`<project-ref>.supabase.co`) to `images.remotePatterns` so `components/ui/Avatar.tsx` (which uses `next/image`) can render uploaded avatar URLs on both the admin UI and the public `/about` / `/instructors/[slug]` pages. Without this, `next/image` will throw a runtime error for any non-null `photoUrl`.

## Out of Scope
- Automating bucket creation via a script/migration (Supabase Storage buckets are not part of `prisma/schema.prisma` and are managed via the Supabase Dashboard/CLI, not this codebase).
