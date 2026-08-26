# PHASE 8: Session-restored calendar preferences

## Goal

Return members and staff to the calendar context they were using without
persisting operational or personal data.

## Acceptance criteria

- [x] Book restores visible month, selected date, and active filters per tab session.
- [x] Admin Calendar restores week/month mode and current date per tab session.
- [x] Restored admin preferences are applied before the first calendar request.
- [x] Invalid or unavailable `sessionStorage` falls back to defaults.
- [x] No roster, member, booking, token, QR, or slip data is stored.

## Storage keys

- `mjys:v1:book-preferences`
- `mjys:v1:admin-calendar-preferences`

Both keys contain navigation and filter values only.

