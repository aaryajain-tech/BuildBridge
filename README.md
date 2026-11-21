# BuildBridge

**Tagline:** Bridging traditional learning to real-world work.

**Learn it. Build it. Prove it. Earn from it.**

BuildBridge is an AI-powered career intelligence, experiential learning and industry opportunity platform. It connects a student's goals and coursework to curated learning resources, practical product-building, AI-assisted delivery, company-approved project evidence and relevant internships/freelance opportunities.

## Product workflow

Students enter through either path:

1. **Career-first / discovery:** describe a target role or the kind of work/life they want. BuildBridge recommends career directions, explains trade-offs and builds a skill roadmap.
2. **Coursework-first:** upload a syllabus, assignment or course material. BuildBridge extracts actual concepts and maps them to relevant career paths, skills and project challenges.

Both paths converge into one learning-to-work journey:

1. Separate studied, practiced, demonstrated and company-verified skills.
2. Generate scoped practical project challenges and milestone acceptance criteria.
3. Recommend actual YouTube videos based on the student's career goal and focus skills. BuildBridge stores only learning actions the student records; it cannot access private YouTube watch history.
4. Guide students through implementation with an AI mentor that asks questions, gives progressive hints, explains concepts and reviews attempts. AI use is encouraged; students are assessed on the quality, correctness, validation, integration and delivery of work—not on avoiding AI.
5. Require real evidence uploads (repository, deployment, screenshots/reports/test evidence and an implementation reflection); students cannot manually mark work complete.
6. For industry assignments, evidence checks are advisory. The assigning verified company must explicitly approve each required milestone in its authenticated company dashboard before an industry completion certificate can be issued. Revisions create new submission records; the history is retained.
7. Update the student's evidence-backed skill profile and match them with relevant internships, freelance assignments, paid micro-projects and jobs. Compensation is opportunity-specific and not guaranteed.
8. Store certificates, project reports, proof-of-work, authorized recommendation letters and achievements in the student's credential vault.

Practice projects can have progress badges, but they are not represented as verified industry credentials. BuildBridge-issued credentials are platform credentials, not university-accredited or company-issued certificates unless a formal partnership/authorization exists.

Company completion certificates are created only after every project milestone is approved by the assigning verified company and that company owner explicitly authorizes a named signatory. BuildBridge project-learning, skill-demonstration, and pathway certificates require a platform-admin issuance action backed by the corresponding recorded evidence. Existing legacy certificates are marked revoked because the old workflow did not require complete-project approval or issuer authorization.


## Visual onboarding and accessibility

The authenticated workspace includes an animated six-step visual tour with a distinct illustration for each stage: career direction, coursework mapping, goal-matched video learning, project building, evidence submission, and company approval. Each call-to-action opens the relevant workspace; the guide is not shown on the login page.

The exact user-supplied BuildBridge logo artwork is used in the public landing page, authentication pages and workspace navigation. A persistent “Your Build Journey” guide appears at the top of every authenticated workspace screen; its six-step guide advances automatically every 4 seconds and can be paused or hidden. The taller lower tour panel adapts to the selected light/dark theme. Paragraphs, labels, controls, navigation and helper text use larger, more legible type.

## Three authenticated workspaces

- **Student:** career discovery, coursework, curated learning, AI mentor, project submissions, opportunities and achievement vault.
- **Company:** verified organization profile, project/opportunity publishing, stipend/scope/eligibility/acceptance terms, applications, evidence review, revisions and explicit approvals. Only the assigning company can approve its own project.
- **Admin:** platform oversight, company verification, project moderation, AI telemetry/status, disputes and audit logs. Admin is not selectable during public sign-up. The deployer provisions one trusted admin account manually in Supabase; a database unique index enforces a single admin role.

## Technology

