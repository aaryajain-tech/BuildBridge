# BuildBridge Database Migration Guide

The web deployment never applies Supabase SQL automatically. Back up the project before any production change. The SQL files below are manual operations in the Supabase SQL Editor.

## Existing BuildBridge Database

Do not run `database-schema.sql` against an existing project. It is an initial-install schema, not a production upgrade script.

1. Take a Supabase backup and run `supabase/preflight-existing-database.sql`. Save the output. Confirm `public.profiles`, `public.projects`, and `public.companies` exist; confirm `projects.status` is `public.project_status`; inspect all missing-table/column, policy, foreign-key, slug-duplicate, and admin-owner diagnostics.
2. If the preflight reports multiple admin profiles, duplicate project slugs, a non-enum project status, or unexpected foreign keys, stop and resolve the discrepancy with a reviewed, data-preserving change. Do not delete records or convert the status enum as part of this migration.
3. Apply `supabase/auth-setup-repair.sql` only after confirming the preflight has at most one admin profile and the existing spaced profile policies can be updated. It replaces only named BuildBridge policies and functions; it does not drop tables or unrelated policies.
4. Apply `supabase/profile-details.sql` and `supabase/learning-ai.sql` if those profile/photo and learning tables/features are not already installed. They are additive and recreate only their named triggers/policies.
5. Apply `supabase/migrations/20261121020000_existing_database_compatibility.sql`. It adds missing marketplace columns, preserves the existing `project_status` enum, keeps `company_user_id` nullable, and fails rather than converting a mismatched status type or deleting duplicate-slug projects.
6. Apply `supabase/migrations/20261121030000_project_assignment_milestone_workflow.sql`.
7. Apply `supabase/migrations/20261121040000_platform_identity_notifications.sql`.
8. Apply `supabase/migrations/20261121050000_profile_and_auth_enhancements.sql`.
9. Review `supabase/certificate-redesign.sql` before applying it. It intentionally changes legacy `industry_completion` certificates to revoked because those records do not satisfy the current full-project approval and named-signatory requirements. Review affected record counts and take a backup first; do not apply if this business decision is not approved.
10. Run `supabase/postflight-existing-database.sql` and `supabase/project-workflow-verification.sql`. Investigate missing tables, disabled RLS, unexpected policies, missing foreign keys, duplicate slugs, or an admin owner result other than exactly one confirmed match.
11. Provision the one platform owner only after their Auth email is confirmed. Set server-only `ADMIN_OWNER_EMAIL` to the same address, replace the placeholder in `supabase/provision-admin.sql`, and run it as the Supabase project owner.

The compatibility migration is intentionally limited to the project columns required before the numbered workflow migrations. The numbered migrations create missing assignment, milestone, company-domain, notification, coursework, quiz, and theory-certificate tables with `IF NOT EXISTS`. Existing project and submission rows are retained.

Do not run `supabase/project-marketplace.sql` after the versioned project workflow migration: it is the earlier marketplace installer and can replace workflow policies/functions. Existing databases that need the historical BuildBridge Practice Project seed should review that file separately and apply only the approved seed statements; do not replay its whole installer over production.

## Fresh Supabase Project

1. Run `database-schema.sql` once on a genuinely empty BuildBridge Supabase project.
2. Run `supabase/auth-setup-repair.sql`, then `supabase/profile-details.sql` and `supabase/learning-ai.sql`.
3. Run `supabase/project-marketplace.sql` to install the marketplace and its initial practice-project catalogue.
4. Run `supabase/migrations/20261121020000_existing_database_compatibility.sql`, then the `20261121030000`, `20261121040000`, and `20261121050000` migrations in timestamp order.
5. Review and apply `supabase/certificate-redesign.sql`; it revokes legacy certificate records from the initial schema under the current issuer rules.
6. Run the postflight and workflow verification scripts. Provision the confirmed platform owner last.

## Rollback

These SQL changes are additive, but policy/function replacement and certificate status updates are not safely reversed by dropping objects. Do not run reverse SQL or drop tables to roll back an application deployment. Restore the pre-migration Supabase backup only with an approved recovery plan; otherwise use a forward-fix migration. Vercel rollback does not roll back Supabase schema or records.

No SQL in this repository has been applied to the live Supabase project or verified against its current catalog from this workspace.
