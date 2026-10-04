# SchoolOS backend security architecture

## New request flow

Browser -> `/api/*` SchoolOS backend -> Supabase Auth/PostgreSQL

The React/Vite frontend no longer imports the Supabase SDK and no longer contains the Supabase project URL, database table names, or database queries.

## Server-side responsibilities

- Authentication and session verification
- HttpOnly access/refresh cookies
- Employee-profile lookup
- School/tenant selection from the authenticated profile
- Student CRUD authorization
- Input validation and normalization
- Database queries
- Security/RLS test requests

The backend deliberately uses the authenticated user's Supabase access token when querying PostgreSQL. This preserves the existing Supabase RLS policies instead of bypassing them with a service-role key.

## Required Vercel environment variables

Set these on the Vercel project (Production and Preview as appropriate):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APP_URL` = the public SchoolOS URL

Do not put these variables in `VITE_*` frontend environment variables.

Do not put a Supabase service-role/secret key in the frontend.

## Important limitation

Moving database access behind a backend hides the internal database implementation from the browser source:

- Supabase REST URL
- table names
- database queries
- server-side authorization logic
- server-side database credentials

It does **not** make data invisible to a user who is authorized to receive it. DevTools can still show the browser's own `/api/*` request and response. HTTPS protects the request in transit; it does not hide it from the person using their own browser.

## Existing database

No database schema or RLS policy changes are required by this migration. Existing RLS remains an additional security layer.


## Password protection
SchoolOS does not store plaintext passwords and does not encrypt passwords for later recovery. Passwords are submitted over HTTPS to the backend and verified by Supabase Auth. Supabase stores salted bcrypt password hashes in its protected Auth schema; the application never receives the stored hash. This is intentionally one-way hashing, not reversible encryption. Password reset uses Supabase's recovery flow.

The backend also limits repeated login/password-reset attempts, avoids logging password values, rejects oversized password inputs, and never returns authentication-provider error details to the browser.