- Next.js App Router, React and TypeScript
- Tailwind CSS plus custom responsive CSS (hybrid light/dark preference)
- Lucide icons and the supplied BuildBridge logo artwork (open book + bridge + learning-to-work path)
- Google Gemini via `@google/genai` server-side routes
- Supabase Auth with PKCE and cookie-based SSR sessions, PostgreSQL, Row Level Security and private Storage
- In-app notifications, opt-in email delivery through Resend, signed unsubscribe links and scheduled deadline reminders
- Career-specific YouTube video recommendations, bookmarks and watch progress (server-side API key required)
- Vercel deployment

## Recent implementation updates

- The visual system uses the exact supplied BuildBridge logo artwork, a light-peach application canvas, warm ivory cards, deep navy navigation, mint/teal actions and violet secondary accents. Body copy, labels, navigation and helper text have been increased for readability.
- The “Your Build Journey” header is visible at the top of workspace pages, with a different illustration for each step. Its six-step guide automatically advances every 4 seconds (unless reduced motion is enabled). Users can pause/resume it, select a step, navigate to the relevant workspace, or hide/show the walkthrough.
- The public landing page, auth pages and authenticated workspaces are separate routes. Supabase SSR cookies and PKCE protect server-rendered `/workspace` and project detail pages. Email/password and Google, GitHub, Microsoft and Facebook sign-in use the callback at `/auth/callback`; each provider still requires real credentials in Supabase.
- New accounts always start as students regardless of signup metadata. Company access requires a confirmed organization email, DNS ownership proof, and a separate administrator decision. Company verification and publishing authorization remain additional checks.
- Notification records and per-user preferences are stored in Supabase. Email is queued and sent by the scheduled `/api/cron/notifications` worker; failures are logged and retried. Email delivery requires a verified Resend sender and server-only secrets.
- `/api/health` reports whether the deployment has Supabase/Gemini/YouTube configuration and whether the server can reach Supabase. It does not expose credentials. Open `/api/health` on your local or deployed app to inspect it.
- The authenticated backend supports profile, project catalogue/details, student assignments and milestone evidence, opportunities, certificates and company lookups. Project discovery, publishing, assignment, evidence submission and company reviews are protected by Supabase Row Level Security.
- The Projects marketplace distinguishes verified-company projects, BuildBridge Practice Projects, and clearly separated external links. Practice briefs are platform-published learning work and are never represented as employer-approved work.
- The Achievement Vault previews only actual issued certificate records. “Download PDF” opens the browser’s vector print dialog; choose **Save as PDF**. The print stylesheet uses landscape A4 and prints only the certificate artwork. Its QR code and certificate ID link to `/verify/<certificate-id>`. Public verification returns only the fields printed on the certificate, not the student’s email, account ID, or private evidence files.

## Setup

Requires **Node.js 22+**. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

### 1. Install

```powershell
npm.cmd install
```

### 2. Configure Supabase

1. Create a Supabase project.
2. Open the SQL Editor and run [`database-schema.sql`](./database-schema.sql) once on a fresh project. Then run [`supabase/auth-setup-repair.sql`](./supabase/auth-setup-repair.sql) to install/repair the profile trigger, auth profile bootstrap, recursion-safe profile policies, API grants and private evidence bucket. Run [`supabase/profile-details.sql`](./supabase/profile-details.sql) for phone/photo fields, [`supabase/learning-ai.sql`](./supabase/learning-ai.sql) for persisted learning features, [`supabase/project-marketplace.sql`](./supabase/project-marketplace.sql) for project metadata, assignments, milestone/evidence tracking, marketplace RLS, and original BuildBridge Practice Projects, followed by [`supabase/certificate-redesign.sql`](./supabase/certificate-redesign.sql) for evidence-backed certificates, explicit company signatory authorization, and public verification. Then apply [`supabase/migrations/20261121030000_project_assignment_milestone_workflow.sql`](./supabase/migrations/20261121030000_project_assignment_milestone_workflow.sql), followed by [`supabase/migrations/20261121040000_platform_identity_notifications.sql
- `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql``](./supabase/migrations/20261121040000_platform_identity_notifications.sql
- `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql`). These additive migrations add assignment attribution, secure company-domain onboarding, one-owner admin enforcement, preferences, notification records and the email outbox. Back up the project and review the SQL before applying it to a hosted database. Do not execute it from the application.
   If no admin account exists yet, practice briefs remain drafts until an admin publishes them. After provisioning the admin, publish eligible drafts from **Admin → Project moderation and practice publishing**. Do not rerun the older marketplace SQL after applying the versioned workflow migration; it would replace some of the newer trigger functions.
   If the app reports that it cannot find a relationship between `projects` and `project_milestones`, run [`supabase/project-milestone-relationship-repair.sql`](./supabase/project-milestone-relationship-repair.sql) in the SQL Editor. It ensures the milestone foreign key exists and asks PostgREST to reload its schema cache.
   After applying the marketplace, certificate, and versioned workflow SQL, the read-only [`supabase/project-workflow-verification.sql`](./supabase/project-workflow-verification.sql) reports RLS, foreign keys, policies, and workflow consistency checks.
