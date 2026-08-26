# PHASE 5: Testing and Rollout

## Goals

- Prove remaining classes, FIFO spend, same-lot refund, the booking gate, and admin set-to-N on a database that already has stacked lots.
- Ship the migration only after confirming there are no unlimited / null-count rows.

## Acceptance criteria

- [ ] AC1: Given the preflight SQL, when it runs against staging (and production before migrate), then it returns zero `PackageOffer` / `Package` rows with `UNLIMITED` or null class counts.
- [ ] AC2: Given automated tests (or a recorded checklist if the repo has no booking test harness yet), when the Phase 2 scenarios run, then book/cancel/admin-cancel behave as specified.
- [ ] AC3: Given a member who currently shows one “active pack” in production while extra lots exist in the DB, when they load Packages after deploy, then they see the **sum** of unexpired remaining classes.
- [ ] AC4: Given staff grant and then edit remaining, when they refresh member detail, then headline and lots stay consistent with the helper.

## Preflight (before migrate)

```sql
SELECT id, type, "classCount" FROM "PackageOffer"
WHERE type = 'UNLIMITED' OR "classCount" IS NULL;

SELECT id, "memberId", "classesRemaining", status, "expiresAt"
FROM "Package"
WHERE "classesRemaining" IS NULL;
```

If either query returns rows, convert them by hand (assign a finite class count and remaining) **before** the migration that drops `UNLIMITED` and nullability.

Recommended optional cleanup (same window):

```sql
UPDATE "Package"
SET status = 'EXPIRED'
WHERE "expiresAt" < NOW() AND status = 'ACTIVE';

UPDATE "Package"
SET status = 'EXHAUSTED'
WHERE "classesRemaining" = 0 AND status = 'ACTIVE';
```

## Automated coverage (add if a nearby test pattern exists)

Prefer API-level tests around:

- `getRemainingClasses` / FIFO pick (pure helper tests; easiest).
- `POST /api/bookings` 403 with 0 remaining.
- FIFO decrement with two lots.
- Refund to `consumedPackageId`.
- Walk-in not refunded.
- Special class does not decrement.
- `PATCH` remaining increase/decrease/reject-when-no-lot.

Do not add a large e2e framework just for this feature. If there is no test runner in use, the manual checklist below is the gate.

## Manual checklist

Member

- [ ] 0 remaining: Packages empty status; Pay still works; normal class Book blocked; special class still uses slip/pay.
- [ ] 1 remaining: book succeeds; status 0; early cancel restores 1 on the same lot.
- [ ] Two lots, different expiry: book hits the sooner lot; Packages shows the sum.
- [ ] Buy a second offer while remaining > 0: after approval, sum increases; both lots remain.
- [ ] Profile banner: only when soonest remaining lot expires within 7 days; number is that lot’s remaining, not a later lot.
- [ ] Late cancel does not restore remaining.
- [ ] Walk-in: book then early cancel does not restore.

Admin

- [ ] Member headline matches Packages for the same person.
- [ ] Set remaining up/down; grant offer; edit one lot’s remaining and expiry.
- [ ] Set remaining up on a 0-remaining member without a usable lot → rejected; grant then works.
- [ ] Pricing: no unlimited; class count required.
- [ ] Dashboard tile = members with remaining classes, not ACTIVE row count.
- [ ] Slip approve still creates a lot and increases remaining (existing slips flow).
- [ ] Cancel a class from admin: consumed lots restored; walk-in / special unchanged.

Regression

- [ ] Scanner / check-in does not change remaining.
- [ ] Bulk grant adds lots to each selected member.
- [ ] Offer delete/move (`/api/admin/packages/[id]`) still re-points lots and pending purchases.

## Rollout

1. Run preflight SQL on production.
2. Deploy code + migration together (Prisma nullability change is not compatible with old unlimited writes).
3. Spot-check 2–3 members known to have bought again before an old pack was used up — they are the people who looked like they had one active pack and will now show a higher remaining total. That is expected.
4. Tell studio staff: remaining classes stack; editing the number does not change expiry unless they edit a lot’s date; adding classes to someone at 0 still needs Grant so expiry is defined.

## Rollback

- Schema rollback needs a reverse migration (re-add `UNLIMITED`, nullable counts). Only do that if the deploy has not already written non-null remaining and `consumedPackageId` in a way you are willing to drop.
- Prefer a forward fix if the issue is copy or admin UX. The booking gate is intentional; turning it off would restore free booking at 0 remaining.
