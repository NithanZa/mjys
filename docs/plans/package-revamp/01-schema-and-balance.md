# PHASE 1: Schema, Migration, and Remaining-Classes Helper

## Goals

- Make remaining classes finite everywhere (`classCount` and `classesRemaining` are required positive/non-negative integers, never null).
- Remove unlimited from the catalog type enum and from admin/member types.
- Record which lot a normal booking consumed, so later phases can refund the same lot.
- Put one definition of “usable remaining classes” in a shared helper so booking, member APIs, and admin stats cannot drift.

## Acceptance criteria

- [ ] AC1: Given the schema is migrated, when a `PackageOffer` is read, then `classCount` is a required integer `>= 1` and `type` is never `UNLIMITED`.
- [ ] AC2: Given the schema is migrated, when a `Package` (lot) is read, then `classesRemaining` is a required integer `>= 0` (not null).
- [ ] AC3: Given a normal-class `Attendance` created after this phase’s booking work lands, when it consumed remaining classes, then it stores the lot id it was charged against. Historical rows may have `null`.
- [ ] AC4: Given generated Prisma Client types are consumed, when the app compiles, then `UNLIMITED` and nullable remaining counts are gone from first-party code (mocks, API types, admin forms).
- [ ] AC5: Given `lib/packages/balance.ts` (name may vary), when any caller asks for a member’s remaining classes, then the result is the sum of `classesRemaining` on lots with `expiresAt >= now` and `classesRemaining > 0`. Status `EXPIRED` / `EXHAUSTED` is derived or kept consistent with those rules, not treated as a second source of truth.

## Design decisions

- **Keep the `Package` model.** It is a dated lot of remaining classes, not a member-wide “active pack”. Renaming the table is unnecessary churn.
- **Expiry is `expiresAt`, not `status`.** A lot is usable iff `expiresAt >= now` and `classesRemaining > 0`. On write (book, refund, admin edit), set `status` to `EXHAUSTED` when remaining hits 0, `EXPIRED` when `expiresAt < now`, otherwise `ACTIVE`. Do not add a cron in this feature.
- **Drop `UNLIMITED` from `PackageType`.** Pre-migration: query for any offer or lot with `type = UNLIMITED` or `classCount` / `classesRemaining` null. Seed has none. If production has any, stop and convert them by hand before applying the migration (do not invent a class count in SQL).
- **`Attendance.consumedPackageId String?`** plus relation to `Package`. `onDelete: SetNull` so deleting a lot (rare; member delete still cascades lots) does not destroy attendance history. Special-class attendances stay `null`.
- **Walk-in** stays `PackageType.WALK_IN` with `classCount = 1`. Later phases identify non-refundable lots by `offer.type === WALK_IN`, never by id `pkg_walkin`.

## Implementation plan

- [ ] Add `consumedPackageId` (nullable) and `consumedPackage` relation on `Attendance` in `prisma/schema.prisma`. Index it.
- [ ] Change `PackageOffer.classCount` from `Int?` to `Int`.
- [ ] Change `Package.classesRemaining` from `Int?` to `Int`.
- [ ] Remove `UNLIMITED` from enum `PackageType`.
- [ ] Write the SQL migration to:
  - Fail or no-op clearly if any null `classCount` / `classesRemaining` or `UNLIMITED` rows exist (assert in the migration comments and in Phase 5’s preflight query).
  - Add the new attendance column.
- [ ] Add `lib/packages/balance.ts` used by API routes (not client bundles):
  - `usableLotsWhere(now: Date)` — Prisma `where` fragment.
  - `sumRemaining(lots)` / `getRemainingClasses(tx, memberId)` — pooled integer.
  - `pickFifoLot(lots)` — soonest `expiresAt`, then oldest `createdAt` as tie-break.
  - `syncLotStatus(lot, now)` — returns `ACTIVE | EXPIRED | EXHAUSTED`.
- [ ] Update `prisma/seed.ts` only if types break (seed offers already have finite `classCount`).
- [ ] Update TypeScript mirrors: `lib/api/packages.ts`, `lib/mock/packages.ts`, `lib/mock/purchases-store.ts`, admin package routes’ `validTypes` arrays.
- [ ] Run `prisma migrate` / `prisma generate`. Do not hand-edit `generated/prisma`.

## Files

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_package_revamp/`
- `lib/packages/balance.ts` (new)
- `lib/api/packages.ts`
- `lib/mock/packages.ts`
- `lib/mock/purchases-store.ts`
- `app/api/admin/packages/route.ts`
- `app/api/admin/packages/[id]/route.ts`
- `prisma/seed.ts` (only if required)

## Data notes

- Existing members with several `Package` rows are already in the target shape. No merge of lots.
- Time-expired rows that still say `status: ACTIVE` stay as-is; the helper ignores them via `expiresAt`. Optional one-shot SQL in the migration may set `status = EXPIRED` where `expiresAt < now()` so admin badges are less misleading — recommended, not required for correctness once the helper is used everywhere.

## Verification

- [ ] `npx prisma validate` and generate succeed.
- [ ] Preflight query on a copy of production/staging returns zero unlimited / null-count rows before migrate.
- [ ] After migrate, creating an offer without `classCount` is a type error; remaining-classes helper returns 0 for a member with only expired lots.