3. Create a private Storage bucket named `project-evidence` (10 MB file limit recommended). If the schema setup creates it automatically, confirm it is private.
4. Copy the project URL and anon/publishable key from Project Settings → API. Keep the service-role key server-only.
5. Create `.env.local` from `.env.example` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
YOUTUBE_API_KEY=YOUR_YOUTUBE_DATA_API_V3_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000
ADMIN_OWNER_EMAIL=your-confirmed-deployer-email@example.com
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
RESEND_API_KEY=YOUR_RESEND_API_KEY
EMAIL_FROM=notifications@your-verified-domain.example
EMAIL_FROM_NAME=BuildBridge
CRON_SECRET=YOUR_LONG_RANDOM_CRON_SECRET
UNSUBSCRIBE_TOKEN_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

Never put a Supabase service-role, Resend, Gemini, YouTube, cron, or unsubscribe key in a `NEXT_PUBLIC_` variable or commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `UNSUBSCRIBE_TOKEN_SECRET`, and `ADMIN_OWNER_EMAIL` are server-only.

The Learn page uses `YOUTUBE_API_KEY` on the server to fetch real YouTube video results and public video details. In Google Cloud Console, enable **YouTube Data API v3**, create a key, and restrict it to that API. Store the key in `.env.local` and restart the app. Live AI mentoring and Gemini-generated roadmaps require `GEMINI_API_KEY`; without it, those requests show an explicit configuration error rather than simulated output.

### 3. Configure social sign-in (Google, Microsoft, GitHub, Facebook)

BuildBridge uses Supabase SSR with PKCE. The app contains buttons for these providers, but **each provider must be configured in Supabase before its button can complete sign-in**. Provider client IDs/secrets belong in Supabase Auth settings, not in `.env.local`.

1. Open **Supabase Dashboard → Authentication → Sign In / Providers**.
2. Expand each provider you want to enable and copy its Supabase callback URL. It normally looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Create an OAuth application with the corresponding identity provider and add that exact Supabase callback URL as its redirect/callback URI.
4. Paste that provider's client ID and client secret into the matching Supabase provider settings and enable it.
5. In **Supabase → Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback`. For production, allow `https://build-bridge-kappa.vercel.app/auth/callback` or your actual deployment callback URL.
6. For Microsoft, BuildBridge requests the `email` scope as required by Supabase Azure Auth. Supabase redirects to `/auth/callback`, which exchanges the PKCE code and persists the session in secure cookies.

Provider-specific setup references:
- Google: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- Microsoft / Azure: https://supabase.com/docs/guides/auth/social-sign-in/auth-azure
- GitHub: https://supabase.com/docs/guides/auth/social-sign-in/auth-github
- Facebook: https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook

Admin can never be requested through OAuth or public signup. A new company representative signs up as a student, then opens **Profile → Company account access** and completes the DNS proof and administrator approval process. This grants company-account access only; the organization must still be verified before it can publish projects or approve evidence.

