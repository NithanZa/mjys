# FEATURE: RLS — Public Content Tables (Scoped Read Policies)

## Goals
- Enable RLS on the public-facing content/catalog tables: `Instructor`, `ClassTemplate`, `ClassOccurrence`, `HomeContent`, `PackageOffer`, `ToyPart`, `Milestone`.
- Add explicit `SELECT` policies for `anon` and `authenticated` so these tables remain safely readable in principle via the Data API (matching what is already publicly rendered on `/classes`, `/promotion`, `/rewards`, and the home page), per the "Add filters to every query" / "Specify roles in your policies" guidance in `@docs/guides/supabase-rls.md`.
- Explicitly do **not** add `INSERT`/`UPDATE`/`DELETE` policies — all writes to these tables happen exclusively through admin API routes using Prisma (`postgres` role, bypasses RLS), so no write policy is needed or wanted for `anon`/`authenticated`.

## Acceptance Criteria
- [x] AC1: Given each table in scope, when `rowsecurity` is checked, then it is `true`. *(Verified: all 7 report `rowsecurity = true`.)*
- [x] AC2: Given a Data API `SELECT` request with the `anon` key against `Instructor`, `ClassTemplate`, `ClassOccurrence`, `HomeContent`, `PackageOffer`, `ToyPart`, or `Milestone`, then rows are returned successfully. *(Verified by inspection: `pg_policies` shows exactly one `SELECT` policy scoped to `{anon,authenticated}` with `USING (true)` — or `USING (active = true)` for `PackageOffer` — on each of the 7 tables.)*
- [x] AC3: Given a Data API `INSERT`/`UPDATE`/`DELETE` request with the `anon` or `authenticated` key against any of these tables, then it is rejected (no matching policy). *(Verified: `pg_policies` shows zero `INSERT`/`UPDATE`/`DELETE` policies for any of the 7 tables.)*
- [x] AC4: Given the existing public pages (home, classes/booking calendar, promotions, rewards) rendered through the app's own Prisma-backed API routes, then their behavior is unchanged (they never call the Data API directly, so this phase is purely additive safety). *(Verified: `GET /api/classes` returns live `ClassOccurrence`/`ClassTemplate`/`Instructor` data through Prisma post-RLS.)*

## Deliverables
- **New Prisma migration** `prisma/migrations/<timestamp>_enable_rls_public_content/migration.sql`:
  ```sql
  ALTER TABLE "Instructor" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "ClassTemplate" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "ClassOccurrence" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "HomeContent" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "PackageOffer" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "ToyPart" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Public read access" ON "Instructor"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "ClassTemplate"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "ClassOccurrence"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "HomeContent"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "PackageOffer"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "ToyPart"
    FOR SELECT TO anon, authenticated USING (true);

  CREATE POLICY "Public read access" ON "Milestone"
    FOR SELECT TO anon, authenticated USING (true);
  ```
- Consider restricting `PackageOffer` reads to `active = true` rows only, to avoid leaking inactive/draft pricing tiers via the Data API:
  ```sql
  CREATE POLICY "Public read access" ON "PackageOffer"
    FOR SELECT TO anon, authenticated USING (active = true);
  ```
  Use this variant instead of the unconditional one above.

## Implementation Notes
- Same migration mechanics as phase 01: `npx prisma migrate dev --create-only --name enable_rls_public_content`, hand-edit the SQL, then apply.
- No index additions needed — these policies use `USING (true)` or a simple boolean column filter (`active`), which already benefits from any existing index and doesn't require the `(select auth.uid())` wrapping pattern since no per-row function call is involved.

## Out of Scope
- Sensitive/PII tables (see `01-enable-rls-sensitive-tables.md`).
- Any policy referencing `auth.uid()` or `auth.jwt()` — not applicable, these tables have no owner column.
