# Phase 6: Public UI & Component Updates — Remove Template References

## Goals
- Update all public-facing pages and components that reference `occ.template.*` to use inline fields (`occ.name`, `occ.intensity`, etc.).
- Update admin sub-pages (scanner, members) that reference `template`.

## Acceptance Criteria
- [ ] **AC1**: `components/booking/ClassCard.tsx` uses `occ.name`, `occ.intensity`, `occ.tagline` instead of `occ.template.*`.
- [ ] **AC2**: `components/booking/InlineCalendar.tsx` uses `occ.name`, `occ.isSpecial`, `occ.intensity` instead of `occ.template.*`.
- [ ] **AC3**: `app/(shell)/book/[occurrenceId]/page.tsx` uses inline fields instead of `template.*`.
- [ ] **AC4**: `app/(shell)/book/page.tsx` uses `occ.isSpecial`, `occ.intensity` instead of `occ.template.*`.
- [ ] **AC5**: `app/(shell)/profile/page.tsx` uses `nextBooking.name` instead of `nextBooking.template.name`.
- [ ] **AC6**: `components/rewards/RecentActivityList.tsx` uses `item.name` instead of `item.template.name`.
- [ ] **AC7**: `app/(admin)/admin/scanner/page.tsx` uses `checkInResult.classOccurrence.name` instead of `.template.name`.
- [ ] **AC8**: `app/(admin)/admin/members/page.tsx` uses `att.classOccurrence.name` instead of `.template.name`.

## Implementation Steps

### 6.1 `components/booking/ClassCard.tsx`
- Change `template.name` → `name` (prop or field on the occurrence object).
- Change `template.intensity` → `intensity`.
- Change `template.tagline` → `tagline`.
- Update the component's TypeScript interface to reflect inline fields.

### 6.2 `components/booking/InlineCalendar.tsx`
- Change `o.template.isSpecial` → `o.isSpecial`.
- Change `o.template.intensity` → `o.intensity`.
- Change `o.template.name` → `o.name`.
- Change `occ.template.isSpecial` → `occ.isSpecial`.
- Change `occ.template.name` → `occ.name`.

### 6.3 `app/(shell)/book/[occurrenceId]/page.tsx`
- Change `template.name` → `name`.
- Change `template.intensity` → `intensity`.
- Change `template.tagline` → `tagline`.
- Change `template.description` → `description`.
- Update the occurrence type interface.

### 6.4 `app/(shell)/book/page.tsx`
- Change `occ.template.isSpecial` → `occ.isSpecial`.
- Change `occ.template.intensity` → `occ.intensity`.

### 6.5 `app/(shell)/profile/page.tsx`
- Change `nextBooking.template.name` → `nextBooking.name`.

### 6.6 `components/rewards/RecentActivityList.tsx`
- Change `item.template.name` → `item.name`.

### 6.7 `app/(admin)/admin/scanner/page.tsx`
- Update the `checkInResult.classOccurrence` type interface: replace `template: { name: string }` with `name: string`.
- Change `checkInResult.classOccurrence.template.name` → `checkInResult.classOccurrence.name`.

### 6.8 `app/(admin)/admin/members/page.tsx`
- Update the attendance type interface: replace `template: { name: string }` with `name: string`.
- Change `att.classOccurrence.template.name` → `att.classOccurrence.name`.

## Files Changed
- `components/booking/ClassCard.tsx`
- `components/booking/InlineCalendar.tsx`
- `app/(shell)/book/[occurrenceId]/page.tsx`
- `app/(shell)/book/page.tsx`
- `app/(shell)/profile/page.tsx`
- `components/rewards/RecentActivityList.tsx`
- `app/(admin)/admin/scanner/page.tsx`
- `app/(admin)/admin/members/page.tsx`
