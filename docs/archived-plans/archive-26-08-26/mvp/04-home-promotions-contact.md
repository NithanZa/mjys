# PHASE 4 — Home, promotions & contact

## Goals
- Build the marketing surfaces the user hits first (§1–3 of `user-flow.md`): the Home screen, the Promotion / packages page, and the Contact Us page.
- Introduce the **package / pass** data model so bookings in Phase 3 can later be gated on an active pass.

## Acceptance Criteria
- [x] **AC1**: Given the user opens `/`, when the screen loads, then they see the studio title, the tagline "Discover the strength and soul within your everyday journey.", a seasonal hero graphic (`bg-breath` gradient + hand-drawn illustration), a promo banner, a contact shortcut, and the bottom nav.
  - Decorative breath rings stand in for the hand-drawn illustration until art lands.
- [ ] **AC2** _(deferred to backend pass)_: Given the studio updates the seasonal hero via the CMS-lite admin route (`/admin/home` or a seeded record), when the user reopens Home, then the new graphic + copy appear without a code change.
  - Frontend reads from `lib/mock/home-content.ts`; swap to `GET /api/home-content` once the backend lands.
- [x] **AC3**: Given the user opens `/promotion`, when packages are loaded, then they see at least four cards: 10-class, 20-class, Unlimited, Walk-in single — each with price, validity, and a "Pay" CTA.
- [~] **AC4** _(QR/UX done; real PromptPay encoding deferred)_: Given the user taps "Pay" on a package, when the payment sheet opens, then a payment QR code (PromptPay or studio-uploaded image) is shown along with package summary and a "Mark as paid" button that creates a `PendingPurchase` for studio approval.
  - Frontend stub: QR encodes `MJYS-PAY:v1:<promptpayId>:<offerId>:<amount>`. Backend pass swaps to a real EMVCo PromptPay string via `promptpay-qr`.
- [~] **AC5** _(simulated; real admin approval deferred)_: Given the studio approves a `PendingPurchase`, when the next session loads, then the user has an active `Package` and their available-class balance is visible on `/profile`.
  - Frontend: dev-only "Approve this pending purchase" button on `/promotion/[offerId]/pay` simulates the studio side. `ActivePackageStrip` then renders on `/profile`.
  - Backend pass adds `/admin/purchases` (or admin API) for real approvals.
- [x] **AC6**: Given the user opens `/contact`, when the page renders, then they see the studio address, a Google Maps deep link, a tel: phone link, and a LINE OA shortcut (via `liff.openWindow`).
  - Falls back to `window.open` when LIFF is not in-client (e.g. desktop preview).

## Deliverables
- **Schema additions**:
  - `HomeContent { id (singleton), heroTitle, heroSubtitle, heroImageUrl, bannerImageUrl, bannerHref, updatedAt }`
  - `PackageOffer { id, name, type (CLASSES_10 | CLASSES_20 | UNLIMITED | WALK_IN), priceTHB, classCount?, validityDays, active, sortOrder }`
  - `PendingPurchase { id, memberId, packageOfferId, proofImageUrl?, status (PENDING | APPROVED | REJECTED), createdAt, reviewedAt? }`
  - `Package { id, memberId, packageOfferId, classesRemaining, expiresAt, status (ACTIVE | EXPIRED | EXHAUSTED) }`
- `app/page.tsx` — Home screen (replaces placeholder from Phase 1).
- `app/promotion/page.tsx`, `app/promotion/[offerId]/pay/page.tsx` — listing + payment sheet.
- `app/contact/page.tsx` — contact + map + phone + LINE OA.
- `components/home/` — `HeroCard`, `PromoBanner`, `ContactShortcut`.
- `components/promotion/` — `PackageCard`, `PaymentSheet`, `ActivePackageStrip`.
- `app/api/packages/route.ts` (`GET` active offers), `app/api/purchases/route.ts` (`POST` pending, `PATCH /:id` approve).
- `lib/payments/promptpay.ts` — generate PromptPay QR string (if used).

## Out of scope
- Real online payment gateway integration (Stripe/Omise) — out of MVP. The flow is manual approval.
- Refund / cancellation handling — post-MVP.

## Frontend-only scope (this pass)
This pass landed the **frontend** half of Phase 4. Mock data:
- `lib/mock/home-content.ts` — hero copy, promo banner, contact details (single-record stand-in for the planned `HomeContent` singleton).
- `lib/mock/packages.ts` — 4 `PackageOffer` records.
- `lib/mock/purchases-store.ts` — combined `PendingPurchase` + `Package` localStorage store, with `createPending` / `approvePending` / `rejectPending` matching the planned API verbs.

Deferred to a later **backend pass**:
- Schema additions: `HomeContent`, `PackageOffer`, `PendingPurchase`, `Package`.
- `app/api/packages/route.ts` (`GET` active offers) and `app/api/purchases/route.ts` (`POST` pending, `PATCH` approve/reject).
- `lib/payments/promptpay.ts` — real EMVCo PromptPay QR via `promptpay-qr`.
- An admin route (`/admin/purchases`) for real studio approvals.
- Optional CMS-lite admin (`/admin/home`) for seasonal updates.

**Migration path**:
1. Add the four models to `prisma/schema.prisma`, migrate.
2. Seed offers from `PACKAGE_OFFERS`. Seed `HomeContent` from `HOME_CONTENT`.
3. Replace `usePurchases.createPending` with a `POST /api/purchases` mutation.
4. Replace dev `approvePending` button with the real admin route.
5. Swap the QR payload generator with a real PromptPay encoder.

## Dependencies
- `promptpay-qr` (or equivalent), `next/image`, an admin role check shared with Phase 2's ID token verify.

## Verification
- Manual: buy a 10-class pack → studio approves → `/profile` shows "10 classes left, expires in 60 days".
- Booking a class in Phase 3 still works even without a pass (pass enforcement is wired in Phase 5).
