-- Enable Row Level Security on public-facing content/catalog tables, with an
-- explicit SELECT-only policy for anon/authenticated. Writes to these tables
-- happen exclusively through admin API routes via Prisma (postgres role,
-- bypasses RLS), so no write policy is added for anon/authenticated.
-- See docs/plans/row-level-security/02-public-content-read-policies.md

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
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Public read access" ON "ToyPart"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access" ON "Milestone"
  FOR SELECT TO anon, authenticated USING (true);