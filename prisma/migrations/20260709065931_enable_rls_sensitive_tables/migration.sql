-- Enable Row Level Security on all member/PII/financial tables.
-- No policies are added: the app never queries these tables as `anon`/`authenticated`
-- (all access goes through Prisma using the `postgres` role, which has BYPASSRLS,
-- or the Supabase service-role client, which also bypasses RLS). With RLS enabled
-- and zero policies, `anon`/`authenticated` requests via the Data API are denied
-- by default, which is the desired defense-in-depth outcome.
-- See docs/plans/row-level-security/01-enable-rls-sensitive-tables.md

ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingPurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberToyPart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberMilestone" ENABLE ROW LEVEL SECURITY;