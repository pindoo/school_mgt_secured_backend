# SchoolOS Security Hardening Release

This release hardens the secured backend without changing the existing Supabase table schema or RLS policies.

## Passwords
- Plaintext passwords are never stored in SchoolOS application tables, localStorage, or cookies.
- Supabase Auth verifies passwords and stores salted password hashes (bcrypt) in its protected Auth schema.
- The backend never logs password values and does not return Auth-provider error details.
- Password reset now requires a minimum of 12 characters on the SchoolOS UI and backend.
- Login and password-reset requests have abuse-rate limiting.

## Backend
- Removed the duplicate `api/[...route].ts` entry point; `api/index.ts` is the single backend entry.
- Added strict state-changing request Origin checks.
- Added `no-store` API caching headers and common security headers.
- Production access/refresh cookies use `__Host-` names with Secure + HttpOnly + SameSite=Lax.
- Restricted employee-profile API access to principal/admin/super_admin.
- Removed production security-probe endpoints that could be abused as an attack surface.
- Removed `select('*')` from the student list endpoint and use an explicit field allow-list.
- Added server-side student input length/date validation.
- Removed legacy browser mock/demo data and localStorage-backed fake sessions.
- Restored `.env.example` and kept real `.env` out of the project archive.
- Updated Express dependency range to 4.22.2+ and kept the lockfile's resolved dependency tree.

## Important security model
Browser -> SchoolOS Backend API -> Supabase Auth/Postgres/RLS

The browser can still see its own `/api/*` requests and any data that the application legitimately receives. It cannot be made to display a data set without receiving that data. The important boundary is that the browser no longer talks directly to Supabase and cannot choose the authenticated user's `school_id` or role for authorization decisions.
