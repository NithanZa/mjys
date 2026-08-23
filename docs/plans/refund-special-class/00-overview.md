# FEATURE: Paid Special-Class Cancellation & Refund Contact

## Goals
- Prevent members from self-cancelling a paid special-class booking after the studio has approved the payment and reserved their spot.
- Direct members to the in-app Contact Us page for any paid special-class cancellation, transfer, or refund request while leaving normal-class cancellation behaviour unchanged.

## Confirmed Policy
- **Paid special class:** Self-cancellation is blocked. The member’s booking and reserved spot remain unchanged until studio staff handle the request.
- **Contact action:** The pop-up’s primary action navigates to `/contact`.
- **Normal class:** The current cancellation flow, including late-cancellation and package-credit rules, remains unchanged.
- **Staff resolution:** This feature only guides the member to contact the studio. It does not introduce automatic refunds or member-initiated refund requests in this phase.

## Acceptance Criteria
- [ ] AC1: Given a member is booked into a paid special class, when they select `Booked — Cancel`, then the app does not call the booking-cancellation API and opens a contact pop-up instead.
- [ ] AC2: Given the paid-special-class pop-up is open, when the member reads it, then it clearly explains that payment and reserved spots are handled by the studio and that the booking remains active.
- [ ] AC3: Given the member selects the pop-up’s primary action, when navigation occurs, then they are sent to `/contact`.
- [ ] AC4: Given the member dismisses the pop-up, when they return to the class detail or schedule, then their booking remains intact and the capacity remains unchanged.
- [ ] AC5: Given a member is booked into a normal class, when they select `Booked — Cancel`, then the existing self-cancellation flow continues without the paid-special-class pop-up.
- [ ] AC6: Given a client bypasses the UI and calls `DELETE /api/bookings` for a paid special class, when the API receives the request, then it refuses the cancellation and preserves attendance and capacity.

## Deliverables
- **Phase 1** (`01-schema-and-db.md`): Confirm the existing data model has enough information to identify paid special bookings and define any needed query/index changes.
- **Phase 2** (`02-member-refund-flow.md`): Add the member-facing blocked-cancellation modal and Contact Us navigation to schedule and class-detail booking controls.
- **Phase 3** (`03-admin-refund-management.md`): Enforce blocked cancellation server-side and document/admin-surface the staff workflow for resolving special-class requests.
- **Phase 4** (`04-verification-and-testing.md`): Add automated checks and run the member/admin cancellation smoke tests.

## Out of Scope
- Automatic bank refunds, refund processing integrations, and refund status tracking.
- Member-to-member booking transfers or waitlist replacement.
- Changing regular-class cancellation windows or package-credit rules.
