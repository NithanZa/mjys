# FEATURE: Admin Portal Security (Option A)

## Goals
- Secure the admin panel routes `/admin/*` from unauthorized customer/member access.
- Provide a simple, password-only (passphrase) login mechanism that is extremely convenient and non-technical for studio desk staff without requiring complex user registration databases.

## Acceptance Criteria
- [ ] **AC1**: Given any visitor tries to access `/admin` or any sub-route (except `/admin/login`), when they are not authenticated, then they are automatically redirected to `/admin/login`.
- [ ] **AC2**: Given an admin is on `/admin/login`, when they enter the correct passphrase (configured securely in `.env`), then they are redirected to `/admin` and granted access.
- [ ] **AC3**: Given an admin is logged in, when they close the browser and reopen it, then they remain logged in because their session is saved in a secure HTTP-Only cookie.
- [ ] **AC4**: Given an admin is logged in, when they click "Logout" in the sidebar, then the session cookie is cleared, and they are redirected back to `/admin/login`.

## Deliverables
- **Environment Configuration**:
  - Add `ADMIN_PASSPHRASE` variable in `.env`.
- **Admin Authentication Pages & API**:
  - `app/(admin)/admin/login/page.tsx`: Passphrase login screen using existing studio colors and UI elements.
  - `app/api/admin/auth/login/route.ts`: Verifies the entered passphrase against `ADMIN_PASSPHRASE`. If matching, sets a cryptographically secure JWT or session token in a cookie named `mjys_admin_session` with `HttpOnly`, `Secure`, and `SameSite=Lax` flags.
  - `app/api/admin/auth/logout/route.ts`: Clears the `mjys_admin_session` cookie.
- **Middleware Protection**:
  - Create or update `middleware.ts` in the root folder to intercept requests to `/admin` and `/api/admin` (excluding `/admin/login` and auth routes). If `mjys_admin_session` cookie is missing or invalid, block/redirect to `/admin/login`.

## Out of Scope
- Dynamic role management or individual staff accounts. Under Option A, all studio administrators share a unified access passphrase.
