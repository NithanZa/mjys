# PHASE 6: Shared bookings state

## Goal

Keep one authenticated bookings request and one mutation state for the entire
member shell, including Book and class detail routes.

## Acceptance criteria

- [x] `/api/bookings` is fetched once when the authenticated member becomes available.
- [x] Book and class detail subscribe to the same booking state.
- [x] Booking or cancellation refreshes bookings and the member's package balance.
- [x] No bookings, member data, or auth tokens are persisted to device storage.

## Implementation

- `BookingsProvider` owns the existing booking state and API mutations.
- It is mounted once in `app/(shell)/layout.tsx`, below member and purchase providers.
- `useBookings` reads the provider and fails clearly if used outside the shell.

