# PHASE 3: Member Status — “N Classes Left”

## Goals

- Every member-facing status uses the pooled unexpired remaining-classes number.
- Buying stays available even when remaining classes > 0.
- Expiry messaging is about remaining classes that will lapse, not about an “active pack”.

## Acceptance criteria

- [ ] AC1: Given a member with 3 remaining on a lot expiring in 10 days and 5 remaining on a lot expiring in 60 days, when they open Packages, then the status reads **8 classes left** (not the 5-class or 10-class offer name as the headline).
- [ ] AC2: Given a member with 0 remaining classes, when they open Packages, then the status reads **0 classes left** (or equivalent empty copy) and catalog cards remain purchasable.
- [ ] AC3: Given `GET /api/purchases`, when the member has several lots, then the payload includes pooled `remainingClasses` and enough lot/purchase data for history — it does **not** require clients to pick a single `activePackage`.
- [ ] AC4: Given remaining classes that expire within 7 days, when the member opens Profile, then the banner states how many of those classes expire on that date. If remaining classes expire later than 7 days, the banner is hidden.
- [ ] AC5: Given a member with 0 remaining classes on a normal class detail page, when the class is not full and not already booked, then Book is disabled (or replaced) with a path to `/promotion`. Special classes unchanged.
- [ ] AC6: Given transaction history, when purchases are listed, then each row remains one payment/grant (pending/approved/rejected, and exhausted/expired where relevant). History is not collapsed into one pack.

## Design decisions

- **Headline copy:** “N classes left” / “1 class left” / “0 classes left”. Do not say “Active pack”, “No active pack”, or “Unlimited classes”.
- **Soonest expiry is secondary.** On Packages, if remaining > 0, a caption may read “N expire on {date}” only for the soonest lot (or “all expire on {date}” if a single lot). Do not show the offer name as if it were the current membership.
- **Profile banner:** Trigger on the soonest lot with remaining > 0 whose `expiresAt` is within 7 days. Copy talks about those remaining classes, not the offer name as a pack identity. Using the offer name once in the sentence is optional; the number and date are required.
- **Hook shape:** Replace `ActivePackageView` / `activePackage` with something like:

  ```ts
  remainingClasses: number;
  nextExpiry: { classesRemaining: number; expiresAt: Date } | null;
  ```

  Keep `purchases` / `pendingPurchases` for history and slip state.
- **API shape:** `GET /api/purchases` should return `remainingClasses` computed by the Phase 1 helper. Existing `activePackages` array can remain as `packages` (all lots) for history mapping, but clients must not `sort[0]` to invent an active pack. Prefer renaming in the same PR to avoid leftover field names.
- **Mocks:** `lib/mock/purchases-store.ts` must compute the same pooled number (and filter expired lots). Today the mock is expiry-aware and the live hook is not — both must match the helper rules.
- **Rename component:** `ActivePackageStrip` → a remaining-classes card (e.g. `RemainingClassesStrip`). Update `components/promotion/index.ts`.
- **Catalog:** `PackageCard` “Pay” stays enabled regardless of remaining classes. Remove `UNLIMITED` from `PackageOffer.type`.

## Implementation plan

- [ ] Change `GET` `app/api/purchases/route.ts` to compute `remainingClasses` + `nextExpiry` from usable lots; return lots without implying a single active row.
- [ ] Rewrite `lib/api/purchases.ts` (`usePurchases`) accordingly; delete `ActivePackageView` or stop exporting it.
- [ ] Replace `components/promotion/ActivePackageStrip.tsx` and all imports (`app/(shell)/promotion/page.tsx`).
- [ ] Update `components/profile/PackageAlertBanner.tsx` and `app/(shell)/profile/page.tsx`.
- [ ] Wire book UI (Phase 2 leftover): pass `remainingClasses` into class detail / book button for normal classes.
- [ ] Update `TransactionHistory` status labels if needed (`EXHAUSTED` / `EXPIRED` on lots vs slip `APPROVED`). Do not show “Approved” as if the lot were the current pack.
- [ ] Sweep copy: grep `active pack`, `Active pack`, `No active pack`, `isUnlimited`, `activePackage`.

## Files

- `app/api/purchases/route.ts`
- `lib/api/purchases.ts`
- `lib/api/packages.ts`
- `lib/mock/purchases-store.ts`
- `components/promotion/ActivePackageStrip.tsx` (rename)
- `components/promotion/index.ts`
- `components/promotion/TransactionHistory.tsx`
- `components/profile/PackageAlertBanner.tsx`
- `app/(shell)/promotion/page.tsx`
- `app/(shell)/profile/page.tsx`
- `app/(shell)/book/[occurrenceId]/page.tsx`
- `components/booking/*` as needed

## Copy notes (member-facing)

| Situation | Packages status | Profile banner |
|---|---|---|
| 12 left, soonest 4 expire in 20 days | 12 classes left · 4 expire on {date} | hidden |
| 4 left, all expire in 5 days | 4 classes left · expire on {date} | 4 classes expire on {date} |
| 0 left | 0 classes left · buy a pack to book | hidden |

Exact strings can follow existing `font-display` / `font-sans` patterns; keep tone consistent with current Packages empty state, without the “Grab a 10-class pack to start your journey” implication that they cannot buy other sizes.

## Verification

- [ ] Member with two lots: Packages shows the sum; buying another offer is still on the page.
- [ ] Member with only expired lots: 0 classes left; Book on a normal class is blocked; special-class pay path still works.
- [ ] Profile banner appears only when the soonest remaining lot is within 7 days, and the number matches that lot (not the pooled total, if later lots expire later).
- [ ] Standalone mock mode matches live remaining-classes rules (expired lots excluded).
