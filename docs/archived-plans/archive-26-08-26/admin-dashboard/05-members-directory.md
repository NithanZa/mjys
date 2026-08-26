# FEATURE: Admin Members & Class Directories

## Goals
- Provide studio staff with a searchable directory of registered members and details on active packages and attendance history.
- Enable staff to make manual customer service corrections, such as granting a manual package or overriding class credits.

## Acceptance Criteria
- [ ] **AC1**: Given an admin is on `/admin/members`, when the directory loads, then they see a table of members, listing Name, LINE Name, Phone, Email, Tier Level, and Total Classes Attended.
- [ ] **AC2**: Given an admin enters a query in the search bar, when they search, then the list dynamically filters by name, phone, or email.
- [ ] **AC3**: Given an admin clicks a member row, when the details sheet slides out, then they see:
  - Active packages details (credits left, expiration date).
  - Attendance history log (Checked-in, Booked, Cancelled, No-Show).
  - Milestone unlock progression (Toys collected).
- [ ] **AC4**: Given an admin wants to manually credit a member, when they click "Grant Manual Package", then they can select a package and issue it directly to the customer.

## Deliverables
- **Admin Pages & Components**:
  - `app/(admin)/admin/members/page.tsx`: Members table featuring client-side or server-side pagination, searching, and filtering.
  - `components/admin/members/MemberDetailSheet.tsx`: Sliding panel to display deep-dive data for a single member.
  - `components/admin/members/ManualGrantModal.tsx`: Popup form to allocate packages or adjust points manually.
- **Backend API Routes**:
  - `GET /api/admin/members`: Fetches members with query parameters for matching.
  - `GET /api/admin/members/[id]`: Detailed query resolving package balances and past history.
  - `POST /api/admin/members/[id]/packages`: Force create a `Package` for a customer without requiring a pending slip.

## Out of Scope
- Deleting member profiles (for audit logs and line history integrity, members are deactivated, never completely removed).
