# FEATURE: Members Directory Revamp

## Goals
- Transform members directory from a flat search/detail view into a rich analytics dashboard
- Mirror the Staff Directory pattern with Overview + Directory tabs
- Provide actionable insights for member retention, engagement, and revenue

## Acceptance Criteria

### Idea 1: Overview + Directory Tab Split
- [ ] AC1: Members page has two tabs: "Overview" (default) and "Directory"
- [ ] AC2: Overview tab shows aggregate cohort stats (total active, new signups, expiring packages, inactive members)
- [ ] AC3: Directory tab contains the current search/detail-drawer functionality
- [ ] AC4: Tab switcher matches Staff Directory UI pattern (border, rounded, toggle styling)

### Idea 2: Churn-Risk & Re-engagement Flags
- [ ] AC5: Each member in directory list shows "days since last check-in" badge
- [ ] AC6: Members with no check-in in 30+ days show "Inactive" badge (red)
- [ ] AC7: Members with active packages expiring in <7 days show "Expiring Soon" badge
- [ ] AC8: Directory list can be sorted/filtered by risk status (active, inactive, expiring)

### Idea 3: Per-Member Sparkline + Progress Bars
- [ ] AC9: Member detail view shows 6-month attendance sparkline (reuse Sparkline component)
- [ ] AC10: Level progress bar shows current level + progress toward next level (CAT→TIGER→LEOPARD)
- [ ] AC11: Milestone progress shows next unclaimed milestone + progress toward it
- [ ] AC12: All progress bars have visual indicators (%, count, or visual fill)

### Idea 4: Package Utilization & Revenue Insights
- [ ] AC13: Overview tab shows "Packages Expiring This Month" stat card
- [ ] AC14: Overview tab shows "Classes Left on Table" (sum of unused classes in expired packages)
- [ ] AC15: Overview tab shows "Monthly Revenue" (sum of package creation values this month)
- [ ] AC16: Overview tab shows "Most Popular Package" (most-purchased offer this month)

### Idea 5: Favorite Instructor + Class-Time Affinity
- [ ] AC17: Member detail view shows "Favorite Instructor" (most-attended instructor)
- [ ] AC18: Member detail view shows "Preferred Class Time" (most-attended day/time pattern)
- [ ] AC19: Attendance history in detail view is grouped by instructor for easy scanning
- [ ] AC20: Instructor affinity is calculated from CHECKED_IN attendances only

### Idea 6: Bulk Actions & Segmentation
- [ ] AC21: Directory list has filter dropdowns (Level, Package Status, Active/Inactive, Joined Date)
- [ ] AC22: Directory list supports multi-select checkboxes for bulk operations
- [ ] AC23: Bulk grant package action available (select members → choose offer → grant to all)
- [ ] AC24: Bulk export action available (export selected members' contact info as CSV)

## Deliverables

### Backend API Routes
- `GET /api/admin/members/stats` — Overview stats (active count, new signups, expiring packages, inactive count, revenue, popular package)
- `GET /api/admin/members/affinity?memberId=...` — Favorite instructor + class-time patterns
- `POST /api/admin/members/bulk-grant` — Bulk grant packages to multiple members
- `GET /api/admin/members/export?ids=...` — Export member contact info as CSV

### Frontend Components
- `MembersOverviewTab` — Stats cards, month picker, all-time section
- `MembersDirectoryTab` — Search, filters, list with risk badges, detail drawer
- `MemberDetailView` — Sparkline, progress bars, favorite instructor, affinity
- `BulkActionsToolbar` — Multi-select, bulk grant, bulk export

### Database Queries
- Attendance sparkline (6-month history per member)
- Churn calculation (days since last CHECKED_IN)
- Package utilization (classes remaining at expiry)
- Revenue aggregation (monthly package creation totals)
- Instructor affinity (most-attended by member)
- Class-time affinity (day/time pattern analysis)

## Implementation Order
1. Create backend API routes for stats, affinity, bulk operations
2. Build MembersOverviewTab component with stats cards
3. Refactor current members page into MembersDirectoryTab
4. Add tab switcher to main members page
5. Enhance member detail view with sparkline + progress bars
6. Add risk badges and filters to directory list
7. Implement bulk actions (multi-select, grant, export)
8. Test all features and verify UI consistency
