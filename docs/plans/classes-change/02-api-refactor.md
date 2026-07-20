# Phase 2: API Refactor — Remove Template References from All Routes

## Goals
- Update every API route and server-side query that references `ClassTemplate` or `templateId` to use the new inline fields on `ClassOccurrence`.

## Acceptance Criteria
- [ ] **AC1**: `GET /api/admin/calendar` no longer queries `classTemplate.findMany` and no longer includes `template` in the occurrence query.
- [ ] **AC2**: `POST /api/admin/classes` accepts inline fields (`name`, `description`, `tagline`, `intensity`, `isSpecial`) instead of `templateId`.
- [ ] **AC3**: `PATCH /api/admin/classes/[id]` can update inline class metadata fields in addition to existing editable fields.
- [ ] **AC4**: `GET /api/classes` (public) includes inline fields, not `template`.
- [ ] **AC5**: `POST /api/bookings` (public) includes inline fields when fetching occurrence, not `template`.
- [ ] **AC6**: `GET /api/members/me/history` includes inline fields, not `template`.
- [ ] **AC7**: `GET /api/admin/classes/[id]/roster` — no template references.
- [ ] **AC8**: `GET /api/admin/scanner/verify` — no template references.
- [ ] **AC9**: `GET /api/admin/members/[id]` — no template references.

## Implementation Steps

### 2.1 `app/api/admin/calendar/route.ts`
- Remove `prisma.classTemplate.findMany(...)` from the `Promise.all`.
- Remove `templates` from the response object.
- Remove `include: { template: true }` from the occurrence query (keep `instructor: true`).

### 2.2 `app/api/admin/classes/route.ts` (POST)
- Replace `templateId` in request body with `name`, `description`, `tagline`, `intensity`, `isSpecial`.
- Remove template existence validation.
- Update `prisma.classOccurrence.create` to use inline fields.

### 2.3 `app/api/admin/classes/[id]/route.ts` (PATCH)
- Add support for updating `name`, `description`, `tagline`, `intensity`, `isSpecial` fields.
- Remove `include: { template: true }` from all queries (keep `instructor: true`).

### 2.4 `app/api/classes/route.ts` (public)
- Remove `include: { template: true }`, keep `include: { instructor: true }`.
- Inline fields are now directly on the occurrence object.

### 2.5 `app/api/bookings/route.ts`
- Remove `include: { template: true }` from occurrence queries.
- Keep `include: { instructor: true }`.

### 2.6 `app/api/members/me/history/route.ts`
- Change `include: { classOccurrence: { include: { template: true, instructor: true } } }` to `include: { classOccurrence: { include: { instructor: true } } }`.
- Update the response mapping: `template: att.classOccurrence.template` → spread inline fields directly.

### 2.7 `app/api/admin/classes/[id]/roster/route.ts`
- Remove any `template` includes if present.

### 2.8 `app/api/admin/scanner/verify/route.ts`
- Remove any `template` includes if present.

### 2.9 `app/api/admin/members/[id]/route.ts`
- Remove any `template` includes if present.

## Files Changed
- `app/api/admin/calendar/route.ts`
- `app/api/admin/classes/route.ts`
- `app/api/admin/classes/[id]/route.ts`
- `app/api/admin/classes/[id]/roster/route.ts`
- `app/api/classes/route.ts`
- `app/api/bookings/route.ts`
- `app/api/members/me/history/route.ts`
- `app/api/admin/scanner/verify/route.ts`
- `app/api/admin/members/[id]/route.ts`
