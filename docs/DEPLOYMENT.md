# BuildBridge deployment guide

This guide covers the current Next.js + Supabase project. Deploying the frontend does not automatically apply SQL migrations or configure external provider credentials.

## 1. Prepare the repository

1. Extract the updated BuildBridge project and push it to a private or public GitHub repository.
2. Confirm `package.json` and `package-lock.json` are committed.
3. Do not commit `.env.local`, Supabase service-role keys, OAuth client secrets or Gemini keys.

## 2. Apply Supabase migrations

Apply the existing database scripts in the order documented in `README.md`. Apply the new additive migration last:

`supabase/migrations/20261121050000_profile_and_auth_enhancements.sql`

It adds profile columns, coursework mapping and theory-assessment tables, structured opportunity requirements, the related RLS policies, and the public theory-certificate verification function. It does not replace the existing project-assignment, milestone-submission, company-verification or industry-certificate workflows.

After applying, run a schema reload in Supabase if the API does not immediately recognize the new columns and tables. Do not drop or recreate existing production tables to apply this migration.

## 3. Configure Supabase Auth

In Supabase Auth > URL Configuration:

- Set the Site URL to the deployed BuildBridge origin.
- Add the production and preview callback URLs that you actually use, ending in `/auth/callback`.
- Add `http://localhost:3000/auth/callback` for local development.

Enable and configure each provider that you intend to offer: Google, GitHub, LinkedIn OIDC, Microsoft (Azure) and Facebook. Add each provider's client ID and secret in Supabase Auth. Provider-specific redirect URIs must point to your Supabase project's Auth callback, usually `https://<project-ref>.supabase.co/auth/v1/callback`.

The company-representative option during signup is an onboarding request, not an authorization grant. Keep the database profile trigger's default role as `student`; only the existing verified-company and administrator-approval workflow may grant `company_member` access.

## 4. Configure Vercel

1. Import the GitHub repository into Vercel.
2. Keep the detected Next.js framework and the repository's package scripts. Use `npm ci` for installation and `npm run build` for production builds.
3. Set the Node.js runtime to a version supported by the current Next.js dependency in `package.json` (Node 20 LTS or newer is recommended).
4. Add the environment variables below to the Production environment. Add Preview values separately; never copy production secrets into untrusted preview deployments.
5. Deploy, then test signup, login, callback, profile save, workspace data, one project workflow and one certificate verification.

### Required environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only coursework quiz creation/grading and other privileged server operations; never expose it to the browser |
| `GEMINI_API_KEY` | AI Mentor, syllabus analysis and knowledge-check generation |

### Optional integrations

| Variable | Purpose |
|---|---|
| `GEMINI_MODEL` | Override the Gemini model; defaults to the value in the API route |
| `YOUTUBE_API_KEY` | YouTube lesson discovery |
| `RESEND_API_KEY` | Existing email delivery integration |
| `CRON_SECRET` | Protect scheduled notification/email worker endpoints |
| `ADMIN_OWNER_EMAIL` | Email used by the existing first-admin provisioning workflow |

Only variables whose names begin with `NEXT_PUBLIC_` are intended to be exposed to browser code. Keep the service-role key, AI key, Resend key and cron secret server-only.

## 5. Local development

```bash
cp .env.example .env.local
# Add your own Supabase, Gemini and optional integration credentials.
npm ci
npm run dev
```

Open `http://localhost:3000`. To run the production compiler locally:

```bash
npm run build
npm run start
```

## 6. End-to-end smoke tests

- Register as a student and verify the email confirmation flow.
- Register with the company-representative intent and confirm it does not grant company permissions before domain verification and administrator approval.
- Test Remember me both checked and unchecked in separate browser sessions.
- Test at least one configured OAuth provider and verify its redirect returns to the intended workspace screen.
- Complete and refresh a profile; confirm degree, department, academic year, GPA, coursework and links persist.
- Upload a non-confidential PDF or text syllabus (maximum 4 MB), inspect the structured concept/skill/project map, complete the generated knowledge check and test the separate `BBT-...` theory certificate verification.
- Play a YouTube lesson in the embedded player and confirm completion is recorded only after at least 90% continuous playback.
- Verify a company, create an opportunity draft, publish it, and confirm the student view explains exact demonstrated-skill/career-goal matches and shows the application status.
- Click a notification and confirm it opens the relevant workspace section.
- Switch browser tabs and return; confirm the workspace stays on the same screen and refreshes data instead of resetting to Dashboard.

## 7. Known constraints

- OAuth providers require credentials and redirect configuration in Supabase; their buttons cannot complete authentication until configured.
- Coursework upload accepts PDF and plain text (`.txt`, `.md`, `.csv`) up to 4 MB. DOCX, password-protected PDFs and scanned files that Gemini cannot read are not guaranteed.
- Coursework analysis needs `GEMINI_API_KEY`. Secure quiz creation and grading also need `SUPABASE_SERVICE_ROLE_KEY` configured only on the server.
- Opportunity publishing requires an administrator-verified company. Matching is intentionally conservative and uses exact normalized skill-name matches rather than guessing synonyms.
- This repository package does not contain production credentials or a deployed Vercel project. Deployment and provider configuration must be completed in the owner's accounts.
