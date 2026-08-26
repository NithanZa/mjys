# PHASE 3: Admin UI — Staff Directory Page

## Goals
- Build `/admin/staff`: a page where admins can view all staff, add new staff, edit existing staff (including avatar), and delete staff.
- Wire it into the admin sidebar navigation.

## Acceptance Criteria
- [ ] AC1: Given an admin visits `/admin/staff`, when the page loads, then they see a grid/list of staff cards (or table rows) showing avatar (or `Avatar` fallback initials), name, title, and order — sorted by `order`.
- [ ] AC2: Given an admin clicks "Add Staff", when the `Sheet` opens, then they can fill in Name, Title, Bio, Initials, Order, and optionally upload an avatar image (drag/drop or file picker, with a live preview), then submit to create the record via `POST /api/admin/staff`.
- [ ] AC3: Given an admin clicks an existing staff card/row, when the edit `Sheet` opens pre-filled with current values, then they can change any field (including replacing the avatar) and save via `PATCH /api/admin/staff/[id]`.
- [ ] AC4: Given an admin clicks "Delete" on a staff member, when a `Modal` confirmation appears, then confirming calls `DELETE /api/admin/staff/[id]`; if the API returns `409` (has scheduled classes), show a warning with the occurrence count and a "Delete Anyway" option that retries with `?confirm=true`.
- [ ] AC5: Given an admin uploads an avatar file, when the upload completes, then the returned public URL is set as the form's `photoUrl` and shown in the live preview before the record is saved.
- [ ] AC6: Given the staff list changes (add/edit/delete), when the operation succeeds, then the list refreshes without a full page reload.
- [ ] AC7: The new nav item "Staff Directory" (icon: `UserCog` or similar from `lucide-react`) appears in `app/(admin)/admin/layout.tsx`'s `navigation` array, linking to `/admin/staff`, active-state styled consistently with the other links.

## Deliverables
- **`app/(admin)/admin/staff/page.tsx`**: client component — fetch list on mount (`GET /api/admin/staff`), grid of cards using `Card`/`Avatar`/`Badge`/`Button` from `components/ui`, "Add Staff" button opening a `Sheet` form, click-through to edit `Sheet`, delete `Modal` confirmation. Follow the state/patterns established in `app/(admin)/admin/members/page.tsx` (loading states, sheets, modals, `alert()`-based error surfacing for parity with existing admin pages).
- **`app/(admin)/admin/layout.tsx`**: add the "Staff Directory" entry to the `navigation` array (both desktop and mobile share the same array, so a single edit covers both).

## UI Notes
- Avatar upload: a simple `<input type="file" accept="image/jpeg,image/png,image/webp">` that immediately POSTs to `/api/admin/staff/upload-avatar` on selection (via `FormData`), disables the field while uploading, and shows the returned URL in an `<img>` preview (or the `Avatar` component's `src` prop if it supports one — verify `components/ui/Avatar.tsx` supports an image `src`, else render a plain `<img>` with matching rounded styling).
- Order field: plain number input; consider auto-suggesting the current max+1 as a placeholder when adding.
- Reuse `Input`, `Sheet`, `Modal`, `Button`, `Badge` from `components/ui` — no new design-system primitives should be needed.

## Out of Scope
- Drag-to-reorder UI (order is a plain numeric field for now).
