# PHASE 1: Storage Config & Data Model

## Goals
- Wire up the (already-created) `banners` Supabase Storage bucket in `lib/storage.ts`.
- Add a `HomeBanner` Prisma model to persist the list of admin-managed banner cards, and generate/apply the migration.

## Acceptance Criteria
- [ ] AC1: The `banners` bucket is confirmed **public** in the Supabase Dashboard (user has already created it — verify public visibility is on; document as a manual check since it isn't automatable from the codebase).
- [ ] AC2: `lib/storage.ts` exports a `BANNER_BUCKET = "banners"` constant, a `getBannerPublicUrl(path: string): string` helper (mirrors `getAvatarPublicUrl`), and an `extractBannerPath(url: string): string` helper (mirrors `extractSlipPath`) that pulls the bare object path out of a full public URL so the old file can be targeted for deletion on replace.
- [ ] AC3: `prisma/schema.prisma` gains a new `HomeBanner` model:
  ```prisma
  model HomeBanner {
    id        String   @id @default(cuid())
    title     String
    eyebrow   String?
    imageUrl  String
    href      String
    sortOrder Int      @default(0)
    isActive  Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([sortOrder])
  }
  ```
- [ ] AC4: A Prisma migration is generated and applied (`prisma migrate dev`) creating the `HomeBanner` table, and `generated/prisma` client output is regenerated.
- [ ] AC5: `next.config.ts`'s `images.remotePatterns` already covers `**.supabase.co` (added for avatars) — confirm it also satisfies URLs from the `banners` bucket, since both buckets live under the same Supabase project hostname. No change expected, but verify.

## Deliverables
- **`lib/storage.ts`**: add
  ```ts
  export const BANNER_BUCKET = "banners";

  export function getBannerPublicUrl(path: string): string {
      const { data } = supabase.storage.from(BANNER_BUCKET).getPublicUrl(path);
      return data.publicUrl;
  }

  export function extractBannerPath(imageUrl: string): string {
      const marker = "/banners/";
      const idx = imageUrl.indexOf(marker);
      if (idx === -1) return imageUrl;
      return imageUrl.slice(idx + marker.length);
  }
  ```
- **`prisma/schema.prisma`**: new `HomeBanner` model as above, placed near `HomeContent` under the "Phase 4 — CMS" section comment.
- New migration folder under `prisma/migrations/` (auto-named by `prisma migrate dev --name add_home_banner`).

## Manual Step (User Action Required)
> Already done by the user, but verify before building on top of it:
1. Confirm the `banners` bucket in the Supabase Dashboard is set to **Public bucket**.
2. (Optional) Restrict allowed MIME types to images and set a reasonable file size limit (e.g. 5 MB), matching the `avatars` bucket convention.

## Out of Scope
- Automating bucket creation/policy changes via script — Supabase Storage buckets are managed via Dashboard/CLI, not this codebase (same convention as `avatars` and `slips`).
