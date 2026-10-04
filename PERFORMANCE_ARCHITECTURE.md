# SchoolOS Performance & Page-Loading Architecture

## Goals

- Keep the browser talking only to the SchoolOS backend API.
- Do not load the full student/employee rosters when the site opens.
- Do not re-query a module every time the user switches tabs.
- Split heavy dashboard modules into separate browser chunks.
- Keep authentication server-managed with HttpOnly cookies.
- Preserve Supabase RLS and server-side authorization.

## Loading strategy

### Anonymous visitor

The login screen is shown without making a database request. A small non-sensitive `schoolos_session_hint` cookie is used only to decide whether it is worth asking the backend to validate an existing session.

### Authenticated dashboard

The first authenticated load requests only `/api/dashboard-summary`.
It returns:

- school name/id
- student count
- employee count
- class count
- five recent students

It does **not** return the full student or employee tables.

### Lazy modules

Full data is fetched only when needed:

- Students / Admissions / Attendance / Classes / Reports -> `/api/students`
- Employees -> `/api/employees`

The frontend keeps the fetched data in memory for a short session cache (30 seconds) so tab switching does not repeatedly hit the backend.

### Code splitting

Heavy dashboard modules are loaded with `React.lazy`. A new visitor does not download every dashboard screen before authentication.

## Security

The backend remains responsible for authentication, authorization, validation, and school scoping. Supabase RLS remains enabled and is not bypassed with a service-role key.

The performance changes do not expose database credentials or table access to the browser.
