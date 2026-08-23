# PHASE 1: Booking Classification & Data Access

## Goals
- Confirm the current model can reliably distinguish a member’s paid special-class booking from a normal booking.
- Keep the cancellation policy server-enforceable without adding unnecessary schema complexity.

## Current Model Assessment
- `Attendance` identifies the member and booked `ClassOccurrence`.
- `ClassOccurrence.isSpecial` identifies special sessions.
- `PendingPurchase` stores the member’s `SPECIAL_CLASS` purchase, exact occurrence, and approved payment status.
- The current auto-booking approval flow creates attendance only after the special-class purchase is approved.

No new table is required for the initial cancellation-contact policy. The API must query the attendance’s occurrence and, defensively, confirm the matching approved `SPECIAL_CLASS` purchase before blocking cancellation.

## Acceptance Criteria
- [x] AC1: Given an active attendance is loaded for cancellation, when its occurrence is special and the member has an approved matching `SPECIAL_CLASS` purchase, then the backend can classify it as a paid special-class booking.
- [x] AC2: Given a special occurrence has an attendance but no approved matching special purchase due to legacy/admin correction data, when cancellation is evaluated, then the policy is explicitly defined and does not accidentally block unrelated normal bookings.
- [x] AC3: Given cancellation is rejected as a paid special class, when no database write occurs, then `Attendance.status` stays `BOOKED` and `ClassOccurrence.bookedCount` is unchanged.

## Implementation Plan
- [x] Review every path that creates special-class attendance: admin approval, direct booking protections, development fixtures, and manual admin corrections.
- [x] Add a transaction-local lookup for an approved purchase with matching `memberId`, `classOccurrenceId`, `kind: SPECIAL_CLASS`, and `status: APPROVED`.
- [x] Define a stable `PAID_SPECIAL_CANCELLATION_CONTACT_STUDIO` API error code/message for the member UI.
- [x] Add an index only if query profiling demonstrates it is necessary; the existing `PendingPurchase` member and occurrence indexes are expected to support the lookup.

## Verification
- [ ] Inspect a real approved special payment and confirm it links the member, occurrence, purchase kind, purchase status, and booked attendance as expected.
- [ ] Confirm normal attendances and special attendances created outside the approved-payment flow behave according to the chosen defensive policy.
