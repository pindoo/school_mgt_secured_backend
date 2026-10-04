# SchoolOS Customer Handover QA Checklist

## Frontend
- Login page is shared by all authorized school staff accounts; school selection is derived server-side from the authenticated employee profile.
- Dashboard academic range is Grade 1 through Grade 10.
- Classes screen displays Grades 1–10, including grades with zero current students.
- Customer-facing navigation removes backend/RLS diagnostics and duplicate Teachers/Employees navigation.
- Logout, mobile navigation, admissions roster navigation, class roster navigation, student CRUD controls, attendance controls, and CSV export remain wired to their existing handlers.

## Five-school login verification
The frontend does not hardcode five passwords or school credentials. Each authorized account must exist in Supabase Auth and have an employee profile with the correct school_id. The same login page supports all five schools without exposing a school list or credentials in browser code.

For handover, test one authorized account for each school using its real credentials. Never place those credentials in source code or documentation.

## Security verification
Use OWASP ASVS as the acceptance checklist and run an authorized DAST scan such as OWASP ZAP against the production site. Automated scanners can miss business-logic/access-control issues, so also manually test cross-school and cross-role access.

## Final release gate
- Production build succeeds on Vercel.
- No .env file or secrets are committed.
- No Supabase direct REST calls exist in src/.
- No plaintext passwords are stored by SchoolOS.
- All five school accounts can authenticate and see only their assigned school data.
- Principal/admin/teacher permissions are tested separately.

## Platform administration release

- The platform uses one login page for all schools.
- A `super_admin` manages schools and can invite Principal, Admin, or Teacher accounts.
- Principal/Admin users can invite Teacher accounts only within their own school.
- No role can create another `super_admin` through the UI.
- User invitations are sent by Supabase Auth; SchoolOS never stores or displays the user's password.
- The first Super Admin must be bootstrapped once by an authorized deployment administrator. See `SUPER_ADMIN_BOOTSTRAP.md`.
- Super Admin platform screens do not load a school dashboard or another school's student data.
