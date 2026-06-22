# FEATURE: Admin Studio Calendar Management

## Goals
- Empower non-technical admins to manage class occurrence schedules on a weekly or daily basis.
- Easily add new classes from templates, edit existing class capacities/times/instructors, or cancel occurrences.

## Acceptance Criteria
- [ ] **AC1**: Given an admin is on `/admin/calendar`, when the page loads, then they see a weekly visual calendar grid showing all scheduled class blocks.
- [ ] **AC2**: Given an admin wants to schedule a class, when they click on an empty slot or click "Add Class", then a sheet/modal opens allowing them to select a Template, Instructor, Start Time, Duration, and Capacity.
- [ ] **AC3**: Given an admin schedules a new class, when they submit, then a new `ClassOccurrence` is created in the database and the calendar instantly refreshes.
- [ ] **AC4**: Given an admin views a scheduled class, when they click on it, then they see the list of members booked for that class (member roster) and options to edit details.
- [ ] **AC5**: Given an admin needs to cancel a class, when they click "Cancel Class" and confirm, then the occurrence is flagged as CANCELLED (or deleted if no bookings exist), and any active bookings are automatically refunded and marked as CANCELLED.

## Deliverables
- **Admin Pages & Components**:
  - `app/(admin)/admin/calendar/page.tsx`: Core visual calendar timeline with a week switcher and list/grid layout toggle.
  - `components/admin/calendar/ScheduleClassSheet.tsx`: Sheet form with Select dropdowns for instructors (from database) and templates, with validation.
  - `components/admin/calendar/ClassDetailsModal.tsx`: Visual popup displaying scheduled class details, booked capacity, list of booked members, and administrative controls (Change capacity, edit, cancel).
- **Backend API Routes**:
  - `GET /api/admin/calendar`: Retrieve occurrences within a date range (startsAt/endsAt queries) including related template and instructor details.
  - `POST /api/admin/classes`: Validate parameters and create a new `ClassOccurrence` in the database.
  - `PATCH /api/admin/classes/[id]`: Modify fields (startsAt, capacity, instructor, etc.) or set cancellation state.

## Out of Scope
- Recurring classes/schedules (e.g., repeating every Tuesday forever). Admins will schedule occurrences individually or we can seed/clone them.
