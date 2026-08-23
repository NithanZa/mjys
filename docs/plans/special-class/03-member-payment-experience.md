# PHASE 3: Member Special-Class Payment Experience

## Goals
- Make it unmistakable that a special class is a separately paid, single-occurrence admission — never a class-pack redemption.
- Give members one calm, mobile-first journey from discovery to slip submission, approval, and booking.
- Make every payment and booking state recoverable after a refresh, understandable without staff help, and truthful about package-credit and refund behaviour.

## Member Journey

```text
Discover special class → View price and session details → Upload payment slip
        ↓                                              ↓
  Normal class path                              Awaiting review
 (existing pack flow)                                    ↓
                                                Approved → Book this class
                                                Rejected → Review reason / submit again
```

A special-class payment covers **one named occurrence only**. It does not create a package, reduce a package balance, or grant access to any other session.

## Experience Principles
- **Price before commitment** — show the formatted THB amount before a member starts the payment flow.
- **One clear next step** — the primary action reflects the member’s live entitlement state, rather than showing a generic Book button that can fail unexpectedly.
- **Exact-session clarity** — every payment, confirmation, and status view repeats the class name, date, time, instructor, and amount.
- **No false promises** — never imply that a package credit is used, restored, or that a bank refund was issued automatically.
- **Resilient by default** — the server remains the source of truth for approval and booking eligibility; the flow must survive reloads and returning later.

## Acceptance Criteria
- [x] **AC1 — Discovery**: Given a special occurrence appears in the schedule or search results, when a member views it, then its card and detail page show a clear “Special class” label and formatted price (for example, `฿850`).
- [x] **AC2 — Class details**: Given a member opens a special-class detail page, when they are not booked, then they see the complete session information, the exact price, and an explanation that class packs cannot be used.
- [x] **AC3 — Payment start**: Given a member has no approved admission for a special occurrence, when they use the primary action, then they enter a payment flow for that exact occurrence rather than calling the normal booking endpoint.
- [x] **AC4 — Slip submission**: Given a member uploads a valid slip and submits it, when the purchase request succeeds, then the app confirms the request is awaiting review and displays the selected class, amount, and submission status.
- [x] **AC5 — Pending state**: Given a member has a pending special-class purchase, when they revisit the class detail or payment page, then the app shows “Awaiting slip approval,” prevents duplicate unresolved submissions, and does not offer booking.
- [x] **AC6 — Rejected state**: Given an admin rejects a special-class payment, when the member revisits the relevant session, then the app shows the rejection reason when available and offers a safe path to submit a new slip.
- [x] **AC7 — Approved state**: Given a member has an approved admission for the exact special occurrence and capacity remains, when they open the class, then the primary action becomes “Book special class” and states that no package credits will be used.
- [x] **AC8 — Booking state**: Given the member has booked the special occurrence, when they return to its detail page, then they see their booking status and the normal cancellation control instead of another payment or booking action.
- [x] **AC9 — Cancellation clarity**: Given a member cancels a special-class booking, when cancellation succeeds, then capacity is released and the UI explains that the approved admission remains available to rebook the same session while it is still bookable; it must not claim that a package credit was returned.
- [x] **AC10 — Exceptional states**: Given the class is full, cancelled, or already started, when a member views it, then the app disables unavailable actions and provides a specific explanation. A cancelled paid class directs the member to studio refund support without claiming an automatic refund.
- [x] **AC11 — Normal-class regression**: Given a normal class renders anywhere in the member experience, when a member has a package, then the existing pack-covered visual treatment and booking flow remain unchanged.

## State & CTA Matrix

| Member state for this occurrence | Primary action | Supporting message |
| --- | --- | --- |
| Normal class | Existing booking CTA | Existing package policy applies. |
| Special, no purchase | `Pay to reserve · ฿…` | Special classes are not included in class packs. |
| Special, payment pending | Disabled `Awaiting slip approval` | We will notify you after staff review your payment. |
| Special, payment rejected | `Submit a new slip` | Show the recorded rejection reason when one exists. |
| Special, payment approved | `Book special class` | Your admission is approved. No package credits will be used. |
| Special, booked | `Cancel booking` | Your admission is reserved for this exact session. |
| Special, full | Disabled `Class full` | Payment does not override class capacity. |
| Special, cancelled | Disabled `Class cancelled` | Contact the studio about refund arrangements. |