### 4. Provision the deployer-only admin

1. Sign up normally with your own deployer email and confirm the email address.
2. Set `ADMIN_OWNER_EMAIL` to that exact confirmed address in the server environment.
3. Open `supabase/provision-admin.sql` and replace `YOUR_DEPLOYER_EMAIL@example.com` with that exact address.
4. Run the script from the Supabase SQL Editor while signed in as the project owner. It provisions the single database owner used by the RLS admin helper.
5. Confirm the verification query returns exactly your account with role `admin`.

Public sign-up always creates a student profile; metadata cannot grant company or admin access. The database allows only one admin and binds RLS admin access to the provisioned owner record. The application also requires `ADMIN_OWNER_EMAIL` to match the confirmed auth email. Keep Supabase project-owner credentials private.

### 5. Configure company domain verification and email

1. Apply `supabase/migrations/20261121040000_platform_identity_notifications.sql
- `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql`` after the project assignment workflow migration. It adds company domain requests, in-app notifications, preferences, a private email outbox, delivery logs and deadline reminder deduplication.
2. Configure a verified sender domain in Resend, then set `RESEND_API_KEY`, `EMAIL_FROM`, and optionally `EMAIL_FROM_NAME`.
3. Set `SUPABASE_SERVICE_ROLE_KEY` only in the server environment; it is used for domain review and the scheduled outbox worker.
4. Set `APP_BASE_URL` to the canonical site origin, `CRON_SECRET` to a long random secret, and `UNSUBSCRIBE_TOKEN_SECRET` to a different random secret of at least 32 characters.
5. `vercel.json` schedules `/api/cron/notifications` daily at 08:00 UTC. Configure the Vercel environment variable `CRON_SECRET`; Vercel sends it as a bearer token. For local checks, invoke the route with `Authorization: Bearer <CRON_SECRET>`.
6. A company requester adds the DNS TXT record shown in **Profile → Company account access**. The configured admin approves or rejects the domain request under **Admin → Company Verification**. This does not mark a company verified.

### 6. Run the app

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

### 7. Check before deployment

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

### Vercel

Import the public GitHub repository into Vercel and add the same environment variables in Project Settings → Environment Variables. Redeploy after adding/changing them. Test student, company and deployer-admin accounts separately in a private browser window.

## Important operating rules

- Students cannot directly mark milestones complete. Practice milestone progress is recorded after evidence submission; required company milestones become complete only after the assigning verified company approves the evidence.
- AI review never substitutes for company approval of an industry deliverable.
- Only the company that assigned an industry project can review and approve it.
- An approved company must have passed admin verification before publishing opportunities or approving work.
- Certificate issuance is triggered by the verified company-review workflow in the database.
- Company opportunities must have scope, deliverables, acceptance criteria, deadline, revision policy and payment terms defined before students accept.
- Demo/sample opportunities are clearly labelled and must not be presented as live vacancies or paid work.
- Learning recommendations use YouTube Data API search and public video details; saved videos and user-recorded watch/completion activity are persisted in Supabase.
- AI-generated career recommendations are guidance, not guaranteed job suitability or employment outcomes.

## Validation notes

See [`BUILD_VALIDATION.md`](./BUILD_VALIDATION.md) for the checks performed and the hosted Supabase workflows that still require explicit manual validation. External links are separate from project assignments; no external listing is represented as a BuildBridge project or employer partnership.

## Project files

```text
app/
  api/ai/route.ts          # Gemini mentor actions
  api/backend/route.ts     # Authenticated Supabase actions for all roles
  api/company-domain/      # DNS proof and admin domain decisions
  api/cron/notifications/  # Deadline reminders and Resend outbox worker
  api/notifications/       # User notification center
  api/resources/route.ts   # Authenticated YouTube video recommendations
  api/health/route.ts      # Server configuration and connectivity status
  auth/                    # Sign-in, sign-up, callback and recovery pages
  workspace/page.tsx       # Authenticated, server-checked role workspace
  page.tsx                 # Public landing page
  globals.css              # Hybrid light/dark UI system
  layout.tsx               # Metadata and theme configuration
lib/
  supabase.ts              # Browser cookie-based SSR client
  supabase/server.ts       # Request-scoped server client
  supabase/admin.ts        # Server-only service-role client
  types.ts                 # Domain types
supabase/
  provision-admin.sql      # One-deployer admin provisioning
  migrations/              # Additive SQL migrations
database-schema.sql        # PostgreSQL schema, RLS, triggers and certificate gate
```

