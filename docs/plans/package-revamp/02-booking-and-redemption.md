# PHASE 2: Booking Gate, FIFO Spend, and Same-Lot Refund

## Goals

- Normal classes require remaining classes. No usable lot → no booking.
- Spend and restore the **same** lot. Walk-in lots are never restored.
- Special classes stay on approved `SPECIAL_CLASS` admission and never touch remaining classes.

## Acceptance criteria

- [ ] AC1: Given a member with no unexpired remaining classes, when they `POST /api/bookings` for a normal class, then the response is 403, remaining classes stay 0, and `bookedCount` does not change.
- [ ] AC2: Given a member with lots expiring on different dates, when they book a normal class, then `classesRemaining` decrements by 1 on the soonest-expiring usable lot, that attendance stores `consumedPackageId`, and the lot status becomes `EXHAUSTED` if remaining hits 0.
- [ ] AC3: Given a member books a special class with an approved special purchase, when they book, then no lot is decremented and `consumedPackageId` is null.
- [ ] AC4: Given an early cancel (≥ 12 hours) of a normal booking that has `consumedPackageId`, when the lot is still unexpired, then that lot increments by 1 and returns to `ACTIVE` if it was exhausted. If the lot has already expired, remaining is not restored.
- [ ] AC5: Given the consumed lot’s offer type is `WALK_IN`, when the member cancels (early or late), then remaining is not restored.
- [ ] AC6: Given staff cancel a normal class, when remaining is restored for booked members, then the same lot rules as AC4–AC5 apply (use `consumedPackageId`, skip walk-in by type, skip expired lots).
- [ ] AC7: Given a legacy attendance with `consumedPackageId = null`, when it is early-cancelled, then fall back to FIFO restore on the soonest-expiring usable non-walk-in lot (or no restore if none). Do not use the current latest-expiring refund.

## Design decisions

- **Gate lives on the server.** The member UI may disable Book and link to Packages, but `/api/bookings` is authoritative.
- **Consume inside the same transaction** as capacity increment and attendance create (already true). After this phase, missing a usable lot is an error, not a skip.
- **Refund targeting:** prefer `attendance.consumedPackageId`. That fixes the current bug where book uses `expiresAt asc` and cancel uses `expiresAt desc`.
- **Walk-in:** `offer.type === "WALK_IN"`, not `packageOfferId: { not: "pkg_walkin" }`. Apply in member cancel and admin class cancel (`app/api/admin/classes/[id]/route.ts`).
- **Error copy:** replace “Your package is out of classes.” with something that matches the new status, e.g. “You have no classes left. Buy a pack to book.” Keep the internal error code; `NO_REMAINING_CLASSES` is clearer than `PACKAGE_EXHAUSTED` (either is fine if the HTTP body is updated).
- **Check-in / scanner:** still must not change remaining classes (deduct on book, not on attend).

## Implementation plan

- [ ] In `POST` `app/api/bookings/route.ts`:
  - Load usable lots via the Phase 1 helper (`expiresAt >= now`, `classesRemaining > 0`), ordered by `expiresAt asc`, `createdAt asc`.
  - Special class: unchanged admission check; do not load/spend lots.
  - Normal class: if no lot, throw. Else decrement that lot, sync status, create attendance with `consumedPackageId`.
- [ ] In `DELETE` `app/api/bookings/route.ts`:
  - Late cancel: no restore (unchanged).
  - Early cancel + special: no restore (unchanged).
  - Early cancel + normal: restore via `consumedPackageId` / walk-in type / expiry rules above.
- [ ] Update `app/api/admin/classes/[id]/route.ts` class-cancel restore to the same helper (no hard-coded walk-in id, no latest-expiring pick).
- [ ] Update client `lib/api/bookings.ts` so a 403 body is surfaced to the book UI (class detail and any list `BookButton` handlers).
- [ ] On class detail (`app/(shell)/book/[occurrenceId]/page.tsx`): if remaining classes are 0 and the class is not special, disable Book and offer a link to `/promotion`. Remaining classes can come from `usePurchases` once Phase 3 exists; until then, rely on the API error. Prefer wiring the gate UI in Phase 3 if the hook is changing in the same effort — do not ship a bookable button that only fails after submit.

## Files

- `app/api/bookings/route.ts`
- `app/api/admin/classes/[id]/route.ts`
- `lib/packages/balance.ts`
- `lib/api/bookings.ts`
- `app/(shell)/book/[occurrenceId]/page.tsx` (error / disabled Book; may complete in Phase 3)
- `components/booking/ClassCard.tsx` / `BookButton.tsx` if list booking needs the same disabled state

## Verification

- [ ] Book with 0 remaining → 403, capacity unchanged.
- [ ] Book with two lots (5 left expiring sooner, 10 left expiring later) → sooner lot goes 5 → 4; attendance has that lot id.
- [ ] Early cancel → same lot 4 → 5.
- [ ] Early cancel after that lot’s `expiresAt` → remaining unchanged.
- [ ] Walk-in book then early cancel → remaining stays 0.
- [ ] Special class book with 0 remaining classes but approved special slip → success.
- [ ] Admin cancel of a normal class restores the consumed lots, not a different member’s latest pack.
