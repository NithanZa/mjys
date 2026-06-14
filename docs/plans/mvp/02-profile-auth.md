# PHASE 2 — Profile, LINE auth & membership identity

## Goals
- Turn the LIFF session into a persistent **member profile** (the QR-coded "member pass" from §8–10 of `user-flow.md`).
- Ship the level system (Cat / Tiger / Leopard) as a visible, gamified status surface.

## Acceptance Criteria
- [x] **AC1**: Given a first-time user opens the app in LINE, when they reach `/profile`, then they see a registration form pre-filled with their `displayName` from `liff.getProfile()`, and only Name + Phone are required.
- [ ] **AC2** _(deferred to backend pass)_: Given the user submits the registration form, when the request reaches `POST /api/members`, then the server verifies the LINE ID token (`liff.getIDToken()`) before creating the member record.
- [x] **AC3**: Given a registered member opens `/profile`, when the page renders, then it shows their name, level badge (Cat/Tiger/Leopard), total classes attended, and a QR code encoding their internal `memberId`.
- [~] **AC4** _(short-lived done; HMAC signing deferred to backend pass)_: Given the studio scans the QR code, when the payload is decoded, then it resolves to exactly one member and is short-lived / signed (not a raw `userId`).
  - Frontend stub: 60s TTL, base64-JSON payload `{ memberId, exp }` (see `lib/qr.ts`).
  - Backend pass will swap to HMAC-signed JWT using `QR_SIGNING_SECRET`.
- [x] **AC5**: Given a member's `classesAttended` crosses a threshold (20, 50, 100), when they next open the app, then their level badge updates and a one-time celebration toast is shown.
  - Frontend simulation: dev-only `+1 / +10 / -1` controls on `/profile` to verify thresholds without real attendance.
- [x] **AC6**: Given LIFF is opened **outside** the LINE client (desktop preview), when the user lands on `/profile`, then a friendly fallback explains "Open in LINE to continue" instead of crashing.

## Deliverables
- **Database**: Supabase Postgres via Prisma 7 driver-adapter pattern (`@prisma/adapter-pg`).
- **Schema** (`prisma/schema.prisma`, provider `postgresql`):
  - `Member { id, lineUserId @unique, displayName, phone, classesAttended, level (enum Level), createdAt, updatedAt }`
  - `Attendance { id, memberId, classOccurrenceId, status, checkedInAt? }` (placeholder — populated in Phase 3)
  - `Level` enum: `CAT | TIGER | LEOPARD`
- **Config**:
  - `prisma.config.ts` — datasource uses `DIRECT_URL` for migrations.
  - Runtime client (`lib/db.ts`) uses `DATABASE_URL` (Supavisor pooled, port 6543) via `PrismaPg`.
- `app/profile/page.tsx` — registration flow + member dashboard, both states in the same route.
- `components/profile/` — `MemberQRCard`, `LevelBadge`, `LevelProgress`, `RegistrationForm`.
- `app/api/members/route.ts` — `POST` (create), `GET` (current via verified ID token).
- `app/api/members/me/route.ts` — current member by verified ID token.
- `lib/line/verify-id-token.ts` — server-side LINE ID token verification (Channel ID + signature).
- `lib/levels.ts` — pure function `getLevel(classesAttended)` returning `{ level, label, next, progress }`.
- `lib/qr.ts` — short-lived signed payload generator (`memberId` + `iat` + HMAC), 60 s TTL.
- `components/ui/QRCode.tsx` — wraps a maintained QR library (e.g. `qrcode.react`).

## Out of scope
- Actually decrementing class slots or recording attendance — Phase 3 wires the check-in scanner side.
- Rewards / Tiger Toys progression — Phase 5.

## Frontend-only scope (this pass)
This pass landed the **frontend** half of Phase 2. Member persistence is a `localStorage`-backed mock (`lib/profile/mock-store.ts`) so the UI is fully testable without Supabase.

Deferred to a later **backend pass** (everything in `## Deliverables` below the divider):
- `prisma/schema.prisma` (already authored, awaiting `DIRECT_URL`).
- `prisma.config.ts` (already authored, awaiting `DIRECT_URL`).
- `app/api/members/route.ts`, `app/api/members/me/route.ts`.
- `lib/line/verify-id-token.ts`.
- `lib/db.ts` (Prisma client + `@prisma/adapter-pg`).
- HMAC-signed member-pass tokens in `lib/qr.ts` (currently a base64-JSON stub).

**Migration path** when the backend pass starts:
1. Set `DATABASE_URL` + `DIRECT_URL` in `.env.local`.
2. `pnpm prisma generate && pnpm prisma migrate dev --name init`.
3. Replace `useMockMember` calls in `app/(shell)/profile/page.tsx` with a real fetcher hitting `/api/members/me`.
4. Tighten `lib/qr.ts` to sign with `jose` + `QR_SIGNING_SECRET`.

## Dependencies
- `prisma` (dev), `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg` (dev).
- `qrcode.react`, `zod` (input validation), `jose` (HMAC sign for QR pass).
- **Env vars**:
  - `DATABASE_URL` — Supabase **pooled** connection (Supavisor, port 6543, `?pgbouncer=true`).
  - `DIRECT_URL` — Supabase **direct** connection (port 5432) for `prisma migrate`.
  - `LINE_LOGIN_CHANNEL_ID` — used to verify LIFF ID tokens against `https://api.line.me/oauth2/v2.1/verify`.
  - `QR_SIGNING_SECRET` — random 32+ byte secret for HMAC member-pass signing.

## Verification
- `pnpm prisma generate` runs cleanly (no DB needed).
- After env vars are configured: `pnpm prisma migrate dev --name init` creates tables in Supabase.
- `pnpm build` and `pnpm lint` pass.
- Manual: register → reopen → see persisted profile → bump `classesAttended` in DB → level badge updates.
- Security: tampering with `lineUserId` in the request body without a valid ID token returns `401`.

## Setup notes (Supabase)
1. Create a Supabase project. From **Project Settings → Database → Connection string**:
   - Copy the **Transaction pooler** URI → `DATABASE_URL` (append `?pgbouncer=true&connection_limit=1` if missing).
   - Copy the **Direct connection** URI → `DIRECT_URL`.
2. Add both to `.env.local` along with `LINE_LOGIN_CHANNEL_ID` and `QR_SIGNING_SECRET` (`openssl rand -hex 32`).
3. Run `pnpm prisma migrate dev --name init`.
4. (Optional) `pnpm prisma studio` to inspect data.
