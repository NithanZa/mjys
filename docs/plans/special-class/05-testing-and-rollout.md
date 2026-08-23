# PHASE 5: Testing & Rollout

## Goals
- Verify the distinction between pack credits and paid special-class admission from database transaction through staff approval and member booking.
- Deploy the schema and application changes without breaking historical package sales, upcoming schedules, or attendance check-in.

## Acceptance Criteria
- [ ] AC1: Given automated tests run, when a special booking succeeds, then no `Package.classesRemaining` value changes.
- [ ] AC2: Given automated tests run, when a member lacks an approved matching special purchase, then booking is rejected even if the member owns an active 5/10/20/unlimited package.
- [ ] AC3: Given an approved package purchase, when staff review it, then it still creates exactly one package with the correct balance and expiry.
- [ ] AC4: Given an approved special-class purchase, when staff review it, then it creates no package and permits booking only for the linked occurrence.
- [ ] AC5: Given a special class is cancelled, when paid members exist, then active bookings are cancelled without a package balance mutation and an admin-visible manual-refund list is available.
- [ ] AC6: Given the production migration and deployment complete, when members view ordinary classes and historical transactions, then current schedule, package, purchase, profile, and scanner flows continue to work.

## Automated Verification
- [ ] Add unit tests for purchase-target validation, price validation, and purchase-kind routing.
- [ ] Add API/transaction tests for create, duplicate prevention, approve, reject, normal booking, special booking, cancellation, and special-class cancellation.
- [ ] Add component or browser tests for price display, status-specific call-to-action rendering, slip submission, and admin review labels.
- [x] Run the repository's lint, type-check, test, build, and Prisma validation/generation commands; record any project-specific commands discovered during implementation.

## Manual Smoke Test
- [ ] Create a regular class and a priced special class in admin calendar; verify only the latter requires a price.
- [ ] As a member with an active 10-class package, submit a special-class slip, have admin approve it, book the class, and confirm the package remains at 10 credits.
- [ ] As a member with no package, repeat the approved special-class booking and verify it succeeds.
- [ ] Attempt to book before approval, after rejection, and with an approval for another special class; verify each fails without changing capacity or balances.
- [ ] Cancel and rebook an approved special class; verify the same admission works while capacity changes correctly.
- [ ] Cancel a booked special class as an admin; verify the roster resets and the slip screen/admin report identifies every approved payment for refund follow-up.
- [ ] Scan a booked special-class member on the session date; verify normal attendance check-in and milestones work.
- [ ] Confirm package purchase, approval, profile transaction history, and normal-class booking remain unchanged.

## Rollout Notes
- [ ] Back up the production database and inspect generated migration SQL before applying the schema migration.
- [ ] Deploy the database migration before application code that requires the new fields and relations; regenerate Prisma Client in the deployment build.
- [ ] Keep existing special occurrences unpriced during migration. They must be explicitly priced in admin before member payment/booking is enabled; do not silently expose them as free or package-covered.
- [ ] Train staff on the new slip labels and the manual external-refund process for cancelled paid classes.
- [ ] Monitor pending special payment volume, approval errors, rejected booking attempts, and any unexpected package-balance changes immediately after release.
- [ ] Update this checklist by ticking boxes as each item is completed during implementation and rollout.
