# PHASE 2: Purchase APIs & Booking Enforcement

## Goals
- Safely create, review, and query special-class payment requests through the existing authenticated slip workflow.
- Enforce separate entitlement rules atomically so a special-class booking never consumes a general package credit.

## Acceptance Criteria
- [x] AC1: Given an authenticated member submits an existing, future, non-cancelled special occurrence and a slip path, when `POST /api/purchases` succeeds, then a pending `SPECIAL_CLASS` purchase is created with the server-derived occurrence price.
- [x] AC2: Given a member submits an invalid target, a normal class, a cancelled/past occurrence, or a duplicate unresolved request for the same special occurrence, when they call the purchase API, then it returns a specific 4xx error and creates no record.
- [x] AC3: Given an admin approves a special-class slip, when the approval transaction completes, then the purchase is approved without creating a `Package` and only once.
- [x] AC4: Given an admin approves a package slip, when the approval transaction completes, then the existing package-creation behavior continues unchanged.
- [x] AC5: Given a member books an approved special class, when capacity is available, then the attendance and booking count are created atomically and no package is read, decremented, or exhausted.
- [x] AC6: Given a member books a special class without an approved matching purchase, when capacity is available, then booking fails and neither attendance nor booking count is created.
- [x] AC7: Given a member books a normal class, when eligible under the existing normal-class policy, then the behavior remains unchanged and special-class purchases are ignored.
- [x] AC8: Given a member cancels a special-class booking, when the cancellation succeeds, then capacity is restored, no package credit is added, and their approved admission remains available for a later rebooking.
- [x] AC9: Given staff cancel a special class, when active attendances exist, then attendance and capacity are cancelled/reset without package refunds; approved special purchases are retained and returned by an admin refund-work query or response.

## Implementation Plan
- [x] Refactor `/api/purchases` request validation to accept a discriminated input (`packageOfferId` or `classOccurrenceId`), derive `kind` and `amountTHB` on the server, and never accept amount or status from the member.
- [x] Update member and admin purchase GET endpoints to include the relevant target (`offer` or occurrence with instructor/date) and signed slip URL while keeping all target data scoped to the purchase owner or an admin.
- [x] Consolidate duplicate approval behavior between `PATCH /api/purchases` and `POST /api/admin/purchases`, or designate one canonical approval route and make the other delegate to it, so package and special approval rules cannot drift.
- [x] Within the booking transaction, fetch the occurrence before member package selection. Branch on `isSpecial`: require an approved `SPECIAL_CLASS` purchase for the exact `classOccurrenceId`, otherwise execute the current package-credit flow.
- [x] Preserve duplicate-booking, cancellation, capacity, rate-limit, and concurrency checks in both branches.
- [x] Update class cancellation to branch by occurrence type; only regular class bookings may restore an appropriate package credit. Return or record approved special purchases that require manual external refunds.
- [x] Ensure roster and scanner routes operate on the attendance record only; no new payment action occurs during on-day check-in.
- [x] Define stable error codes/messages for pending approval, rejected/no admission, cancelled class, full class, and duplicate booking so the member UI can render the correct next action.

## Security & Integrity
- [x] Authenticate every member purchase/booking request and every admin review request with existing auth helpers.
- [x] Look up price and eligibility from database records inside the transaction; do not trust client-side `isSpecial`, price, member ID, or approval data.
- [x] Prevent repeat approval, duplicate pending payment requests, and cross-member/cross-occurrence entitlement reuse.

## Verification
- [ ] Add route-level tests for package and special payment creation/approval, including authorization and invalid targets.
- [ ] Add transaction-focused tests proving that special bookings preserve package balances and normal bookings cannot use special purchase records.
- [ ] Test simultaneous final-seat booking attempts and duplicate requests for the same special occurrence.
