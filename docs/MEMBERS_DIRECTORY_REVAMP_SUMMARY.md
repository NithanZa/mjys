# Members Directory Revamp - Implementation Summary

## Overview
The Members Directory admin page has been completely revamped from a single flat search/detail view into a comprehensive two-tab analytics dashboard, mirroring the Staff Directory pattern. All 6 enhancement ideas have been fully implemented.

## What Was Built

### 1. **Overview Tab** (New)
Displays aggregate member cohort statistics with month navigation:
- **Main Stats Cards** (4-column grid):
  - Total Members (with active/inactive breakdown)
  - New Members This Month (with trending indicator)
  - Packages Expiring This Month (with warning color)
  - Monthly Revenue (with success color)

- **Secondary Stats**:
  - Classes Left on Table (unused classes in expired packages)
  - Most Popular Package (most-purchased offer this month)

- **6-Month Trend Sparkline**:
  - Visual trend of new member signups over the last 6 months
  - Smart scaling to avoid flat-looking charts

- **Month Picker**:
  - Navigate between months to view historical data
  - Defaults to current month

### 2. **Directory Tab** (Refactored)
Extracted from original page, now includes enhanced features:
- **Search Bar**: Find members by name, phone, or email
- **Filters**: 
  - Level filter (Cat, Tiger, Leopard)
  - Status filter (Active, Inactive 30+ days, Expiring Soon)
- **Risk Status Badges**: 
  - Green "Active" for members with check-in in last 30 days
  - Red "Inactive 30+ days" for members with no recent activity
  - Orange "Expiring Soon" for members with packages expiring within 7 days
- **Multi-Select Checkboxes**: Select multiple members for bulk operations
- **Bulk Actions Toolbar**:
  - Bulk Grant Package: Grant same package to multiple members
  - Bulk Export CSV: Export selected members' contact info
  - Clear Selection button

### 3. **Enhanced Member Detail View**
When clicking "View Profile" on a member:
- **6-Month Attendance Sparkline**: Visual trend of checked-in classes per month
- **Level Progress Bar**: 
  - Current tier level (Cat/Tiger/Leopard)
  - Visual progress bar toward next level
  - Percentage and remaining classes to next tier
- **Favorite Instructor Card**: 
  - Shows most-attended instructor (from checked-in classes only)
  - Displays attendance count with this instructor
- **All existing features preserved**:
  - Contact info, milestones, packages, attendance history
  - Manual grant package, reset, and delete operations

## Backend API Routes

### `/api/admin/members/stats` (GET)
**Purpose**: Fetch aggregate member statistics for a given month
**Query Parameters**:
- `year` (optional): Year (defaults to current)
- `month` (optional): Month 1-12 (defaults to current)

**Response**:
```json
{
  "year": 2026,
  "month": 7,
  "stats": {
    "totalMembers": 150,
    "activeMembers": 120,
    "inactiveMembers": 30,
    "newMembersThisMonth": 8,
    "packagesExpiringThisMonth": 12,
    "classesLeftOnTable": 45,
    "monthlyRevenue": 125000,
    "mostPopularPackage": {
      "name": "10 Classes",
      "count": 5
    },
    "sixMonthMemberTrend": [5, 6, 8, 7, 9, 8]
  }
}
```

### `/api/admin/members/affinity` (GET)
**Purpose**: Get favorite instructor and preferred class times for a member
**Query Parameters**:
- `memberId` (required): Member ID

**Response**:
```json
{
  "memberId": "...",
  "favoriteInstructor": {
    "instructorId": "...",
    "instructorName": "Instructor Name",
    "attendanceCount": 12
  },
  "preferredClassTimes": [
    {
      "dayOfWeek": "Monday",
      "hour": 18,
      "attendanceCount": 5
    }
  ]
}
```

### `/api/admin/members/bulk-grant` (POST)
**Purpose**: Grant a package to multiple members at once
**Body**:
```json
{
  "memberIds": ["id1", "id2", "id3"],
  "packageOfferId": "offer-id"
}
```

**Response**:
```json
{
  "message": "Successfully granted package to 3 members",
  "grantedCount": 3
}
```

### `/api/admin/members/export` (GET)
**Purpose**: Export selected members' contact info as CSV
**Query Parameters**:
- `ids` (required): Comma-separated member IDs

**Response**: CSV file download with columns:
- Name, Email, Phone, Level, Classes Attended, Registered Date

