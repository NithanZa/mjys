# FEATURE: Admin Portal Overview

## Goals
- Design a high-performance, tablet-friendly, secure administrative interface for non-technical desk staff of MiTR Journey Yoga Studio.
- Coordinate customer-side payment flow updates with admin-side slips verification so they function together seamlessly.
- Implement secure, password-only bypass (Security Option A) to keep access clean and fast.

## High-Level Workflow Integration
The customer and admin experiences are unified via the following data flows:

1. **Customer Purchases Package**:
   - Customer opens `/promotion` on their phone, selects a pack, and clicks "Pay".
   - They see a PromptPay QR code, make the transfer, and upload their payment slip.
   - Submitting uploads the file via `POST /api/upload` which saves it to the server `/public/uploads/slips`.
   - Creating the pending transaction saves the path in `PendingPurchase.proofImageUrl`.
2. **Admin Reviews slip**:
   - Admin logs into `/admin/login` using the secure studio passphrase (Option A).
   - In `/admin/slips`, they review pending slips. They approve valid slips, which activates the `Package` for the member.
3. **Customer Checks In On-Day**:
   - Customer opens their `/profile` to show their dynamic Member Pass QR.
   - Admin scans the QR code at the desk via `/admin/scanner` (or uses manual fallback).
   - Server decodes the token, marks their attendance `CHECKED_IN`, deducts a credit, and computes milestone unlocks!

## Directory Structure
Once implemented, the new files will reside in:
- `app/(admin)/admin/` - Route group containing:
  - `login/page.tsx` - Security Option A entry.
  - `calendar/page.tsx` - Class scheduling grid.
  - `slips/page.tsx` - Transfer slip approval queue.
  - `pricing/page.tsx` - Packages list and CMS toggle.
  - `members/page.tsx` - Directory of members and sheets.
  - `scanner/page.tsx` - Camera scanner check-in screen.
- `app/api/admin/` - Isolated administrative routes (protected by cookie-middleware):
  - `auth/...` - Session login and logout.
  - `calendar/...`, `classes/...` - Occurrence management.
  - `purchases/...` - Slip approvals backend.
  - `packages/...` - Package offer editing.
  - `members/...` - Custom adjustments.
  - `scanner/verify` - Secure QR decoding and check-in transaction.
- `app/api/upload/` - Shared endpoint for customer slip file uploading.

## Action Plan
- **Step 1**: Implement customer-side slip file upload UI & backend image saver.
- **Step 2**: Configure Security Option A (passphrase auth, cookies, and Next.js middleware).
- **Step 3**: Develop Calendar Occurrence and Scheduler pages.
- **Step 4**: Develop Package Offer controls and Slips visual Approval queue.
- **Step 5**: Build Searchable Members Directory and Custom override panels.
- **Step 6**: Install `html5-qrcode` and develop webcam-based scanner + verification transaction.
