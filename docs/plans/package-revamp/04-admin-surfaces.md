# PHASE 4: Admin — Edit Remaining Classes, Grant Still Adds

## Goals

- Staff treat a member as “N classes left”, and can change that number in place.
- Granting a catalog offer still exists: it adds a new dated lot (studio sale / gift), it does not replace remaining classes.
- Pricing, dashboard, and member stats stop talking about unlimited and “active packages” as the member’s status.

## Acceptance criteria

- [ ] AC1: Given a member detail sheet, when it loads, then the headline number is pooled unexpired remaining classes, and each lot is listed with remaining + expiry (not “Active Packages & Passes” as the only model).
- [ ] AC2: Given staff set remaining classes to a new integer `N >= 0`, when they save, then usable lots are adjusted so the pooled total becomes `N` (see adjustment rules). No new catalog offer is required.
- [ ] AC3: Given staff grant a catalog offer, when it succeeds, then a new lot is created with that offer’s `classCount` and `expiresAt = now + validityDays`, and pooled remaining increases by `classCount`.
- [ ] AC4: Given staff edit a single lot’s remaining or expiry, when they save, then only that lot changes and pooled remaining recalculates.
- [ ] AC5: Given Pricing, when creating or editing an offer, then type cannot be unlimited and `classCount` is required and `>= 1`.
- [ ] AC6: Given the admin home dashboard, when it renders the former “Active Member Packages” tile, then it counts **members with remaining classes > 0** (unexpired), not the number of `status: ACTIVE` rows.
- [ ] AC7: Given member stats, when “classes left on the table” is computed, then it sums `classesRemaining` on lots with `expiresAt < now` and remaining > 0, regardless of whether `status` was flipped to `EXPIRED`.

## Design decisions

### Pooled remaining editor (primary)

Staff should be able to type the new total without picking a lot. Apply a **delta** to existing usable lots:

- **Increase:** add the delta to the soonest-expiring usable lot. If there is no usable lot, **reject** and require Grant (so the new classes get a real `expiresAt` from an offer). Do not silently create a lot with a guessed validity.
- **Decrease:** subtract FIFO from soonest-expiring usable lots (same order as booking). Lots that hit 0 become `EXHAUSTED`. Do not change expired lots. Do not go below 0.
- **Idempotent set-to-N:** `delta = N - currentPooled`. Then apply increase/decrease.

This matches “just updating the number of classes they have left” without inventing expiry dates.

### Per-lot editor (secondary)

Lots still matter because expiry dates differ. Staff can:

- Change `classesRemaining` on one lot (`>= 0`).
- Change `expiresAt` on one lot (extend / shorten).
- Not delete lots in v1 (avoid punching holes in `consumedPackageId` history). Exhaust by setting remaining to 0 instead.

### Grant / bulk grant

Keep `POST /api/admin/members/[id]` grant and `POST /api/admin/members/bulk-grant`. Copy should say they **add** remaining classes, not “provision an active package”. Reject grants of offers with invalid `classCount`.

### Pricing

Remove the Unlimited option from `app/(admin)/admin/pricing/page.tsx` and from `validTypes` in package admin APIs (Phase 1 may already have done the API side).

## Implementation plan

- [ ] Add `PATCH /api/admin/members/[id]/remaining` (or a clearly named equivalent) body `{ remainingClasses: number }`. Use the helper inside a transaction.
- [ ] Add `PATCH /api/admin/members/[id]/packages/[packageId]` body `{ classesRemaining?: number; expiresAt?: string }`. Verify the lot belongs to that member. Sync `status` via the helper.
- [ ] Extend `GET /api/admin/members/[id]` to include `remainingClasses` (pooled) alongside the lots array.
- [ ] Update `components/admin/MembersDirectoryTab.tsx`:
  - Headline remaining classes + edit control.
  - Lot list with remaining, expiry, status, per-lot edit.
  - Rename grant CTA copy (“Add classes from an offer” / keep “Grant” if shorter, but subcopy must say it adds).
  - Empty state: “0 classes left”, not “No active packages or passes.”
- [ ] Update bulk-grant modal copy similarly.
- [ ] Pricing form: drop unlimited; require class count always.
- [ ] `app/(admin)/admin/page.tsx`: count members who have at least one usable lot.
- [ ] `app/api/admin/members/stats/route.ts`: expiring-this-month and classes-left-on-table use `expiresAt` + remaining, not `status: EXPIRED` alone.
- [ ] List/directory risk badges that key off “expiring pack” should use soonest usable lot expiry, not a single active row if the tab currently does that.

## Files

- `app/api/admin/members/[id]/route.ts`
- `app/api/admin/members/[id]/remaining/route.ts` (new, if not folded into `[id]`)
- `app/api/admin/members/[id]/packages/[packageId]/route.ts` (new)
- `app/api/admin/members/bulk-grant/route.ts`
- `app/api/admin/members/stats/route.ts`
- `app/api/admin/packages/route.ts` / `[id]/route.ts` (if anything remains after Phase 1)
- `components/admin/MembersDirectoryTab.tsx`
- `app/(admin)/admin/pricing/page.tsx`
- `app/(admin)/admin/page.tsx`

## Verification

- [ ] Member with 2 + 5 remaining: headline 7. Set to 10 → soonest lot becomes 5 (2+3) or equivalent FIFO add; still two lots.
- [ ] Set to 4 → FIFO remove 3 from soonest lots; exhausted lots show 0.
- [ ] Set to 10 on a member with 0 usable lots → error asking to grant an offer.
- [ ] Grant 5-class offer → remaining +5, new expiry from validity days.
- [ ] Per-lot remaining 0 → lot exhausted; headline drops.
- [ ] Pricing cannot save unlimited.
- [ ] Dashboard tile matches a manual count of members with remaining classes.
- [ ] Stats “left on the table” includes time-expired lots that still have remaining even if status is still `ACTIVE`.
