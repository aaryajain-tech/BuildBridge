# BuildBridge change and validation report

Date: 21 November 2026

## Baseline preserved

The submitted ZIP was extracted to a separate working directory. The existing schema and working flows were inspected before changes. Existing project assignment, milestone evidence, review decisions, certificate validation, company domain verification, admin provisioning, notification delivery and private avatar paths were kept in place. Changes are additive and targeted; no existing table was dropped or renamed.

## Implemented in this update

- Split-screen sign-in and signup presentation using the existing BuildBridge logo, with the tagline updated to “Bridging traditional learning to real-world work”.
- Optional international phone input and E.164 validation, five social sign-in providers, safe OAuth callback routing, signup intent preservation, and a Remember me control backed by session versus persistent auth cookies.
- Public registration continues to create student profiles only. Company representative signup redirects to the existing domain/administrator verification process rather than assigning a privileged role.
- Expanded profile editor and preferences API for degree, branch/department, academic year, graduation year, GPA/percentage, coursework, location, skills and professional links.
- Workspace screen restoration through the URL and session state, focus/visibility refresh, removal of the redundant Profile sidebar item, and clickable student dashboard metrics for projects, milestones, applications and certificates.
- Public landing-page journey preview using shared Learn → Build → Prove → Earn definitions.
- Coursework-first PDF/text upload, structured concept and skill mapping, suggested project directions, persisted structured maps and a separate server-graded theory knowledge check. A score of at least 80% issues a distinct `BBT-...` Theory Learning Certificate. Answer keys are stored separately from browser-visible questions.
- Embedded YouTube watch tracking. Completion is recorded after at least 90% continuous playback; external opens are not counted as completed lessons.
- Company opportunity creation and publishing for verified companies, structured skill/career/experience/location/compensation requirements, explainable student matching from demonstrated/company-verified evidence, and application status display.
- Notification click-through routing to supported workspace sections.
- New additive migration, deployment guide and updated README.

## Required deployment actions

1. Apply `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql` after the earlier schema/migrations.
2. Configure `GEMINI_API_KEY` and the server-only `SUPABASE_SERVICE_ROLE_KEY` for coursework analysis and secure knowledge-check grading.
3. Configure OAuth provider credentials and redirect URLs in Supabase Auth.
4. Configure optional YouTube and email integration credentials where those services are used.

## Validation status



- Coursework upload currently supports PDF and plain text files up to 4 MB; DOCX parsing is not included.
- Theory certificates validate a generated knowledge check and remain distinct from project-evidence/industry certificates. They do not prove professional experience.
- Opportunity matching deliberately uses exact normalized skill and career-goal matches. It does not infer eligibility or guarantee an employer response, selection or payment.
- Provider authentication, outbound email and live YouTube discovery require valid external configuration.



## Automated build result

Dependencies could not be installed and the production build was not run. Install with `npm ci` in an environment with registry access, then run `npm run build`.
