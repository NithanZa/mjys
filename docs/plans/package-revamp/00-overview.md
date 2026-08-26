# FEATURE: Package Revamp — Remaining Classes, Not an “Active Pack”

## Goals

- Stop presenting one “active pack” as the member’s current status. Status is **how many classes they have left**.
- Let members buy another offer at any time. Approval adds that offer’s class count to their remaining total; they do not replace or pause an existing purchase.
- Keep **per-purchase expiry** internally. Booking always spends from the soonest-expiring remaining classes first (FIFO).
- Require remaining classes to book a normal class. Drop unlimited offers.
- Let staff change a member’s remaining classes directly, instead of only granting a new pack.

## Product decisions (locked)

1. **Expiry:** Keep per-purchase expiry. The member UI shows the **sum of unexpired remaining classes**. Internally, each approved purchase is still a dated lot; booking burns the soonest-expiring lot first.
2. **Unlimited and booking gate:** Finite classes only. No unlimited. Booking a normal class requires remaining classes > 0.
3. **Stacking:** A new purchase always **adds** remaining classes. Existing lots keep their own remaining counts and expiry dates.
4. **Special classes:** Unchanged. They stay a separate paid admission and never consume remaining classes.

## Current system (why this is a revamp)

Today a purchase creates a `Package` row (`classesRemaining`, `expiresAt`, `status`). Booking already burns the soonest-expiring usable row. Members can already hold several rows at once.

What is wrong for this product:

- Member UI (`ActivePackageStrip`, profile banner, `usePurchases`) picks **one** row and labels it “Active pack”. Extra purchases are invisible in status.
- Booking a normal class **does not require** a usable row. Zero remaining still books.
- `EXPIRED` is never written. Time expiry is only a query filter in some paths, not others, so UI and booking disagree.
- Early-cancel refunds the **latest-expiring** row (and skips walk-in by hard-coded id `pkg_walkin`), which can be a different row than the one that was spent.
- Admin can **grant** a catalog offer, not edit remaining classes in place.
- `UNLIMITED` exists on the enum and admin pricing form even though seed has no unlimited offer.

## Target mental model

```
PackageOffer  →  catalog (5 / 10 / 20 / walk-in). Always a finite classCount.
PendingPurchase → slip / grant ledger (unchanged kind: PACKAGE | SPECIAL_CLASS).
Package       →  one dated lot of remaining classes from one approval or grant.
Member status →  sum(classesRemaining) across unexpired lots with remaining > 0.
```

Do **not** collapse remaining classes onto `Member` as a single integer. Per-lot expiry requires lots. The pooled number is a **derived** view used by every member-facing surface and by the booking gate.

## Acceptance criteria

- [ ] AC1: Given a member has remaining classes from one or more purchases, when they open Packages or Profile, then they see **N classes left** (pooled, unexpired only), not an “active pack” name as status.
- [ ] AC2: Given a member already has remaining classes, when a new package slip is approved (or staff grant an offer), then remaining classes increase by that offer’s `classCount` and the new lot keeps its own `expiresAt`.
- [ ] AC3: Given a member has several unexpired lots, when they book a normal class, then one class is deducted from the soonest-expiring lot with remaining > 0.
- [ ] AC4: Given a member has 0 unexpired remaining classes, when they try to book a normal class, then the booking is rejected and they are pointed to Packages.
- [ ] AC5: Given a member books a special class with an approved special admission, when they book, then remaining classes are unchanged.
- [ ] AC6: Given an early cancel of a normal class that consumed a lot, when the class is more than 12 hours away, then that same lot is restored by 1 (walk-in lots are never restored).
- [ ] AC7: Given staff open a member, when they edit remaining classes, then the pooled total updates without requiring a new catalog grant. Granting an offer remains available and still adds a new dated lot.
- [ ] AC8: Given unlimited is removed, when staff create or edit a catalog offer, then unlimited is not an option and every offer has a positive `classCount`.
- [ ] AC9: Given some of a member’s remaining classes expire within 7 days, when they open Profile, then they are warned about **those** classes and that date — not about “the active pack”.

## Deliverables

- **Phase 1** (`01-schema-and-balance.md`): Finite-only schema, attendance→lot link, shared remaining-classes helper, seed/types, data migration.
- **Phase 2** (`02-booking-and-redemption.md`): Require remaining classes to book; FIFO consume; refund the consumed lot; walk-in by type.
- **Phase 3** (`03-member-surfaces.md`): Replace “active pack” UI and purchase hook with pooled remaining classes; keep buying always available.
- **Phase 4** (`04-admin-surfaces.md`): Member remaining-classes editor; grant still adds a lot; pricing without unlimited; stats/dashboard copy.
- **Phase 5** (`05-testing-and-rollout.md`): Automated coverage, migration checks, end-to-end verification.

## Out of scope

- Card / PromptPay / automatic payment verification (slip approval stays).
- Changing offer prices, validity days, or the 5/10/20/walk-in catalog itself (staff can still edit offers in Pricing).
- A background job to flip `EXPIRED`; expiry is defined by `expiresAt` at read/write time.
- Redesigning special-class payment.
- Member-facing breakdown of every lot on Packages (staff see lots; members see the pooled number plus a soonest-expiry warning when relevant).
