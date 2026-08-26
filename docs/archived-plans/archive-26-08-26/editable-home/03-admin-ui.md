# PHASE 3: Admin UI — Home Banners Page

## Goals
- Build `/admin/banners`: admins can view all banners, add new ones (with cropped image upload), edit existing ones, toggle active/inactive, reorder via `sortOrder`, and delete.
- Wire it into the admin sidebar navigation.

## Acceptance Criteria
- [ ] AC1: Given an admin visits `/admin/banners`, when the page loads, then they see a list/grid of banner cards showing image thumbnail, title, eyebrow, href, `sortOrder`, and an active/inactive `Badge` — sorted by `sortOrder`.
- [ ] AC2: Given an admin clicks "Add Banner", when the `Sheet` opens, then they can fill in Title, Eyebrow (optional), Href, Sort Order, toggle Active, and upload an image; submitting calls `POST /api/admin/home-banners`.
- [ ] AC3: Given an admin clicks an existing banner, when the edit `Sheet` opens pre-filled, then they can change any field (including replacing the image) and save via `PATCH /api/admin/home-banners/[id]`.
- [ ] AC4: Given an admin clicks "Delete" on a banner, when a `Modal` confirmation appears, then confirming calls `DELETE /api/admin/home-banners/[id]` and the list refreshes.
- [ ] AC5: Given an admin selects an image file, when the file is chosen, then the UI opens a lightweight center-crop step constrained to a 3:2 aspect ratio (canvas-based, no new npm dependency — draw the source image onto a `<canvas>` sized to the largest centered 3:2 crop, then export via `canvas.toBlob`) before uploading the resulting blob to `POST /api/admin/home-banners/upload`; the returned URL populates the form's `imageUrl` with a live 3:2 preview matching `TigerPromoCard`'s `aspect-[3/2]` box.
- [ ] AC6: Given an admin toggles the "Active" switch on a banner (from the list, not just the edit sheet), when toggled, then a `PATCH` fires immediately with just `{ isActive }` for a fast show/hide without opening the full edit form.
- [ ] AC7: Given the href field, when the admin types a value, then a small inline hint distinguishes internal vs external (e.g. "Starts with `/` for an internal page, or `https://` for an external link") — no hard validation blocking submission.
- [ ] AC8: The new nav item "Home Banners" (icon: `Image` or `LayoutGrid` from `lucide-react`) appears in `app/(admin)/admin/layout.tsx`'s `navigation` array, linking to `/admin/banners`, active-state styled consistently with other links.

## Deliverables
- **`app/(admin)/admin/banners/page.tsx`**: client component — fetch list on mount (`GET /api/admin/home-banners`), grid of `Card`s with thumbnail/title/href/badge, "Add Banner" button opening a `Sheet` form, click-through to edit `Sheet`, delete `Modal` confirmation, inline active-toggle. Follow the state/patterns established in `app/(admin)/admin/staff/page.tsx` (loading states, sheets, modals, `alert()`-based error surfacing).
- **A small crop helper** (e.g. `lib/image/center-crop.ts`): pure function `centerCropToBlob(file: File, aspect: number): Promise<Blob>` using an offscreen `<canvas>` — reusable, no new dependency.
- **`app/(admin)/admin/layout.tsx`**: add "Home Banners" to the `navigation` array (desktop + mobile share the same array).

## UI Notes
- Reuse `Input`, `Sheet`, `Modal`, `Button`, `Badge`, `Card` from `components/ui` — no new design-system primitives needed beyond the crop canvas step.
- Image preview box: `relative aspect-[3/2] w-full overflow-hidden rounded-md bg-primary-50` with an `<img>` (or `next/image` with `fill`), mirroring `TigerPromoCard`'s own image container so what admins see in the sheet matches the public render.
- Sort Order: plain number input; suggest current `max(sortOrder) + 1` as placeholder when adding, consistent with `Instructor.order` UX in the staff page.

## Out of Scope
- Native drag-and-drop reordering widget (per `00-overview.md`, `sortOrder` stays a plain numeric field for v1).
- Multi-image carousels per banner — one image per `HomeBanner` row.
