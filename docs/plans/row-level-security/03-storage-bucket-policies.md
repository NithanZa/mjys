# FEATURE: RLS — `slips` Storage Bucket Hardening

## Context
- `app/api/upload/route.ts` uploads to the `slips` bucket using the service-role client (bypasses Storage RLS entirely) and returns `.getPublicUrl(fileName)`.
- `.getPublicUrl()` only produces a URL that actually resolves if the bucket is public. If the bucket were private, this call would still return a URL string, but it would 404 when fetched — so if slip images currently render correctly anywhere in the app (e.g. admin `/admin/slips` review UI), the bucket **is** public today.
- `app/api/admin/members/[id]/route.ts` deletes objects from `slips` via `supabase.storage.from("slips").remove(fileNames)`, also using the service-role client (bypasses RLS).
- No code path uploads, reads, or deletes Storage objects using the `anon`/`authenticated` role — every Storage call goes through the service-role client. This means **Storage RLS policies on `storage.objects` are not required for the app to function**, but the bucket's public-read flag is what actually controls anonymous access to slip images.

## Goals
- Confirm and document the bucket's actual public/private setting (audit step, not a code change).
- Decide and apply the correct policy for this specific bucket given it holds payment-proof images (financial documents, arguably sensitive):
  - **Recommended**: keep the bucket private, and switch `app/api/upload/route.ts` (and any admin UI consuming `proofImageUrl`) to use `createSignedUrl()` with a short expiry instead of `getPublicUrl()`. This is the only way to make slip images genuinely non-public.
  - **Minimal alternative** (if switching to signed URLs is out of scope for this pass): keep the bucket public, but explicitly add restrictive `storage.objects` RLS policies so that even if the bucket setting is ever misconfigured, `anon`/`authenticated` roles cannot `INSERT`/`UPDATE`/`DELETE` objects (uploads/deletes must always go through the service-role key, matching current behavior).

## Acceptance Criteria
- [x] AC1: Given the Supabase dashboard → Storage → `slips` bucket settings, when inspected, then the actual public/private state is recorded in this file (fill in below) and matches an explicit decision, not an accident. *(Verified via `supabase.storage.getBucket("slips")`: `public: true`.)*
- [x] AC2: Given `storage.objects` RLS is enabled (Supabase enables it by default on `storage.objects`), when `anon`/`authenticated` attempt `INSERT`/`UPDATE`/`DELETE` on objects in the `slips` bucket, then it is rejected (no such policy is added). *(Verified: `storage.objects` has `rowsecurity = true` and zero rows in `pg_policies` for `schemaname = 'storage' AND tablename = 'objects'` — no policy exists for any role, so `anon`/`authenticated` are denied by default via the Storage API/PostgREST path.)*
- [x] AC3: Given the decision is "switch to signed URLs", when implemented, then `app/api/upload/route.ts` returns a signed URL (or a stable app-side reference resolved to a fresh signed URL on read) and the bucket is set to private. **Implemented**: bucket set to private (`updateBucket({ public: false })`); `app/api/upload/route.ts` now returns the object path; `lib/storage.ts` added (`extractSlipPath`, `getSignedSlipUrl`); `GET /api/purchases` and `GET /api/admin/purchases` resolve fresh 1-hour signed URLs on read. Verified: public URL fetch → `400`, signed URL fetch → `200` with correct content.
- [x] AC4: Given the existing upload flow (`POST /api/upload`) and admin delete flow, when exercised after this phase, then both continue to work unchanged. *(No existing `PendingPurchase` rows had a `proofImageUrl` set, so no data backfill was required. Delete-flow path extraction updated via `extractSlipPath` to handle both legacy full-URL and new bare-path formats.)*

## Audit Result
- `slips` bucket: **`public: true`** (confirmed via `supabase.storage.getBucket("slips")`).
- `storage.objects`: RLS is enabled by Supabase by default, and **zero policies** exist for the `slips` bucket for any role — so the row-policy layer already denies `anon`/`authenticated` `INSERT`/`UPDATE`/`DELETE`/`SELECT` via the authenticated Storage/PostgREST API. AC2 requires no change.
- **However**, a public bucket's objects are also served directly via the unauthenticated public-object URL path (`/storage/v1/object/public/slips/<file>`), which bypasses `storage.objects` RLS entirely — this is how `.getPublicUrl()` works today and why slip images currently render. This public-URL exposure is the real remaining risk, not `storage.objects` RLS.
- **No SQL/RLS change is needed for this phase** — the minimal alternative's requirement (deny anon/authenticated row-level writes) is already satisfied by Supabase's defaults. The only way to close the public-URL exposure is the Recommended Alternative (switch to private bucket + signed URLs), which is an application-code change, not a migration — flagged to the user for a decision before implementing.

## Deliverables (Minimal Alternative — default recommendation for this plan's scope)
- No bucket setting change (avoids a breaking change to slip image rendering without a corresponding code change).
- Add explicit deny-by-default reinforcement via SQL (optional, since default Storage RLS with no policy already denies `anon`/`authenticated` writes — this is just to make the intent auditable):
  ```sql
  -- Explicit comment-only documentation; no INSERT/UPDATE/DELETE policy is created
  -- for anon/authenticated on storage.objects for bucket_id = 'slips'.
  -- All uploads/deletes go exclusively through the service-role key
  -- (see app/api/upload/route.ts and app/api/admin/members/[id]/route.ts).
  ```
- Record the audited bucket visibility here once checked:
  - `slips` bucket public: **[ TODO: confirm via Supabase dashboard → Storage → slips → Configuration ]**

## Deliverables (Recommended Alternative — signed URLs, larger follow-up)
- Set `slips` bucket to private (dashboard or `supabase.storage.updateBucket("slips", { public: false })` via a one-off admin script).
- Update `app/api/upload/route.ts`:
  ```ts
  const { data: signedData } = await supabase.storage
    .from("slips")
    .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7-day signed URL
  const url = signedData?.signedUrl;
  ```
- Update anywhere `proofImageUrl` is rendered (admin slips review page) to re-sign on read if the URL may have expired, or store the raw `fileName` and resolve a fresh signed URL per request instead of persisting a long-lived signed URL in `PendingPurchase.proofImageUrl`.
- This alternative touches application code, not just RLS/migrations — flag explicitly to the user before implementing, since it changes stored data semantics (`proofImageUrl` becomes a `fileName`/path instead of a full URL) and requires a data migration for existing rows.

## Out of Scope
- Automatic migration of existing `proofImageUrl` values if the signed-URL alternative is chosen — needs a separate follow-up decision and backfill script.