### Enhanced `/api/admin/members/[id]` (GET)
**New fields in response**:
- `sixMonthAttendanceTrend`: Array of checked-in class counts per month
- `favoriteInstructor`: Object with instructor ID, name, and attendance count

## Frontend Components

### `MembersOverviewTab.tsx`
- Displays aggregate statistics with month navigation
- Fetches data from `/api/admin/members/stats`
- Reuses `Sparkline` component from UI library
- Matches Staff Directory styling and patterns

### `MembersDirectoryTab.tsx`
- Refactored member search and detail management
- Implements multi-select for bulk operations
- Adds risk status badges and filters
- Enhanced member detail view with sparkline and progress bars
- Handles bulk grant and export operations

### `MembersOverviewTab.tsx` + `MembersDirectoryTab.tsx` Integration
- Main page (`app/(admin)/admin/members/page.tsx`) now uses tab switcher
- Matches Staff Directory tab UI pattern
- Smooth transitions between Overview and Directory tabs

## Key Features

✅ **Real Data from Database**
- All stats calculated from actual Prisma queries
- Respects studio timezone (Bangkok)
- Only counts checked-in attendances (actual attendance, not bookings)

✅ **Churn Risk Detection**
- Inactive badge for members with no check-in in 30+ days
- Expiring Soon badge for members with packages expiring within 7 days
- Active badge for engaged members

✅ **Member Journey Visualization**
- 6-month attendance sparkline shows engagement trends
- Level progress bar with visual fill and percentage
- Favorite instructor display for personalization insights

✅ **Revenue & Utilization Insights**
- Monthly revenue tracking
- Classes left on table (wasted value in expired packages)
- Most popular package identification
- Package expiry monitoring

✅ **Bulk Operations**
- Multi-select checkboxes for batch management
- Bulk grant packages to cohorts
- Bulk export contact info as CSV
- Segment by level, status, or search query

✅ **UI Consistency**
- Matches Staff Directory design patterns
- Uses existing UI components (Card, Badge, Sparkline, etc.)
- Consistent color scheme and typography
- Responsive layout (mobile-friendly)

## Database Queries

All queries are optimized and use Prisma's include/select for efficient data fetching:
- Attendance queries filter by status (CHECKED_IN only for real attendance)
- Package queries track expiry dates and remaining classes
- Instructor affinity calculated from checked-in attendances
- 6-month trends calculated in a loop with date boundaries

## Testing Checklist

- [x] Build succeeds with no TypeScript errors
- [x] All API routes created and functional
- [x] Components properly typed and exported
- [x] Tab switcher works correctly
- [x] Overview tab loads and displays stats
- [x] Directory tab shows members with risk badges
- [x] Filters work (level, status)
- [x] Multi-select checkboxes functional
- [x] Bulk grant modal appears and submits
- [x] Bulk export downloads CSV
- [x] Member detail view shows sparkline and progress bars
- [x] Favorite instructor displays correctly
- [x] All existing member management features preserved

## Files Created/Modified

### New Files
- `app/api/admin/members/stats/route.ts` - Overview statistics API
- `app/api/admin/members/affinity/route.ts` - Favorite instructor API
- `app/api/admin/members/bulk-grant/route.ts` - Bulk grant API
- `app/api/admin/members/export/route.ts` - CSV export API
- `components/admin/MembersOverviewTab.tsx` - Overview tab component
- `components/admin/MembersDirectoryTab.tsx` - Directory tab component
- `docs/plans/members-directory-revamp.md` - Feature plan

### Modified Files
- `app/(admin)/admin/members/page.tsx` - Refactored to use tabs
- `app/api/admin/members/route.ts` - Added risk status calculation
- `app/api/admin/members/[id]/route.ts` - Added sparkline and affinity data

## Next Steps (Optional Enhancements)

1. **Advanced Segmentation**: Save member segments for recurring campaigns
2. **Engagement Scoring**: Calculate member engagement score based on attendance frequency
3. **Churn Prediction**: ML model to predict members likely to churn
4. **Automated Re-engagement**: Trigger notifications for inactive members
5. **Revenue Forecasting**: Predict monthly revenue based on trends
6. **Class-Time Recommendations**: Suggest classes based on member's preferred times

## Notes

- All timestamps respect studio timezone (Bangkok)
- Attendance counts only include CHECKED_IN status (actual attendance)
- Package revenue calculated from offer prices, not discounted prices
- 6-month trends include current month
- Sparkline uses 10% padding to avoid flat-looking charts
- Risk status is calculated on-the-fly during member list fetch
