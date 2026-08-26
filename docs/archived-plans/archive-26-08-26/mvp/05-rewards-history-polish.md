# PHASE 5 — Rewards, history, polish & launch

## Goals
- Close the gamification loop (§10–13 of `user-flow.md`): Tiger Toys collection, recent activities, class history.
- Tighten the booking ↔ package ↔ attendance pipeline and harden the app for production launch inside LINE.

## Acceptance Criteria
- [ ] **AC1**: Given a member has an active package, when they book a class, then `classesRemaining` decrements; when they cancel ≥ 12 h before, then it is refunded; when they cancel late or no-show, then it is consumed. *(Backend pass)*
- [ ] **AC2**: Given a member is checked in (QR scan from Phase 2 resolves on the studio side), when `Attendance.status` becomes `CHECKED_IN`, then `Member.classesAttended` is incremented atomically and `Package.classesRemaining` reflects the consumption. *(Backend pass)*
- [x] **AC3**: Given `/profile` is open, when the page renders, then it shows: name, level badge, level progress bar, active package summary, **Recent Activities** (latest 2), and a "My Classes" entry point. *(Frontend complete)*
- [x] **AC4**: Given the user opens **My Classes**, when the page loads, then it lists past attended classes (date desc) with class name, instructor, and status badge. *(Frontend complete)*
- [x] **AC5**: Given the gamified "Tiger Toys" feature is enabled, when a member completes a class, then they earn 1 toy-part, and `/profile/collection` visualizes which parts are collected and which milestones are unlocked. *(Frontend complete)*
- [x] **AC6**: Given a milestone is unlocked, when the user opens Home, then a non-intrusive celebration card surfaces with a CTA to the related promotion (e.g. referral discount). *(Frontend complete)*
- [ ] **AC7**: Given launch-readiness review, when QA runs the checklist, then all items below pass. *(Backend pass)*

## Launch checklist
- [ ] Lighthouse mobile **performance ≥ 85**, **accessibility ≥ 95** on key routes.
- [ ] Works inside LINE in-app browser on iOS 16+ and Android Chrome WebView.
- [ ] Works when opened outside LINE (graceful fallbacks, not crashes).
- [ ] All forms keyboard-safe (no covered inputs, no zoom-on-focus).
- [ ] No `console.error` in production build.
- [ ] Sentry (or equivalent) wired with `NEXT_PUBLIC_SENTRY_DSN`.
- [ ] `.env.example` documents every variable used.
- [ ] LIFF Endpoint URL in LINE Developers Console matches the production deployment (HTTPS).
- [ ] All three semantic themes (`warm`, `earthy`, `bright`) render correctly — picked default `warm`.

## Deliverables
- **Schema additions**:
  - `ToyPart { id, code, name, imageUrl, sortOrder }`
  - `MemberToyPart { id, memberId, toyPartId, earnedAt }`
  - `Milestone { id, code, name, requirement (json), rewardOfferId? }`
  - `MemberMilestone { id, memberId, milestoneId, unlockedAt, redeemedAt? }`
- `app/profile/page.tsx` — extended with recent activities + active package strip.
- `app/profile/my-classes/page.tsx` — paginated class history.
- `app/profile/collection/page.tsx` — Tiger Toys collection view.
- `components/rewards/` — `ToyGrid`, `ToySlot`, `MilestoneCard`, `RecentActivityList`.
- `app/api/attendance/check-in/route.ts` — accepts a signed QR payload (from Phase 2), validates TTL, transitions `Attendance` → `CHECKED_IN`, awards toy parts & milestones.
- `lib/rewards.ts` — pure rules: `awardForAttendance(member)` returning `{ toyParts: [...], milestones: [...] }`.
- `e2e/` — Playwright smoke flows: register → buy package → book → check-in → earn toy → unlock milestone.

## Out of scope (post-MVP)
- Referrals as a first-class feature with codes & tracking.
- Push notifications via LINE Messaging API (template / Flex messages).
- Multi-studio support, instructor self-serve.

## Dependencies
- `@playwright/test`, `@sentry/nextjs`, the studio-facing QR scanner (separate surface — can be a `/admin/scan` route or external tool).

## Verification
- Full E2E run green on CI.
- Manual: end-to-end happy path on a real iPhone via the LIFF URL.
- Load test: 50 concurrent bookings on a 10-slot class — exactly 10 succeed, no double-decrement.

---

## Frontend-only scope (this pass)

**Completed**:
- ✅ `lib/mock/rewards.ts` — static `ToyPart` and `Milestone` data.
- ✅ `lib/rewards.ts` — pure derivation functions (`getToyPartStatuses`, `getMilestoneStatuses`, `getUnseenUnlockedMilestones`).
- ✅ `lib/mock/activity.ts` — synthesized class history from `classesAttended`.
- ✅ Extended `MockMember` with `seenMilestones` and `markMilestoneSeen` action.
- ✅ `components/rewards/` — `ToySlot`, `ToyGrid`, `MilestoneCard`, `RecentActivityList`, `MilestoneCelebrationCard`.
- ✅ Extended `/profile` with Recent Activity preview and links to My Classes and Collection.
- ✅ `/profile/my-classes` — full class history page.
- ✅ `/profile/collection` — Tiger Toy collection and milestones page.
- ✅ Home page — milestone celebration card integration.

**Deferred to backend pass**:
- Real attendance tracking and package consumption logic (AC1, AC2).
- Prisma schema for `ToyPart`, `MemberToyPart`, `Milestone`, `MemberMilestone`.
- `/api/attendance/check-in` route for QR-based check-in.
- E2E tests and launch checklist (AC7).

**Migration path**:
- Replace `lib/mock/rewards.ts` with Prisma queries for `ToyPart` and `Milestone`.
- Replace `lib/mock/activity.ts` with Prisma queries for `Attendance` records.
- Replace `useMockMember().seenMilestones` with `MemberMilestone` table queries.
- Keep `lib/rewards.ts` pure functions as the source of truth for reward rules.
