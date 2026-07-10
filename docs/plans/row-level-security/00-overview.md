# FEATURE: Row Level Security Hardening

## Context (findings from codebase audit)
- **All table access is server-side via Prisma** (`lib/db.ts`), connecting through the Supavisor pooler as the `postgres.[ref]` user (see `.env.example` `DATABASE_URL`). In Supabase, `postgres` is a superuser role with `BYPASSRLS`, so enabling RLS on every table will **not** break any existing Prisma query, API route, or the seed script.
- **No client-side Supabase table access exists.** A repo-wide search for `@supabase/supabase-js` usage shows it is only imported in `lib/supabase.ts` (server-only, uses `SUPABASE_SERVICE_ROLE_KEY`) and `app/auth/confirm/route.ts`. There is no `NEXT_PUBLIC_SUPABASE_ANON_KEY` anywhere in `.env.example`, and nothing calls `supabase.from(...)` from the browser.
- **Supabase Auth is used narrowly**: only for standalone-mode (`NEXT_PUBLIC_STANDALONE_MODE=true`) email/password login/registration (`app/api/auth/*`), password reset, and email confirmation. It authenticates a user, then the app looks up `Member.lineUserId = "sa_" + authUser.id`. Actual route protection is a custom signed cookie (`lib/standalone-auth.ts`, `mjys_sid`), **not** `auth.uid()`-based RLS. LINE-mode members never get a Supabase Auth session at all.
- **Consequence**: classic `auth.uid() = user_id` RLS policies don't map cleanly onto this app's auth model, since half the members (LINE users) have no Supabase Auth identity. The correct, safe approach is **default-deny RLS for `anon`/`authenticated`** on every table (defense-in-depth against a leaked/guessable anon key or future PostgREST exposure), while the app continues to work unaffected because Prisma bypasses RLS via the `postgres` role.
- Tables today (per `prisma/schema.prisma`) have **RLS disabled** — this is exactly what the Supabase Security Advisor flags as "RLS Disabled in Public" and what `@docs/guides/supabase-rls.md` warns must always be enabled on exposed schemas.
- **Storage finding**: `app/api/upload/route.ts` uploads payment slips via the service-role client and calls `.getPublicUrl(fileName)` (not a signed URL), which only returns a working URL if the `slips` bucket is public. This means slip images are currently reachable by anyone with the URL (security by obscurity via the random filename), independent of table-level RLS. This is addressed in `03-storage-bucket-policies.md`.

## Goals
- Enable RLS on every table in the `public` schema so no table is reachable via the Data API (PostgREST) using the `anon` or `authenticated` Postgres roles, closing the current advisor-flagged gap.
- Preserve 100% of existing app behavior — all reads/writes continue via Prisma (`postgres` role, bypasses RLS) and the service-role Supabase client (also bypasses RLS).
- Allow safe, intentional public read-only access (via explicit policies) only for genuinely public marketing/content tables that are meant to be publicly visible in principle (class schedule, instructors, packages, home content), while keeping all member/PII/financial tables fully locked (no policies = default deny).
- Verify with Supabase's advisors/lints that 0 RLS warnings remain, without any regression in the running app.

## Acceptance Criteria
- [x] AC1: Given any table in the `public` schema, when inspected via `pg_tables`/Supabase dashboard, then `rowsecurity` is `true` for all of them. *(Verified: all 13 app tables report `rowsecurity = true`.)*
- [x] AC2: Given a request made with the Supabase `anon` key directly against the Data API for a sensitive table (e.g. `Member`, `Attendance`, `Package`, `PendingPurchase`), when no policy exists, then the response returns an empty result set / permission error, never real data. *(Verified by `pg_policies` inspection — zero policies exist for these 6 tables. The app never ships an anon key, so no live request was made; see `01-enable-rls-sensitive-tables.md`.)*
- [x] AC3: Given a request made with the Supabase `anon` key against a designated public-content table (e.g. `ClassTemplate`, `Instructor`), when it is a `SELECT`, then it succeeds; when it is `INSERT`/`UPDATE`/`DELETE`, then it is rejected. *(Verified by `pg_policies` inspection — see `02-public-content-read-policies.md`.)*
- [x] AC4: Given the existing app (LINE mode and standalone mode) running against Prisma, when RLS is enabled with the policies in this plan, then all existing features (booking, check-in, purchases, admin dashboard, rewards) continue to work with zero behavior change. *(Smoke-tested locally: `GET /api/classes` returns live data, `GET /api/admin/purchases` correctly requires auth, `npx tsc --noEmit` passes. Standalone-mode login/registration flows and LINE LIFF flows were not interactively re-tested — recommend a manual pass before production deploy.)*
- [ ] AC5: Given the Supabase Security Advisor / `mcp: get_advisors` (or dashboard "Advisors" tab), when run after migration, then no "RLS Disabled in Public" or "Policy Missing" lints remain for any `public` table. *(No `get_advisors` MCP tool is available in this environment — user to confirm via the Supabase dashboard "Advisors" tab.)*
- [x] AC6: Given the `slips` Storage bucket, when inspected, then its public/private setting and `storage.objects` RLS policies are deliberate and documented (not left at insecure defaults), and uploads still only ever happen via the service-role key. *(Bucket switched to private; `app/api/upload/route.ts` and `GET /api/purchases`/`GET /api/admin/purchases` updated to use signed URLs via `lib/storage.ts`. See `03-storage-bucket-policies.md`.)*

## Phases
1. `01-enable-rls-sensitive-tables.md` — Enable RLS + default-deny on all member/PII/financial tables.
2. `02-public-content-read-policies.md` — Enable RLS + scoped public `SELECT` policies on content tables.
3. `03-storage-bucket-policies.md` — Audit/harden the `slips` Storage bucket.
4. `04-verification-and-rollout.md` — Migration mechanics, testing, advisor verification, rollback plan.

## Table Classification
| Table | Contains PII/financial data? | Classification | Phase |
|---|---|---|---|
| `Member` | Yes (name, email, phone, dob, address) | Sensitive — default deny | 01 |
| `Attendance` | Yes (tied to member) | Sensitive — default deny | 01 |
| `PendingPurchase` | Yes (payment proof, tied to member) | Sensitive — default deny | 01 |
| `Package` | Yes (tied to member) | Sensitive — default deny | 01 |
| `MemberToyPart` | Yes (tied to member) | Sensitive — default deny | 01 |
| `MemberMilestone` | Yes (tied to member) | Sensitive — default deny | 01 |
| `Instructor` | No — public marketing content | Public read | 02 |
| `ClassTemplate` | No — public class catalog | Public read | 02 |
| `ClassOccurrence` | No — public schedule (no member data) | Public read | 02 |
| `HomeContent` | No — CMS singleton | Public read | 02 |
| `PackageOffer` | No — public pricing | Public read | 02 |
| `ToyPart` | No — reward catalog | Public read | 02 |
| `Milestone` | No — reward catalog | Public read | 02 |

## Out of Scope
- Introducing `auth.uid()`-based per-row ownership policies for `authenticated` — not viable given the dual LINE/standalone auth model; app-level authorization (cookie/session checks in API routes) remains the source of truth for member-scoped access.
- Changing `lib/db.ts` or `lib/supabase.ts` connection roles.
- Rewriting any API route logic.
