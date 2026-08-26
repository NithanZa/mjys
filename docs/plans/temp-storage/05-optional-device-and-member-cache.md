# PHASE 5: Optional device snapshot and member profile cache

## Goals

- Only if Book + server cache are still slow on LINE (cold function, flaky network): show the last **public** schedule instantly, then revalidate.
- Deduplicate `/api/members/me` so layout + home + profile do not triple-fetch in one session.
- If persisting member/bookings on device: namespace by member id and clear on logout/reset.

## When to do this

Optional. Phases 1–2 should be enough. Do not start here.

## Acceptance criteria

- [ ] AC1: Given a device snapshot exists, when Book opens offline or before the network returns, then the last snapped window renders, then a server fetch replaces it.
- [ ] AC2: Given the member logs out, deletes account, or `reset()` runs, when storage is read, then that member’s keys are gone.
- [ ] AC3: Given keys are written, when they are named, then they include a schema version and member id (`mjys:v1:classes:{memberId}` or public `mjys:v1:classes` for schedule-only).
- [ ] AC4: Given layout, home, and profile mount together, when `useMember` runs, then `/api/members/me` is fetched at most once per session until invalidation (in-memory context or equivalent). Remaining classes after book/purchase still refresh.
- [ ] AC5: QR endpoint is never stored. Admin JWT / LINE tokens are never stored.

## Design decisions

- **Prefer in-memory** for `useMember` (React context in the shell layout) over `localStorage`. That is easier and avoids PII on disk.
- **Public schedule snapshot** may live in `localStorage` without member id (it is not PII). Size: store only the default window, not 2 years.
- **Bookings / profile on disk:** allowed per locked decision 4, but default to memory-only unless LINE reloads wipe memory too often.
- **Quota:** keep payloads small (phase 1 window). Avoid IndexedDB unless `localStorage` quota fails in practice.
- **Do not** revive `lib/profile/mock-store.ts` / `lib/mock/purchases-store.ts` as production cache.

## Implementation plan

- [ ] Lift `useMember` to a single provider in `app/(shell)/layout.tsx` (or a small `MemberProvider`) so child pages subscribe.
- [ ] Invalidate member cache on register, login, book, cancel, purchase approval polling, markCelebrated, reset, deleteAccount.
- [ ] If still needed: `sessionStorage` or `localStorage` for last `GET /api/classes` default window JSON + fetched-at timestamp; TTL ~3 minutes to match server; ignore if from/to window shape changed.
- [ ] Clear `mjys:*` keys on logout/reset.

## Files (likely)

- `app/(shell)/layout.tsx`
- `lib/profile/use-member.ts`
- `lib/api/bookings.ts` / Book page (only if snapshotting schedule)
- New `lib/cache/client-schedule.ts` only if device snapshot ships

## Verification

- [ ] Navigate Home → Book → Profile: one `members/me` in the network panel per session until a mutation.
- [ ] Logout: no leftover member name/bookings in Application → Local Storage.
- [ ] If snapshot ships: airplane mode shows last grid, then error/retry — not a hang.
- [ ] QR still rotates; nothing in storage looks like a pass token.
