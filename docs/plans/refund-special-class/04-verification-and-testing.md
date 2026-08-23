# PHASE 4: Verification & Rollout

## Goals
- Prove that paid special bookings cannot be cancelled by the member through either the UI or direct API calls.
- Verify the new contact route is clear while regular class cancellation and studio-operated class cancellation remain intact.

## Acceptance Criteria
- [ ] AC1: Given a member is booked into a paid special class, when they try to cancel from every member booking surface, then the contact pop-up appears and no cancellation request is issued.
- [ ] AC2: Given a member dismisses the paid-special contact pop-up, when they return to the schedule or class detail, then they remain booked and the available-slot count is unchanged.
- [ ] AC3: Given the member selects `Contact the studio`, when navigation completes, then the Contact Us page loads successfully.
- [ ] AC4: Given a direct authenticated request targets a paid special booking, when it reaches `DELETE /api/bookings`, then it returns the defined conflict response with no attendance/package/capacity change.
- [ ] AC5: Given a normal class booking, when the member cancels it, then normal cancellation, late-cancellation, and package-credit behaviour remain unchanged.
- [ ] AC6: Given a studio-wide special-class cancellation, when staff cancel the occurrence, then its existing staff-side attendance and refund follow-up flow still operates.

## Automated Verification
- [ ] Add focused API tests for normal booked attendance, paid special booked attendance, no purchase/legacy special attendance, and a cancelled occurrence.
- [ ] Add component tests for the paid-special contact modal: visible copy, dismissal, Contact Us navigation, and absence of cancellation API calls.
- [ ] Add a regression test confirming `BookButton`/booking controls preserve normal cancellation behaviour.
- [x] Run Prisma validation/generation, TypeScript type-check, lint, and production build.

## Manual Smoke Test
- [ ] Create a paid special-class purchase, approve it, and confirm auto-booking succeeds.
- [ ] As that member, press `Booked — Cancel` from the schedule card; confirm the pop-up opens and `bookedCount` does not change.
- [ ] Dismiss the pop-up; confirm the booking remains on the member profile/schedule.
- [ ] Reopen the pop-up and select `Contact the studio`; confirm `/contact` opens.
- [ ] Attempt a direct API cancellation as the same member; confirm it receives the contact-studio response and preserves the booking.
- [ ] Book and cancel a normal package-covered class; confirm its existing flow remains unchanged.
- [ ] Check modal layout, long class names, keyboard Escape, and mobile/desktop accessibility.

## Rollout Notes
- [ ] Deploy the member UI and API enforcement together; client-side-only blocking is not sufficient.
- [ ] Tell studio staff that special-class cancellation/refund requests will now arrive through Contact Us and require manual resolution.
- [ ] Update this checklist by ticking boxes as implementation and manual validation are completed.
