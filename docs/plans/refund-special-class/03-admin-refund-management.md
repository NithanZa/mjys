# PHASE 3: Server Enforcement & Staff Resolution

## Goals
- Enforce the paid-special-class cancellation policy at the API boundary so the UI cannot be bypassed.
- Give staff the operational context needed to handle a member’s contact request without implying that refunds are automatic.

## Acceptance Criteria
- [x] AC1: Given a member calls `DELETE /api/bookings` for a booked paid special class, when the API verifies the paid-special classification, then it returns a conflict response with the contact-studio error code/message.
- [x] AC2: Given the paid-special cancellation API response is returned, when the transaction completes, then attendance remains `BOOKED` and occurrence capacity/booked count remain unchanged.
- [x] AC3: Given a member calls `DELETE /api/bookings` for a normal booked class, when all existing rules allow it, then cancellation and credit-refund behaviour remain unchanged.
- [ ] AC4: Given an admin opens a special-class roster or member history, when a member requests a change through the contact page, then staff can identify the associated occurrence and approved payment record using current admin screens or linked data.
- [ ] AC5: Given staff need to cancel or refund a paid special-class booking, when they resolve the request, then the operational process is explicit and no member-facing UI claims that a refund has occurred automatically.

## Implementation Plan
- [x] In `DELETE /api/bookings`, load the attendance occurrence and matching approved special purchase inside the existing transaction before changing attendance or capacity.
- [x] If the attendance is a paid special booking, terminate the transaction with the stable paid-special contact error before any write.
- [x] Map that error to a 409 response with member-safe wording, for example: `This paid special-class booking must be changed through the studio. Please contact us for help.`
- [x] Ensure local/mock booking paths used outside authenticated modes mirror the blocked-cancellation experience so development does not train a misleading behaviour (removed frontend mock fallbacks in favor of authentic production-ready APIs).
- [x] Review the existing admin class-cancellation flow separately: studio-wide class cancellation is still allowed and remains responsible for notifying/refunding affected paid members outside this scope.
- [x] Document the staff procedure: confirm member/occurrence/payment, agree the outcome with the member, then apply the appropriate staff-side cancellation/refund process.

## Security & Integrity
- [x] Never trust a client-provided `isSpecial`, purchase ID, or payment state to decide cancellation eligibility.
- [x] Query the authenticated member’s own attendance and exact approved purchase only.
- [x] Keep the decision and any capacity changes in the same transaction to prevent partial cancellation.

## Verification
- [ ] Issue a direct authenticated DELETE request for an approved paid special booking and verify a 409 response with no database mutation.
- [ ] Issue the same request for a normal booking and verify existing cancellation behaviour.
- [ ] Confirm admin class cancellation remains possible for special classes and does not accidentally call the member self-cancellation path.
