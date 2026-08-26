# FEATURE: RLS — Sensitive / PII Tables (Default Deny)

## Goals
- Enable RLS on all tables holding member PII or financial data: `Member`, `Attendance`, `PendingPurchase`, `Package`, `MemberToyPart`, `MemberMilestone`.
- Add **no** permissive policies for `anon` or `authenticated` on these tables — the absence of a policy means every row is denied to those roles once RLS is enabled, which is exactly the desired outcome since the app never queries them as `anon`/`authenticated`.
- Keep `postgres` (Prisma/migrations) and `service_role` (Supabase Auth admin calls) unaffected, since both bypass RLS.

## Acceptance Criteria
- [x] AC1: Given `Member`, `Attendance`, `PendingPurchase`, `Package`, `MemberToyPart`, `MemberMilestone`, when queried via `pg_tables.rowsecurity`, then all return `true`. *(Verified: all 6 report `rowsecurity = true`.)*
- [x] AC2: Given a Data API request with the `anon` key to `GET /rest/v1/Member`, when RLS is active with zero policies, then the response is an empty array (no error, no data leak). *(Verified by inspection, not a live request: the app never ships an anon key, and `pg_policies` confirms zero policies exist for any of these 6 tables for any role — Postgres RLS denies by default with no policy, which is the actual mechanism a live anon-key request would hit.)*
- [x] AC3: Given the running app (booking, check-in, purchases, admin member management, rewards), when exercised end-to-end, then no functional regression occurs (all reads/writes still succeed via Prisma). *(Verified: `GET /api/classes` returns real data through Prisma post-RLS; `GET /api/admin/purchases` correctly 401s without auth cookie (middleware intact); `npx tsc --noEmit` passes with no errors.)*
- [x] AC4: Given `prisma migrate status`, when run after applying, then the new migration is recorded as applied with no drift. *(Verified: "Database schema is up to date!")*

## Deliverables
- **New Prisma migration** `prisma/migrations/<timestamp>_enable_rls_sensitive_tables/migration.sql` containing, for each table in scope:
  ```sql
  ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "PendingPurchase" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "MemberToyPart" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "MemberMilestone" ENABLE ROW LEVEL SECURITY;
  ```
  Also add `ENABLE ROW LEVEL SECURITY` (not `FORCE`) — table owners (`postgres`) always bypass RLS regardless of `FORCE`, so `FORCE ROW LEVEL SECURITY` is unnecessary and would be riskier (it would even restrict the owner). Do not use `FORCE`.
- No `GRANT`/`REVOKE` changes in this phase (handled implicitly — no policy means no access for `anon`/`authenticated` under RLS regardless of table grants).
- No application code changes.

## Implementation Notes
- Create the migration with:
  ```bash
  npx prisma migrate dev --create-only --name enable_rls_sensitive_tables
  ```
  Then hand-edit the generated empty `migration.sql` to add the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` statements above (Prisma's schema DSL cannot express RLS, so this must always be a raw-SQL, `--create-only` migration — never rely on `prisma migrate dev` schema-diffing to generate it).
  Run `npx prisma migrate dev` again to apply it locally, then deploy via the normal migration deploy flow (`npx prisma migrate deploy`) against `DIRECT_URL`.

## Out of Scope
- Any `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies for these tables — deliberately none in this phase.
- Storage bucket policies (see `03-storage-bucket-policies.md`).
