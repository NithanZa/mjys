# PHASE 4: Admin Scheduling, Roster & Slip Review

## Goals
- Let staff price special occurrences accurately wherever they are scheduled, edited, imported, exported, and reviewed.
- Make special-class slips and paid-admission status clear to admins without treating them as packages.

## Acceptance Criteria
- [x] AC1: Given an admin creates a special class in the calendar, when they save it, then the form requires a positive whole-THB price and submits it to the class API.
- [x] AC2: Given an admin creates or edits a normal class, when they save it, then the special price is cleared and no special payment is required.
- [x] AC3: Given an admin edits a special class, when they change its price, then newly submitted payments use the new price while existing payment requests retain their amount snapshot.
- [x] AC4: Given an admin imports or exports the class CSV/XLSX, when a row is special, then its special price round-trips; an invalid/missing special price produces a row-level validation error.
- [ ] AC5: Given an admin opens the calendar, roster, or occurrence details for a special class, when it contains approved admissions, then staff can see the special price and paid/approved attendees.
- [x] AC6: Given an admin reviews a special-class slip, when they approve or reject it, then the screen identifies it as a class admission with occurrence name, scheduled time, and amount, and never promises to activate a package.
- [ ] AC7: Given an admin cancels a special class with approved payments, when cancellation succeeds, then the UI prominently lists the members/payments requiring a manual external refund.

## Implementation Plan
- [x] Extend the calendar `Occurrence` type, create/edit form state, suggestion application, submit payloads, and occurrence cards with `specialPriceTHB`.
- [x] Require price only when `isSpecial` is selected; validate it client-side for immediate feedback and server-side as the authority. Clear it when special is deselected.
- [x] Add the price to `POST` and `PATCH /api/admin/classes` validation and persistence. Restrict price changes or show an explicit warning once pending/approved payments exist, according to the price-change policy selected in Phase 1.
- [x] Update calendar load APIs, roster data, CSV import/export headers and row validation, and XLSX output to include special prices.
- [x] Expand the slips-page purchase type and table/modal to support both targets. Use neutral labels such as `Package` and `Special class admission`; render occurrence details when no offer exists.
- [x] Adjust approval confirmation text and approval-result rendering so it describes the correct outcome for each purchase kind.
- [ ] Add filters or visual badges for special-class payments if the existing pending/approved/rejected tabs become difficult to scan.
- [x] Update member administration/history views that assume every purchase has `offer`, including safe deletion/cleanup of slip records and any revenue/analytics queries.

## Operational Policy
- [ ] Document the staff procedure for cancelling a special class: cancel the session in the app, use the resulting approved-payment list to refund externally, and retain the payment record for audit.
- [ ] Decide whether a price change is blocked once a special payment is pending. Recommended: allow it only with an explicit warning and keep all existing requests at their immutable original amount.

## Verification
- [ ] Create and edit both normal and special classes from the calendar; confirm API rejection for missing/zero/negative special price.
- [ ] Import a mixed normal/special CSV, export it, and confirm price data survives a round trip.
- [ ] Review and approve/reject both a package and special-class slip; verify only the package approval creates a `Package` row.
- [ ] Cancel a paid special class and confirm roster count resets, no general credits change, and staff receive the correct manual-refund list.
