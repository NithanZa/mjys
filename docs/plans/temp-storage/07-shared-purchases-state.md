# PHASE 7: Shared purchases state

## Goal

Deduplicate `/api/purchases` across Profile, Packages, payment, and class detail
while keeping package state current after mutations.

## Acceptance criteria

- [x] The member shell owns one purchases/package state.
- [x] Consumers share pending purchases and the active package.
- [x] Creating a pending purchase refreshes shared state.
- [x] Booking and cancellation refresh shared package state automatically.
- [x] Purchase history remains memory-only and clears with the shell session.

## Implementation

- `PurchasesProvider` is mounted below `MemberProvider`.
- It waits for a registered member before fetching.
- Overlapping requests are sequenced by member and request id.
