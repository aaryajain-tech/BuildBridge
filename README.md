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
- The public landing page, auth pages and authenticated workspaces are separate routes. Supabase SSR cookies and PKCE protect server-rendered `/workspace` and project detail pages. Email/password and Google, GitHub, LinkedIn OIDC and Microsoft/Azure sign-in use the callback at `/auth/callback`; each provider still requires real credentials in Supabase.
- New accounts always start as students regardless of signup metadata. Company access requires a confirmed organization email, DNS ownership proof, and a separate administrator decision. Company verification and publishing authorization remain additional checks.
- Notification records and per-user preferences are stored in Supabase. Email is queued and sent by the scheduled `/api/cron/notifications` worker; failures are logged and retried. Email delivery requires a verified Resend sender and server-only secrets.
- `/api/health` reports whether the deployment has Supabase/Gemini/YouTube configuration and whether the server can reach Supabase. It does not expose credentials. Open `/api/health` on your local or deployed app to inspect it.
- The authenticated backend supports profile, project catalogue/details, student assignments and milestone evidence, opportunities, certificates and company lookups. Project discovery, publishing, assignment, evidence submission and company reviews are protected by Supabase Row Level Security.
- The Projects marketplace distinguishes verified-company projects, BuildBridge Practice Projects, and clearly separated external links. Practice briefs are platform-published learning work and are never represented as employer-approved work.
- The Achievement Vault previews only actual issued certificate records. “Download PDF” opens the browser’s vector print dialog; choose **Save as PDF**. The print stylesheet uses landscape A4 and prints only the certificate artwork. Its QR code and certificate ID link to `/verify/<certificate-id>`. Public verification returns only the fields printed on the certificate, not the student’s email, account ID, or private evidence files.

## Setup

Requires **Node.js 22+**. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

For Windows installation and local run instructions, see [`QUICKSTART-WINDOWS.md`](QUICKSTART-WINDOWS.md). Use `npm.cmd ci` for a clean install.

For database operations, see [`docs/DATABASE-MIGRATIONS.md`](docs/DATABASE-MIGRATIONS.md). It distinguishes a fresh Supabase installation from an existing BuildBridge database and starts existing-database work with read-only preflight SQL. Do not run `database-schema.sql` against Production or replay the older `supabase/project-marketplace.sql` after the versioned project workflow migration.

For OAuth providers, Vercel Preview/Production environment configuration, branch validation and rollback, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Google Cloud's authorized redirect URI must be Supabase's `/auth/v1/callback`; BuildBridge's `/auth/callback` belongs in the Supabase Auth redirect allowlist.

Public sign-up always creates a student. Company access requires confirmed email, DNS ownership proof and administrator approval; organization publishing is verified separately. Admin access requires the one manually provisioned, confirmed owner to match both `ADMIN_OWNER_EMAIL` and `platform_admin_owner`.

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

## Demo mode

Open `/demo` to explore a local, no-login workspace using sample student data. Switch roles with `/demo?role=company` or `/demo?role=admin`. Demo mode does not connect to Supabase or create database records.


## Latest additive migration

Apply `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql` after the earlier migrations. It adds profile details, student-owned coursework maps, isolated theory assessments and theory certificates, plus structured opportunity requirements. It does not change the existing project-submission or company-review workflow.

## Recent workflow additions

### Authentication and profile

- Sign-in and registration support Google, GitHub, LinkedIn OIDC and Microsoft/Azure. Configure each provider in Supabase Auth and register the Supabase OAuth callback URL with the provider. The application callback is `/auth/callback` on the deployed BuildBridge origin.
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
