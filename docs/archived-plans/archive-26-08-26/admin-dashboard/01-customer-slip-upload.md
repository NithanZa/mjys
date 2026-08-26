# FEATURE: Customer Slip Upload Flow

## Goals
- Transition the customer payment process from manual external messaging (LINE OA) to a self-contained upload flow directly within the application.
- Enable members to upload their bank transfer slip proof, which saves to the server, so admins can visually approve/reject purchases directly from the Admin Portal.

## Acceptance Criteria
- [ ] **AC1**: Given a member is on the package payment screen `/promotion/[offerId]/pay`, when they scan the PromptPay QR and complete the bank transfer, then they see a file upload area to submit their payment slip.
- [ ] **AC2**: Given the member selects a slip image, when the file is selected, then the UI displays a clean image preview of the slip and an "Edit/Remove" option before submitting.
- [ ] **AC3**: Given a member clicks "Submit Slip & Request Approval", when the upload starts, then they see a loading spinner. Once completed, they are redirected to the "Waiting for approval" state and their slip is successfully saved to the database.
- [ ] **AC4**: Given a member has a pending purchase, when they view their transaction history, then they can see their uploaded slip image preview and status (`PENDING`).
- [ ] **AC5**: Given the API receives a slip upload, when validated as a valid image file, then it is securely written to server storage (local public folder `/public/uploads/slips` or cloud bucket) and saved in `PendingPurchase.proofImageUrl`.

## Deliverables
- **API Endpoints**:
  - `POST /api/upload`: Receives form-data with the image file, validates file type and size, writes the file to `/public/uploads/slips`, and returns the static public URL (e.g., `/uploads/slips/slip_abc123.jpg`).
- **Client Pages & Components**:
  - Update `@/app/(shell)/promotion/[offerId]/pay/page.tsx`:
    - Replace the text-only instructions with an interactive file upload component.
    - Connect the upload component to `POST /api/upload` before triggering `POST /api/purchases`.
    - Provide clear status states (No slip -> Uploading -> Previewing -> Submitted).
  - Update `usePurchases` hook in `@/lib/mock/purchases-store.ts` and actual API caller to accept `proofImageUrl` inside the payload.
- **Backend API Update**:
  - Update `POST /api/purchases`: Accept `proofImageUrl` in the request body and save it into the `PendingPurchase` model.

## Out of Scope
- Direct banking API verification (matching transaction IDs with bank hooks) — validation will remain a manual visual verification by non-technical studio staff.