## Current implementation notes

This package is the current runnable implementation scaffold based on the supplied storyboard and product specification. The dashboard requires real Supabase authentication; demo/preview bypasses have been removed. Email/password auth is handled through a same-origin server route, while social OAuth is initiated by the browser Supabase client so its OAuth redirect tokens are processed by the persistent browser auth client. The authenticated workspace reads records through RLS-protected API routes. Empty states are shown when the database has no records.

See `QUICKSTART-WINDOWS.md` for the fastest local run path.


## Latest additive migration

Apply `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql` after the earlier migrations. It adds profile details, student-owned coursework maps, isolated theory assessments and theory certificates, plus structured opportunity requirements. It does not change the existing project-submission or company-review workflow.

## Recent workflow additions

### Authentication and profile

- Sign-in and registration support Google, GitHub, LinkedIn OIDC, Microsoft/Azure and Facebook. Configure each provider in Supabase Auth and register the Supabase OAuth callback URL with the provider. The application callback is `/auth/callback` on the deployed BuildBridge origin.
- A public signup choice of Student or Company representative is onboarding intent only. All newly created profiles remain `student`; company access is granted only after the existing company-domain verification and administrator approval flow. Never change the database trigger to trust a client-provided role.
- Phone number is optional and stored in E.164 format when valid. Remember me controls the Supabase auth cookie lifetime; unchecked sessions use browser-session cookies rather than storing auth tokens in localStorage.
- Profile education, coursework, location and professional links are saved through the authenticated preferences API. Avatar storage remains private.

### Coursework-first learning and theory credential

- Students can upload a syllabus or assignment as PDF or plain text (`.txt`, `.md`, `.csv`), up to 4 MB. The document is sent to the configured Gemini API for extraction; the original file is not retained. Structured concepts, mapped skills and project suggestions are saved per student.
- A separate theory knowledge check is generated from the uploaded material. Students need at least 80% to receive a `BBT-...` Theory Learning Certificate. Answers are stored separately from the questions and never sent to the browser before submission. `SUPABASE_SERVICE_ROLE_KEY` must be configured server-side for secure quiz creation and grading.
- Theory Learning Certificates are distinct from project-evidence certificates. They verify a knowledge check, not professional experience or project completion. Both credential formats can be checked through `/certificate/verify`.
- YouTube lessons played inside BuildBridge record completion after at least 90% continuous playback in the embedded player. Seeking over material does not count toward watch progress. Opening a video on YouTube externally records an open event, not a completed lesson.

### Company opportunities and matching

- Verified companies can create opportunity drafts and publish internships, freelance assignments, paid micro-projects and entry-level opportunities with scope, deliverables, acceptance criteria, requirements, career goals, location, deadline and compensation details.
- Student opportunity match explanations use exact skill-name matches from demonstrated or company-verified skill evidence and the student's current career goal. Self-declared skills and syllabus topics are not treated as demonstrated. Match labels are informational; students must check employer eligibility, and BuildBridge does not guarantee selection or payment.

### Operational notes

- A browser tab becoming visible or focused refreshes workspace data without forcing the user back to Dashboard. The current screen is retained in session state and the workspace URL.
- Notification items navigate to their relevant workspace view when a supported internal destination is available.
- Dashboard reference screenshots were not included in the latest source archive. The refreshed landing/auth screens use the current brand assets, but any final screenshot-specific dashboard alignment still needs the approved dashboard reference image.
