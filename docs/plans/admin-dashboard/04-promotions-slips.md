# FEATURE: Admin Slip Approvals & Pricing Promos

## Goals
- Allow non-technical admins to review uploaded bank slips, verifying that bank transfers correspond to package purchases.
- Enable direct control over pricing, tagline, active status, and display orders of active package offers.

## Acceptance Criteria
- [ ] **AC1**: Given an admin is on `/admin/slips`, when there are pending bank transfers, then they see a queue of pending transactions with member details, package price, and date requested.
- [ ] **AC2**: Given an admin clicks a pending slip row, when the review modal opens, then they see a side-by-side view: **Customer Uploaded Bank Slip Image** next to **Required Price (THB) & Package Details**.
- [ ] **AC3**: Given an admin clicks "Approve Transfer", when confirmed, then the status transitions to `APPROVED`, a new active `Package` is provisioned for the customer, and a success notification state is triggered.
- [ ] **AC4**: Given an admin clicks "Reject Transfer", when they enter a reason (e.g., "Amount mismatch" or "Incorrect slip"), then the status transitions to `REJECTED`, notifying the customer in their LINE app transaction feed.
- [ ] **AC5**: Given an admin is on `/admin/pricing`, when they view package offers, then they can toggle any package active/inactive, change the price, or update perks, immediately reflecting on the client-facing `/promotion` page.

## Deliverables
- **Admin Pages & Components**:
  - `app/(admin)/admin/slips/page.tsx`: Listing queue of pending, approved, and rejected slips with tabbed organization.
  - `components/admin/slips/SlipReviewModal.tsx`: Visual overlay showing slip image (using zoom / pan options for readability) and action items.
  - `app/(admin)/admin/pricing/page.tsx`: Listing of packages with editable inputs, checkboxes, and inline form states.
- **Backend API Routes**:
  - `GET /api/admin/purchases/pending`: Fetch all purchases where `status = PENDING`.
  - `POST /api/admin/purchases/[id]/resolve`: Transaction endpoint that sets purchase status to `APPROVED` or `REJECTED`. If approved, inserts a new active `Package` with calculated expiration.
  - `PATCH /api/admin/packages/[id]`: Save modified configuration for `PackageOffer` records.

## Out of Scope
- Automatic image OCR reading (e.g. scanning QR payload from the bank slip to verify transaction on-bank) — staff will perform visual cross-checks.
