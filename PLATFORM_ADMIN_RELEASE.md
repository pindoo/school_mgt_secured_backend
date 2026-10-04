# Platform Administration Release

## Roles

- `super_admin`: platform-wide school and staff provisioning.
- `principal` / `admin`: manage Teacher invitations inside their own school.
- `teacher`: no user provisioning.

## School isolation

The backend derives the acting user's school from the authenticated employee profile. School administrators cannot choose another school when creating staff.

## Passwords

Invitations are sent through Supabase Auth. Users create their own passwords. SchoolOS never stores, displays, or returns plaintext passwords.

## First Super Admin

Use `SUPER_ADMIN_BOOTSTRAP.md` for the one-time bootstrap. After the first Super Admin is created, remove the bootstrap token from Vercel.
