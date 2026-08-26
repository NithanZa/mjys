# PHASE 1: Schema & Migration

## Goals
- Represent an occurrence-specific special-class price and a payment request that can target either a package offer or one special class.
- Preserve all existing package purchases and package balances without converting them into special-class admissions.

## Acceptance Criteria
- [x] AC1: Given the Prisma schema is migrated, when a `ClassOccurrence` is special, then it can store a positive integer `specialPriceTHB`; non-special occurrences store `null`.
- [x] AC2: Given a payment slip is submitted, when it targets a package or a special occurrence, then `PendingPurchase` stores a purchase kind, exactly one matching target relation, and an immutable requested amount.
- [x] AC3: Given an existing `PendingPurchase` references a package offer, when the migration runs, then it remains a valid package purchase with its amount snapshot populated from the offer price.
- [x] AC4: Given an existing `Package` or ordinary attendance, when the migration runs, then its data and existing relations remain unchanged.
- [x] AC5: Given generated Prisma Client types are consumed by application code, when the migration is complete, then types compile without relying on stale generated artifacts.

## Implementation Plan
- [x] Add nullable `specialPriceTHB Int?` to `ClassOccurrence`; document in the schema that it is only populated for `isSpecial` occurrences.
- [x] Add a `PurchaseKind` enum with `PACKAGE` and `SPECIAL_CLASS` values.
- [x] Extend `PendingPurchase` with `kind`, `amountTHB`, nullable `packageOfferId`, and nullable `classOccurrenceId`; add relations and indexes for both targets.
- [x] Choose migration defaults that classify all historical rows as `PACKAGE`, preserve their existing `packageOfferId`, and set `amountTHB` to the package offer's effective amount according to the current business rule (standard price unless discount price is the amount members were instructed to pay).
- [x] Make the package-offer relation optional only after the data migration has populated existing rows; create the new special-occurrence relation with a deliberate deletion policy that preserves accounting history.
- [x] Add database-level checks where the deployed PostgreSQL migration mechanism supports them: `specialPriceTHB > 0` when non-null, `amountTHB > 0`, and target consistency. Retain API validation as the authoritative guard across environments.
- [x] Update the Prisma seed/mock fixtures and all local TypeScript interfaces that mirror occurrences or purchases.
- [x] Run `prisma generate` and the project migration command; inspect the generated SQL before applying it outside development.

## Data Decisions
- [ ] Confirm whether package purchases with `discountPriceTHB` should snapshot the discounted amount or `priceTHB`; use the amount actually displayed to the member when the request is created.
- [ ] Confirm the deletion policy for a special occurrence with historical purchases. Recommended: block deletion once a purchase exists and require cancellation instead, so payment history remains intact.

## Verification
- [ ] Apply the migration to a representative development database containing package purchases, packages, bookings, and special/non-special occurrences.
- [ ] Verify historical purchase rows remain queryable with their original package offer and a non-null amount snapshot.
- [ ] Verify a new special purchase can reference an occurrence and cannot be mistaken for a package purchase in Prisma queries.
