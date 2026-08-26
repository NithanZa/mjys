# PHASE 7: Shared purchases and balance state

## Goal

Deduplicate `/api/purchases` across Profile, Packages, payment, and class detail
while keeping remaining classes current after mutations.

## Acceptance criteria

- [x] The member shell owns one purchases/balance state.
- [x] Consumers share pending purchases, remaining classes, and next expiry.
- [x] Creating a pending purchase refreshes the shared state.
- [x] Booking and cancellation refresh the shared balance automatically.
- [x] Purchase history and balances remain memory-only and clear with the shell session.

## Implementation

- `PurchasesProvider` is mounted below `MemberProvider`.
- It waits for a registered member before fetching.
- `BookingsProvider` consumes its `refresh` function after successful mutations.

