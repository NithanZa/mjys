# FEATURE: Admin On-Day QR Code Check-In

## Goals
- Allow desk staff to scan a customer's short-lived Member Pass QR code at the door using a camera-enabled device (tablet, phone, or laptop).
- Automatically check members into their scheduled class, decrementing their package credits, and tracking milestone unlocks.

## Acceptance Criteria
- [ ] **AC1**: Given an admin is on `/admin/scanner`, when the page loads, then they see a live camera scanning viewfinder.
- [ ] **AC2**: Given an admin scans a customer's Member Pass QR, when the token is received, then it is sent to the server for verification.
- [ ] **AC3**: Given a valid unscanned QR code, when verified by the server, then it matches the customer to their booking for today, completes the check-in, increments their attendance, and plays a success sound and overlay.
- [ ] **AC4**: Given an invalid or expired QR code (more than 60 seconds old), when scanned, then the scanner shows a prominent "Invalid or Expired Token" red alert.
- [ ] **AC5**: Given the camera is unavailable or scanning is slow, when staff needs to check a customer in, then they can use the **Manual Phone Search fallback input** to key in details and trigger check-in instantly.

## Deliverables
- **Admin Pages & Components**:
  - `app/(admin)/admin/scanner/page.tsx`: Full-screen or boxed camera scanner window.
  - Integration with `html5-qrcode` (web-based scanning with camera selector).
  - Sound effects for success/error (gentle beeps).
  - Manual check-in override panel (phone number or name autocomplete).
- **Backend API Routes**:
  - `POST /api/admin/scanner/verify`:
    - Decodes JWT using `decodeMemberPassSecure` from `@/lib/qr.ts:98-117`.
    - Looks up member's `Attendance` for any class occurring today.
    - If found:
      - Sets status to `CHECKED_IN` and `checkedInAt = now()`.
      - Increments `classesAttended` in `Member`.
      - Deducts 1 credit from active `Package` (if not unlimited).
      - Executes Milestone progression rules (Cat -> Tiger -> Leopard) and rewards (Toy parts).
      - Returns booking, class, and member metadata.

## Dependencies
- `html5-qrcode` npm package (client-side scanner)
- Local speaker capability (for beep notifications)
