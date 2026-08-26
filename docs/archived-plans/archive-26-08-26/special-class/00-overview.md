# FEATURE: Separate Paid Special-Class Admission

## Goals
- Let each special class set its own THB price and require a member to submit a payment slip for that exact occurrence.
- Ensure 5-, 10-, 20-class, unlimited, and walk-in package credits can never pay for or be consumed by a special class.
- Reuse the existing member slip-upload and staff approval workflow while retaining an auditable, per-class payment record.

## Acceptance Criteria
- [x] AC1: Given an admin marks an occurrence as special, when they save it, then a positive special-class price in THB is required and stored with that occurrence.
- [x] AC2: Given an occurrence is not special, when it is created, edited, or imported, then it has no special-class price and continues to use the normal booking policy.
- [x] AC3: Given a member views a special class, when they are not approved for it, then they see its price and can submit a slip for that specific occurrence instead of booking it.
- [x] AC4: Given a special-class slip is approved, when the member books that exact occurrence, then the booking succeeds without decrementing any package credit.
- [x] AC5: Given a member has a normal package but no approved special-class admission, when they try to book a special class, then the request is rejected and package balances are unchanged.
- [x] AC6: Given a special-class payment is pending, rejected, tied to another occurrence, or for a cancelled class, when the member tries to book, then the request is rejected with an actionable message.
- [x] AC7: Given staff review a slip, when it is for a special class, then the admin view identifies the occurrence, scheduled time, and amount; approval creates no `Package` record.
- [x] AC8: Given a special class is cancelled, when it has paid or booked members, then attendances are cancelled, package credits are not adjusted for those attendances, and staff can identify every approved payment that needs an external refund.

## Design Decisions
- A special class is an individual paid admission, not a `PackageOffer` and not a new package type.
- `ClassOccurrence.specialPriceTHB` is nullable; it is required and positive exactly when `isSpecial` is true.
- Keep `PendingPurchase` as the slip-review ledger, adding a purchase target/kind that is either a package offer or a specific special occurrence. The API will enforce exactly one target even though Prisma cannot express that cross-field constraint directly.
- Snapshot the requested amount on each pending purchase so later changes to a package or occurrence price do not rewrite historical payment records.
- An approved special-class purchase is the member's entitlement. It is valid only for its linked occurrence, creates no credit package, and is reusable if the member cancels their booking and later rebooks before the session starts.
- Payment remains slip approval only. There is no self-serve card payment and no staff "paid at studio" shortcut in this scope.

## Deliverables
- **Phase 1** (`01-schema-and-migration.md`): Add per-occurrence pricing and purchase targeting, migrate existing data, and regenerate Prisma types.
- **Phase 2** (`02-api-and-booking-enforcement.md`): Create and approve special-class purchases; enforce separate booking, cancellation, and class-cancellation behavior.
- **Phase 3** (`03-member-payment-experience.md`): Add special-class pricing, payment-slip submission, and approved/pending/rejected states to member booking surfaces.
- **Phase 4** (`04-admin-scheduling-and-slips.md`): Add special pricing to admin class management, import/export, rosters, and the existing slip-review screen.
- **Phase 5** (`05-testing-and-rollout.md`): Add automated coverage, perform end-to-end checks, and roll out safely.

## Out of Scope
- Online card, PromptPay, or automatic payment verification.
- Discount codes, early-bird pricing, tiers, group purchases, or partial payments.
- Automatic bank refunds. Cancellation only records the operational refund work staff must complete outside the application.
- Redesigning general-class pack eligibility or introducing paid walk-ins beyond existing behavior.