## Screens & Content Requirements

### 1. Schedule card and class detail
- [ ] Add a textual special-class badge and price alongside the existing session metadata; the sparkles icon may remain decorative but cannot be the sole indicator.
- [ ] On the detail page, place a concise notice near the CTA: “This special class is purchased separately and cannot use your class pack.”
- [ ] Keep date, time, duration, instructor, remaining capacity, price, and current admission state visible without requiring navigation to another page.
- [ ] Use a single price formatter for THB so every surface displays amounts consistently.

### 2. Class-specific payment page
- [ ] Create a payment route keyed by occurrence ID, for example `/book/[occurrenceId]/pay`, so the URL itself identifies the admission being purchased.
- [ ] Fetch the occurrence and the member’s current purchase/admission state from live APIs; do not use `lib/mock/packages` to label or price the special class.
- [ ] Present a compact payment summary before upload: special-class badge, name, date/time, instructor, price, and “valid for this session only.”
- [ ] Reuse the existing private slip upload control and bank-transfer instructions.
- [ ] Disable submit while a file is uploading or a purchase request is in flight; surface retryable upload/API failures inline.
- [ ] After successful submission, replace the form with a durable pending confirmation that remains correct on refresh.

### 3. Purchase status and history
- [ ] Include special-class requests in the member’s transaction history with a distinct “Special class admission” label rather than package-specific wording.
- [ ] For each request, show the occurrence name, scheduled time, amount snapshot, status, review time, slip preview where applicable, and rejection reason where applicable.
- [ ] Link the history item back to the occurrence when it is still available; gracefully preserve history if the session was cancelled.

## Implementation Plan
- [ ] Extend `OccurrenceView`, the API wire shape, and schedule/detail data sources with `specialPriceTHB`.
- [ ] Add a member-specific admission-status field or protected eligibility endpoint that returns the state for the current member and occurrence: no request, pending, rejected (with reason), approved, or booked.
- [ ] Update `ClassCard`, the booking schedule, and `app/(shell)/book/[occurrenceId]/page.tsx` to use the state-and-CTA matrix above rather than always rendering the generic booking action.
- [ ] Create the occurrence payment route and derive all class details, price, and eligibility from APIs. The client submits only `classOccurrenceId` and the uploaded slip path; it must never send a price, approval status, or member ID.
- [ ] Reuse the authenticated purchase client and existing private storage flow, extending it to create a special-class purchase request.
- [ ] Extend transaction-history types and rendering to support both package purchases and special-class admissions without assuming every purchase has an `offer`.
- [ ] Keep normal class components on their current API and CTA path wherever possible; share only presentation helpers and discriminated purchase types to limit regression risk.
- [ ] Define reusable, server-backed status/error mapping for pending review, rejected payment, missing admission, class full, cancellation, and duplicate booking.

## UX, Accessibility & Content Quality
- [ ] Use semantic headings, descriptive control labels, and status text that does not depend on colour, imagery, or iconography alone.
- [ ] Announce upload, submission, and server failures in an accessible status/error region; keep keyboard focus on the error summary or next meaningful action.
- [ ] Maintain sufficient contrast for special-state badges and disabled actions; do not convey payment status with colour alone.
- [ ] Do not expose payment-slip URLs, another member’s entitlement, or admin-only review data in client-visible responses.
- [ ] Use plain, reassuring copy: “Awaiting slip approval” instead of technical payment status codes; “Contact the studio about refund arrangements” instead of an untrue refund guarantee.

## Verification
- [ ] Manually test the complete special-class journey on mobile and desktop: discovery, details, slip upload, pending state, rejection, resubmission, approval, booking, cancellation, and rebooking.
- [ ] Verify a member with an active 10-class pack sees the special payment flow and still has all 10 credits after booking an approved special class.
- [ ] Verify a member with no active package can submit a slip, receive approval, and book the associated special class.
- [ ] Verify an approval for one special occurrence cannot book another occurrence, and a pending/rejected request cannot book its own occurrence.
- [ ] Verify full, cancelled, and already-started special sessions show accurate disabled states without altering packages, admissions, capacity, or bookings.
- [ ] Verify normal class cards, class details, package purchases, and normal booking/cancellation flows remain unchanged.
