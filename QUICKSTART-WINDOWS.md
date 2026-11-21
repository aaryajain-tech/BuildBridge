# BuildBridge quick start (Windows PowerShell)

## Run locally

1. Install Node.js 22 or newer and open the extracted project folder in VS Code.
2. Copy `.env.example` to `.env.local` and set at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ADMIN_OWNER_EMAIL`.
3. Run:

```powershell
npm.cmd install
npm.cmd run dev
```

4. Open `http://localhost:3000`. The public landing page is open; sign in at `/auth/sign-in` or create an account at `/auth/sign-up`. `/workspace` and project details require authentication.

## Supabase setup

1. Run `database-schema.sql` once on a fresh project.
2. Run the existing setup scripts in README order, including `supabase/auth-setup-repair.sql`, `supabase/profile-details.sql`, `supabase/learning-ai.sql`, `supabase/project-marketplace.sql`, and `supabase/certificate-redesign.sql`.
3. Apply migrations `supabase/migrations/20261121030000_project_assignment_milestone_workflow.sql` then `supabase/migrations/20261121040000_platform_identity_notifications.sql`.
4. In Supabase Authentication → URL Configuration, allow `http://localhost:3000/auth/callback`. Configure the selected Email, Google, GitHub, Microsoft or Facebook provider.
5. Confirm the deployer account email, set `ADMIN_OWNER_EMAIL`, replace the placeholder in `supabase/provision-admin.sql`, and run it as the Supabase project owner.

## Company and email setup

- A company representative signs up normally, then requests access from **Profile → Company account access** using their confirmed organization email.
- Add the displayed TXT record to the organization's DNS zone, verify it in BuildBridge, and wait for the configured admin to review it. This grants account access, not company publishing verification.
- Email delivery is optional. Configure server-only `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL`, `CRON_SECRET`, and `UNSUBSCRIBE_TOKEN_SECRET` for scheduled notifications. Never use a service-role key in a `NEXT_PUBLIC_` variable.
- Vercel runs the notifications endpoint daily at 08:00 UTC using `vercel.json`. Locally, run the app with `npm.cmd run dev`; external DNS, OAuth, email and cron behavior requires real provider credentials.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Do not use the Supabase service-role key or auth-provider secrets in browser code or commit `.env.local`.
