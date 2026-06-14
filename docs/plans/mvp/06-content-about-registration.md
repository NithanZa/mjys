# PHASE 6 — Content, About Us & Registration

## Goals
- Enrich the Home screen with weekly yoga content (quote + pose of the week).
- Replace the flat Instructors page with a tabbed "About Us" hub (Instructors · Staff · Map).
- Extend member registration to collect full profile data required for studio operations.
- Redesign the Profile page to surface key stats, package/booking alerts, and recent classes in a richer layout.

## Acceptance Criteria

### Home — Weekly Content
- [x] **AC1**: Given the Home page loads, when rendered, then a "Quote of the Week" card is visible with a yoga quote and optional attribution.
- [x] **AC2**: Given the Home page loads, when rendered, then a "Pose of the Week" card is visible with a pose name, brief description, and an illustrative image (or placeholder icon).
- [x] **AC3**: Given the content is CMS-driven, when the mock data is updated, then the Home page reflects the new quote/pose without code changes.

### About Us — Tabbed Page
- [x] **AC4**: Given the user navigates to `/about`, when the page renders, then three tab buttons are visible: **Instructors**, **Staff**, **Map**.
- [x] **AC5**: Given the **Instructors** tab is active, when rendered, then it shows a grid of instructor cards each with: photo, name, and specialties (as pill/dot-separated tags).
- [x] **AC6**: Given the **Staff** tab is active, when rendered, then it shows: a list of staff members each with avatar, name, role, and a tappable phone number; and below that a **"Send us a message"** form with fields: Your name, Send to (dropdown of staff), Topic (dropdown), Your message, and a Send button.
- [x] **AC7**: Given the **Map** tab is active, when rendered, then it shows: an embedded Google Maps iframe pinned to the studio address, info tiles for Address (TH), Address (EN), Opening hours, Phone, MRT nearest station, and Bus stop numbers; and an **"Open in Google Maps"** CTA button.
- [x] **AC8**: Given the shell nav references `/instructors`, when updated, then it points to `/about` instead.

### Registration Form — Extended Fields
- [x] **AC9**: Given an unregistered member opens `/profile`, when the registration form renders, then it contains: **Full name**, **Date of birth** (date picker), **Phone number**, **Home address** (textarea), **Email address**, and an **"I agree to Terms & Conditions"** checkbox with a link to the ToC.
- [x] **AC10**: Given the member submits the form, when all required fields are valid and ToC is checked, then the member record is created and the profile page is shown.
- [x] **AC11**: Given the member submits without accepting ToC, when validation runs, then an inline error prevents submission.

### Profile Page — Redesign
- [x] **AC12**: Given a registered member opens `/profile`, when rendered, then the **hero header** shows: profile photo (with "Change photo" affordance), display name, email, and level badge — on a warm gradient background card.
- [x] **AC13**: Given the member has an active package expiring within 7 days, when rendered, then a **Package expiry alert** banner is shown with the package name, expiry date, and remaining classes count.
- [x] **AC14**: Given the member has an upcoming booked class, when rendered, then a **Next class** info strip is shown with class name, date, time range, and instructor name.
- [x] **AC15**: Given a registered member opens `/profile`, when rendered, then a **Stats row** shows three tiles: total classes taken, classes this month, and current week streak.
- [x] **AC16**: Given a registered member opens `/profile`, when rendered, then a **Progress bar** toward the next Tiger level milestone is shown with current/target class count.
- [x] **AC17**: Given `NODE_ENV !== "production"`, when the profile page renders, then a **class count slider** (range input) replaces the +1/–1 buttons for quickly setting `classesAttended` to any value.
- [x] **AC18**: Given a registered member opens `/profile`, when rendered, then **Recent classes** shows the latest 4 attended classes each with class name, date, and "Attended" badge — without a separate "View all" link needing to be tapped first.
- [x] **AC19**: Given the bottom of the profile page, when rendered, then a privacy note reads *"Your profile and class history are private — only visible to you."*
- [x] **AC20**: Given `NODE_ENV !== "production"`, when the profile page renders, then a **"New Member Registration ▼"** collapsible dev panel is present at the bottom to allow registering a second mock member for testing.

## Deliverables

### Mock data
- `lib/mock/home-content.ts` — extend with `quoteOfWeek: { text, author? }` and `poseOfWeek: { name, description, imageUrl? }`.
- `lib/mock/about.ts` — staff list with name, role, phone; message topics enum.
- `lib/mock/bookings-store.ts` — add `getNextBooking(memberId)` helper returning the soonest upcoming booking with its occurrence details.

### Components
- `components/home/QuoteCard.tsx` — quote text + optional attribution.
- `components/home/PoseCard.tsx` — pose name, description, image/icon.
- `components/about/` — `AboutTabs.tsx` (tab switcher), `InstructorGrid.tsx` (moved/refactored from instructors page), `StaffList.tsx`, `StaffCard.tsx`, `ContactForm.tsx`, `MapEmbed.tsx`, `MapInfoTile.tsx`.
- `components/profile/ProfileHeroCard.tsx` — gradient header with photo, name, email, level badge, and "Change photo" placeholder.
- `components/profile/PackageAlertBanner.tsx` — yellow warning banner shown when active package expires within 7 days.
- `components/profile/NextClassStrip.tsx` — blue info strip with next booked class name, date, time, instructor.
- `components/profile/StatsRow.tsx` — 3-tile row: total classes, this month, week streak. Derives "this month" and "week streak" from `classesAttended` + mock activity.
- `components/profile/ClassCountSlider.tsx` — dev-only range `<input>` that calls `addClasses` to set `classesAttended` directly.

### Pages
- `app/(shell)/about/page.tsx` — new tabbed About Us page.
- Remove or redirect `app/(shell)/instructors/page.tsx` → `/about?tab=instructors`.
- Update shell nav to replace **Instructors** link with **About**.
- `app/(shell)/profile/page.tsx` — full redesign to match the new layout order:
  1. `ProfileHeroCard`
  2. `PackageAlertBanner` (conditional)
  3. `NextClassStrip` (conditional)
  4. `StatsRow`
  5. Level progress bar
  6. Dev: `ClassCountSlider`
  7. Recent classes (latest 4, inline — no separate card)
  8. Privacy note
  9. Dev: New Member Registration collapsible

### Registration
- Extend `RegistrationForm.tsx` with new fields and ToC checkbox.
- Update `MockMember` interface with `dob`, `address`, `email`, `tocAccepted`.
- Update `useMockMember` register action to persist new fields.

## Out of scope (post-MVP)
- Actual message delivery (LINE Messaging API / email) from the Contact Form — frontend only, no send action wired.
- CMS admin interface for managing quote/pose of the week.
- Map provider swap (e.g. Mapbox, Longdo) — Google Maps iframe is sufficient for MVP.

## Dependencies
- No new packages required; Google Maps embed is a plain `<iframe>`.
- `react-hook-form` + `zod` already used in `RegistrationForm.tsx` — extend existing schema.

## Verification
- All three About tabs render without errors on mobile viewport.
- Registration form rejects submission when ToC is unchecked.
- Home page shows Quote and Pose cards with mock data.
- Profile page hero card, stats row, progress bar, recent classes (4 entries), and privacy note all render for a registered member.
- Package alert banner appears only when package expires within 7 days.
- Next class strip appears only when an upcoming booking exists.
- Class count slider (dev) updates `classesAttended` and re-derives all stats live.
- `pnpm lint` passes with no errors.
- Shell nav link updated and old `/instructors` route gracefully redirects.
