# Super Admin bootstrap

The first Super Admin is a one-time administrative operation. Do not add a public "make me Super Admin" button.

## Server-only configuration

Add these Vercel Production environment variables:

- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key. Server-only. Never use a `VITE_` prefix and never commit it.
- `SUPER_ADMIN_BOOTSTRAP_TOKEN` — a long random one-time token (at least 20 characters). Keep it private.

The service-role key is used only by the backend user-provisioning functions. It is never returned to the browser.

## One-time bootstrap

1. Ensure the intended first administrator already exists in Supabase Auth.
2. Ensure at least one school exists.
3. Call the backend endpoint once from an authorized administrative environment:

`POST /api/platform/bootstrap`

Headers:

`x-schoolos-bootstrap-token: <your one-time token>`

JSON body:

`{"email":"admin@example.com","school_id":1}`

The endpoint refuses to run once a `super_admin` profile already exists.

After successful bootstrap, remove `SUPER_ADMIN_BOOTSTRAP_TOKEN` from the Vercel Production environment and redeploy. The platform then operates through the normal Super Admin UI.

Never expose the service-role key or bootstrap token in frontend code, browser storage, Git, screenshots, or chat.
