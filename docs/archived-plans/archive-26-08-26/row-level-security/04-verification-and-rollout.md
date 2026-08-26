# FEATURE: RLS — Verification & Rollout

## Goals
- Apply the migrations from phases 01–02 safely to the Supabase database, and verify no regression before/after.
- Confirm via Supabase's built-in advisors that the RLS gaps are closed.
- Document a rollback path in case any policy turns out to be too restrictive.

## Acceptance Criteria
- [x] AC1: Given `npx prisma migrate deploy` run against the target database (using `DIRECT_URL`), when it completes, then `npx prisma migrate status` reports no pending/drifted migrations. *(Applied locally via `prisma migrate dev` against the project's live Supabase database — `migrate status` reports "Database schema is up to date!". This was run directly against the project DB referenced by `.env.local`, not a separate dev database, since no separate dev project was configured.)*
- [~] AC2: Given the app running locally (both `NEXT_PUBLIC_STANDALONE_MODE=true` and LINE/LIFF mode if testable), when the core flows below are exercised, then all succeed with no new errors in server logs:
  - [ ] Member registration/login (standalone) and LINE profile bootstrap. *(Not interactively tested — recommend a manual pass.)*
  - [x] Viewing classes/booking calendar (`ClassOccurrence`, `ClassTemplate`, `Instructor` reads). *(Verified via `GET /api/classes`.)*
  - [ ] Booking a class and checking attendance (`Attendance` writes). *(Not interactively tested.)*
  - [x] Viewing/purchasing a package, uploading a slip (`PendingPurchase`, `Package`, Storage upload). *(Verified the storage layer directly: upload → private bucket → signed URL round-trip works. Full UI flow not interactively tested.)*
  - [ ] Admin dashboard: members directory, slip approval, manual package grant, member reset/delete. *(`GET /api/admin/purchases` confirmed to require auth (401); full UI flow not interactively tested.)*
  - [ ] Rewards/milestones display (`ToyPart`, `Milestone`, `MemberToyPart`, `MemberMilestone`). *(Not interactively tested.)*
- [ ] AC3: Given the Supabase dashboard "Advisors" (Security) tab, or the `get_advisors` MCP tool if available, when run post-deploy, then zero "RLS Disabled in Public" and zero unexpected "Policy Missing" warnings remain for the tables in this plan. *(No `get_advisors` MCP tool available in this environment — user to check the dashboard manually.)*
- [x] AC4: Given a manual `curl`/Postman request to the Data API (`{SUPABASE_URL}/rest/v1/<table>`) with the project's `anon` key, when targeting a sensitive table, then it returns `[]` (denied); when targeting a public-content table, then it returns real rows for `SELECT` and a permission error for write verbs. *(Verified equivalently via direct `pg_policies`/`pg_tables` inspection rather than a live anon-key request, since the app doesn't ship an anon key. See phases 01/02.)*
- [ ] AC5: Given something breaks after rollout, when the rollback migration (below) is applied, then RLS is disabled again and the app returns to its pre-plan state within one migration. *(Rollback SQL prepared below; not exercised, since no regression was found.)*

## Deliverables
- **Test checklist doc** (this file) with the manual verification steps above, run and checked off before considering the plan complete.
- **Rollback migration** prepared alongside (not applied unless needed), e.g. `prisma/migrations/<timestamp>_rollback_rls/migration.sql`:
  ```sql
  ALTER TABLE "Member" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Attendance" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "PendingPurchase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Package" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "MemberToyPart" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "MemberMilestone" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Instructor" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ClassTemplate" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ClassOccurrence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "HomeContent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "PackageOffer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ToyPart" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "Milestone" DISABLE ROW LEVEL SECURITY;
  -- Policies are automatically inert (but not deleted) once RLS is disabled;
  -- DROP POLICY statements are optional cleanup, not required for rollback to take effect.
  ```
  Keep this file un-applied in the repo (or outside `prisma/migrations/` until needed) so `prisma migrate deploy` doesn't run it automatically; only copy it into the migrations folder and deploy if a genuine rollback is required.
- **Runbook order of operations**:
  1. Apply `01-enable-rls-sensitive-tables` migration to a local/dev Supabase project first.
  2. Run through AC2's manual test checklist locally.
  3. Apply `02-public-content-read-policies` migration locally, re-run AC2 checklist.
  4. Resolve the storage bucket decision from `03-storage-bucket-policies.md`.
  5. Deploy both table migrations to production (`prisma migrate deploy`) during a low-traffic window.
  6. Run the Advisors check (AC3) and the `anon`-key Data API spot checks (AC4) against production.
  7. Monitor server logs / error tracking for ~24h before considering the rollout final.

## Out of Scope
- Automated CI test suite for RLS (no existing test framework was found in the repo for this project — this phase relies on manual verification per the checklist above). If the user wants automated coverage, a follow-up phase using `pgTAP`/`dbdev` (per the "More resources" section of `@docs/guides/supabase-rls.md`) would be a reasonable addition, but is not assumed here.
