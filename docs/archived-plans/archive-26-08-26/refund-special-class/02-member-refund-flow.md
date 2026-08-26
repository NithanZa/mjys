# PHASE 2: Member Cancellation Contact Flow

## Goals
- Replace the self-cancel action for a paid special-class booking with a calm, clear pop-up that directs the member to Contact Us.
- Make the policy consistent on every member surface that exposes booking cancellation.

## Member Flow

```text
Booked paid special class
        ↓
Member selects “Booked — Cancel”
        ↓
Cancellation contact pop-up
        ├── “Contact the studio” → /contact
        └── “Keep my booking” / close → booking remains unchanged
```

## Acceptance Criteria
- [x] AC1: Given a member has a booked, paid special class, when they press its cancellation action in a class card, then a pop-up opens instead of sending a DELETE request.
- [x] AC2: Given a member has a booked, paid special class, when they press its cancellation action on the class-detail page, then the same pop-up opens instead of sending a DELETE request.
- [x] AC3: Given the pop-up opens, when it renders, then it names the class and explains: the spot is already reserved, payment/refund changes must be arranged with the studio, and the current booking remains active.
- [x] AC4: Given the member chooses `Contact the studio`, when navigation completes, then `/contact` opens in the current app context.
- [x] AC5: Given the member chooses `Keep my booking`, closes the modal, or presses Escape, when the modal closes, then no cancellation request has been sent.
- [x] AC6: Given a member’s special-class payment is pending/rejected and no attendance exists, when they view the class, then this cancellation modal is never shown because there is no booking to cancel.
- [x] AC7: Given a normal booked class, when the member selects its cancellation action, then the current cancellation request and feedback continue unchanged.

## Implementation Plan
- [x] Extend booking view data, or add a lightweight member eligibility lookup, so `ClassCard` and the detail page can identify a *booked paid special class* rather than relying on `isSpecial` alone.
- [x] Add a reusable `PaidSpecialClassContactModal` component using the existing `Modal`, `Button`, and booking design tokens.
- [x] Pass a contact-request handler to booking controls; intercept cancellation only for booked paid special classes.
- [x] Set the primary CTA to `/contact` and a secondary `Keep my booking` action to close the modal.
- [x] Make copy concise and unambiguous. Recommended content:
  - Title: `Need to change your special-class booking?`
  - Body: `Your spot is already reserved. Please contact the studio to discuss cancellation, transfer, or refund options. Your booking will stay active until the studio confirms a change.`
  - Primary CTA: `Contact the studio`
  - Secondary CTA: `Keep my booking`
- [x] Preserve keyboard accessibility: focusable buttons, Escape dismissal, and no destructive action as the default.

## UI States
| Booking type | Member action | Result |
| --- | --- | --- |
| Paid special class, booked | `Booked — Cancel` | Open contact pop-up; do not call cancellation API. |
| Normal class, booked | `Booked — Cancel` | Existing self-cancellation flow. |
| Special class, payment pending | No booked state | Show approval status; no cancellation control. |
| Special class, payment rejected | No booked state | Show resubmission path; no cancellation control. |

## Verification
- [ ] Test card and detail-page actions at mobile and desktop breakpoints.
- [ ] Confirm dismissing the modal makes no network request and retains the booked UI state.
- [ ] Confirm the Contact Us action routes to `/contact` and normal-class cancellation still calls the existing endpoint.
