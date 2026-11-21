# BuildBridge

**Bridging traditional learning to real-world work.**

**Learn it. Build it. Prove it. Earn from it.**

BuildBridge is a career-learning platform that connects career goals and coursework to guided learning, practical projects, evidence of skills, and relevant opportunities. Students can show what they have learned through work products; organizations can review evidence through verified workflows.

> **Project status:** This repository contains a working Next.js application scaffold. Production workflows that depend on Supabase, Gemini, YouTube, email delivery, OAuth providers, DNS verification, and Vercel must be configured and tested in their respective services.

## Contents

- [What BuildBridge does](#what-buildbridge-does)
- [Workspaces and routes](#workspaces-and-routes)
- [Demo mode](#demo-mode)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Security and trust rules](#security-and-trust-rules)
- [Project structure](#project-structure)
- [Validation](#validation)
- [Deployment](#deployment)
- [Further documentation](#further-documentation)

## What BuildBridge does

Students can start with either a career goal or their coursework:

1. **Explore a career direction.** Review possible roles, goals, and skills; build a learning roadmap around a selected target.
2. **Map coursework to careers.** Submit course material for concept extraction and skill/project suggestions. The original upload is not retained by the coursework extraction flow.
3. **Learn and practice.** Find career-relevant YouTube resources, record learning activity, and use an AI mentor for explanations and progressive guidance.
4. **Build project evidence.** Explore practical projects, work through milestones, and submit evidence such as a repository, deployment, screenshots, reports, or a reflection.
5. **Get feedback and approval.** AI checks are advisory. For industry projects, the assigning verified company reviews evidence and records the final decision. Requested revisions remain part of the submission history.
6. **Show verified progress.** Skills are distinguished as studied, practiced, demonstrated, or company-verified. Eligible learning and project achievements can appear in the credential vault.
7. **Explore opportunities.** Review internships, freelance work, paid micro-projects, and other opportunities. Matching information is guidance, not a guarantee of eligibility, selection, employment, or payment.

Practice projects and sample opportunities are identified separately from employer-approved assignments. BuildBridge credentials are platform credentials unless a formal company or educational partnership authorizes otherwise.

## Workspaces and routes

| Route | Purpose |
|---|---|
| `/` | Public landing page and interactive learning-to-work journey |
| `/demo` | Sample Student workspace; no sign-in required |
| `/demo?role=company` | Sample Company workspace |
| `/demo?role=admin` | Sample Admin workspace |
| `/auth/sign-up` | Student registration and organization onboarding intent |
| `/auth/sign-in` | Email/password and configured social sign-in |
| `/auth/forgot-password` | Request a password reset |
| `/auth/reset-password` | Set a new password from a valid recovery session |
| `/student/dashboard` | Authenticated Student workspace |
| `/company/dashboard` | Authenticated Company workspace |
| `/admin` | Provisioned administrator workspace |
| `/workspace` | Backward-compatible authenticated workspace route |
| `/projects/[projectId]` | Project details |
| `/verify` | Certificate verification entry point |
| `/verify/[certificateCode]` | Public verification for a certificate code |
| `/api/health` | Safe service-configuration and Supabase-readiness diagnostic |

### Student

Career planning, coursework mapping, learning resources, AI mentoring, project discovery and submissions, opportunity matching, profile settings, and achievements.

### Company

Organization onboarding and verification, project and opportunity workflows, student evidence review, revision requests, and certificate issuer authorization. Company publishing and review actions depend on verification and database policy.

### Admin

Company verification, project moderation, certificate administration, platform health, AI operations, user access, disputes, and audit records. Public registration cannot grant the admin role; a trusted owner must be provisioned through the documented Supabase procedure.

## Demo mode

The demo routes use sample profiles, projects, opportunities, submissions, and other records from `lib/demo-data.ts`. Switch roles using the links in the demo banner or the routes above.

Demo records are illustrative and are not real users, vacancies, assignments, approvals, or credentials. Demo mode is for exploring the interface; actions that require authenticated backend services should be tested with a configured account instead.

## Technology

- **Application:** Next.js App Router, React, TypeScript
- **UI:** custom responsive CSS, Tailwind CSS, Lucide icons
- **Authentication and data:** Supabase Auth, PostgreSQL, Row Level Security, private Supabase Storage
- **AI:** Google Gemini through server-side API routes
- **Learning resources:** YouTube Data API and embedded YouTube player
- **Email:** Resend-backed notification delivery and signed unsubscribe links
- **Deployment:** Vercel

## Run locally

### Prerequisites

- Node.js 22 or newer
- npm
- A Supabase project for authenticated and database-backed features

### Install

From the repository root:

```powershell
npm.cmd ci
```

### Configure

Copy the example environment file and edit the local copy:

```powershell
Copy-Item .env.example .env.local
```

At minimum, configure `NEXT_PUBLIC_SUPABASE_URL` and one public Supabase key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for real sign-in and database features. See [Environment variables](#environment-variables) and [Database setup](#database-setup).

The landing page and sample demo can be explored without configuring the backend. Authentication and database-backed workflows require valid service configuration.

### Start the development server

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---|---|
| `npm.cmd run dev` | Start the local Next.js development server |
| `npm.cmd run build` | Create a production build |
| `npm.cmd run start` | Serve the production build locally |
| `npm.cmd run lint` | Run the configured Next.js lint command |
| `npm.cmd run typecheck` | Run TypeScript without emitting files |

Use `npm.cmd` in PowerShell if the local execution policy prevents running `npm.ps1`.

## Environment variables

Copy `.env.example` to `.env.local`; never commit `.env.local`. Do not expose server-only credentials through `NEXT_PUBLIC_` variables.

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase features | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase features | Configure one public client key |
| `NEXT_PUBLIC_APP_URL` | Canonical public app URL | For example, `http://localhost:3000` locally |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server workflows | Server-only; never expose or commit |
| `ADMIN_OWNER_EMAIL` | Admin authorization | Must match the confirmed, provisioned platform owner |
| `GEMINI_API_KEY` | AI Mentor and coursework processing | Server-only |
| `GEMINI_MODEL` | Optional AI model override | Uses the application default when unset |
| `YOUTUBE_API_KEY` | YouTube recommendations | Optional server-side key |
| `RESEND_API_KEY` | Email delivery | Server-only |
| `EMAIL_FROM` | Email delivery | Must be a verified sender |
| `EMAIL_FROM_NAME` | Email delivery | Optional sender display name |
| `CRON_SECRET` | Scheduled notification delivery | Use a long random secret |
| `UNSUBSCRIBE_TOKEN_SECRET` | Signed unsubscribe links | Use a strong random secret |
| `APP_BASE_URL` | Server-side links and email URLs | Canonical application origin |

`/api/health` reports configuration and connectivity status without returning secret values. See [Deployment and rollback](docs/DEPLOYMENT.md) for all service-specific configuration.

## Database setup

Database migrations are **manual**; deployments do not apply SQL automatically. Take a backup and follow the migration guide before changing a database.

- **Fresh Supabase project:** use the fresh-project sequence in [`docs/DATABASE-MIGRATIONS.md`](docs/DATABASE-MIGRATIONS.md). Run `database-schema.sql` only against a genuinely empty project.
- **Existing BuildBridge database:** use the existing-database procedure, starting with its read-only preflight SQL. Do not run `database-schema.sql` against an existing or production database.
- Review destructive or business-impacting certificate changes before applying them. Do not replay the older `supabase/project-marketplace.sql` installer after the versioned project workflow migrations.

Configure Supabase Auth redirect URLs for local, preview, and production origins. OAuth providers must be enabled and configured in Supabase; the provider's redirect URI is the Supabase `/auth/v1/callback`, while the app uses `/auth/callback`.

## Security and trust rules

- Never commit `.env.local`, service-role keys, OAuth secrets, API keys, or other credentials.
- Keep server-only secrets out of `NEXT_PUBLIC_` variables.
- New public sign-ups start as students. An organization signup choice is onboarding intent, not a role grant.
- Company access requires the documented organization-domain proof and administrator approval. Publishing and approval actions require the appropriate company verification.
- Admin access is provisioned for the confirmed platform owner; it is not publicly selectable.
- Students submit evidence; they cannot manually mark project milestones complete.
- AI review is advisory and never replaces an assigning verified company's explicit approval of industry work.
- Public certificate verification returns only the intended certificate fields, not account email or private evidence files.
- Demo data is fictional sample data and must not be presented as live employment or verified real-world activity.

## Project structure

```text
app/
  api/                    Server routes for AI, backend, projects, learning, email, etc.
  auth/                   Sign-in, sign-up, callback, and recovery pages
  demo/                   No-login sample workspace route
  student/                Student dashboard route
  company/                Company dashboard route
  admin/                  Admin dashboard route
  projects/               Project detail route
  verify/                 Public certificate verification
  page.tsx                Public landing page
  globals.css             Application and landing-page styles
components/               Auth, workspace, project, learning, and certificate UI
lib/                      Supabase clients, domain helpers, and demo fixtures
supabase/
  migrations/             Additive database migrations
  *.sql                   Setup, verification, and admin provisioning scripts
docs/                     Database and deployment procedures
public/                   Logo and learning-journey illustration assets
```

## Validation

Run the local checks before publishing a change:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Some workflows require external providers and cannot be certified by a local build alone. Hosted authentication, OAuth, email, scheduled jobs, database policies, DNS ownership checks, and company approval require validation against their configured services.

See [`BUILD_VALIDATION.md`](BUILD_VALIDATION.md) for existing validation notes and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for preview smoke tests.

## Deployment

Deploy the Next.js application to Vercel and configure environment variables separately for Preview and Production. Use a test Supabase project and test credentials for Preview; do not copy production secrets into untrusted environments.

Vercel deployment does not apply Supabase migrations. Follow the [migration guide](docs/DATABASE-MIGRATIONS.md), verify the intended database separately, and test the Preview deployment before promoting a change to Production. Frontend rollback does not roll back database schema or data.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for OAuth redirects, branch safety, environment setup, acceptance tests, and rollback.

## Further documentation

- [Windows quick start](QUICKSTART-WINDOWS.md)
- [Database migration guide](docs/DATABASE-MIGRATIONS.md)
- [Deployment and rollback guide](docs/DEPLOYMENT.md)
- [Build validation notes](BUILD_VALIDATION.md)
