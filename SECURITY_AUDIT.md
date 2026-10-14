# Security Audit — Academy LMS

**Status:** Hardening implemented; production verification is still in progress. This is not a zero-vulnerability certification.  
**Last reviewed:** 2026-10-14  
**Repository:** https://github.com/iamshbah/qr-attendence-lms

## Executive summary

The current code includes a Super Admin security console, a private verified-email bootstrap trigger, TOTP enrollment and AAL2 checks, protected user/role management, successful-login auditing, class-scoped attendance policies, and a QR check-in flow.

The most recent full CI run passed lint, TypeScript type-checking, and the production build. The production dependency audit reported zero vulnerabilities. The full dependency audit still reports development-tooling advisories described below. The resulting dependency lockfile was committed; the committed tree must be rechecked by CI and deployed to Vercel before it is considered live.

The designated Super Admin account does not yet exist in Supabase, so the actual Super Admin onboarding/MFA flow has not been tested with that identity.

## Confirmed database checks

- All 13 public tables have Row Level Security enabled; zero public tables were found with RLS disabled.
- profiles.role has only SELECT column privilege for authenticated; no INSERT/UPDATE grant was found for the role column on anon or authenticated.
- anon and authenticated do not have TRUNCATE, TRIGGER, or REFERENCES privileges on public tables.
- public.audit_logs is readable only by an authenticated user whose profile role is exactly super_admin and whose JWT assurance level is aal2. Anonymous reads and direct client writes are revoked.
- A private trigger records successful sign-ins when auth.users.last_sign_in_at changes. It does not record failed sign-ins.
- A private auth.users trigger promotes only the exact designated email after verification, ensures a profile exists, and removes the Super Admin role if that identity changes its email away from the designated address. The former public bootstrap RPC has been dropped.
- public.super_admin_list_users() and public.super_admin_set_user_role() require both the Super Admin database role and AAL2. Role changes cannot assign super_admin, change the caller's own role, or change the designated identity through the role-management RPC.
- private.has_role only grants the Super Admin bypass when the JWT assurance level is aal2.
- The QR attendance RPC is not executable by anon, uses an empty search_path, checks the actual student role, token hash, class, active/expiry state, and duplicate attendance.
- Teacher reads and session changes are scoped to assigned classes. Attendance inserts are checked in PostgreSQL for active/unexpired sessions, active students, matching class, and an authorized actor.

## Findings fixed during this pass

- **BAC/IDOR in teacher attendance access:** prior policies allowed teachers to read student, class, session, and attendance data too broadly. The live policies now scope those reads and mutations to classes assigned to the teacher.
- **Attendance integrity:** database policies now reject cross-class attendance and expired sessions, and session creation is limited to a 24-hour expiry window.
- **QR flow:** the raw token is held in an HttpOnly, SameSite=Strict, expiring cookie for QR rendering; only its SHA-256 hash is stored in the database. The QR carries the token in the URL fragment, and the student check-in route submits it to the validating RPC.
- **Super Admin authorization:** app routes/actions and database policies/RPCs require AAL2 for Super Admin access. The TOTP enrollment/verification UI is implemented.
- **Browser security headers:** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, and a Permissions-Policy were added.
- These changes are implemented but **have not been end-to-end tested** with separate real student, teacher, admin, and Super Admin accounts. Do not treat the authorization matrix as fully verified until those negative tests pass.

## Current Supabase Security Advisor findings

1. **Leaked-password protection disabled:** enable it in Supabase Dashboard → Authentication → Password Security.
2. **Three SECURITY DEFINER RPC warnings remain:**
   - public.mark_attendance_with_qr(uuid, text)
   - public.super_admin_list_users()
   - public.super_admin_set_user_role(uuid, public.app_role)

These RPCs are intentionally exposed to authenticated callers and perform explicit authorization checks, use a fixed empty search_path, and restrict anonymous execution. The advisor warnings remain and require continued review; they are not being reported as passed.

## Dependency audit

- CI: lint passed, TypeScript passed, production build passed.
- Production dependency audit: `npm audit --omit=dev --audit-level=high` reported **0 vulnerabilities** on the CI-resolved dependency tree.
- Full dependency audit: **10 development-tooling findings remain (3 moderate, 7 high)**. The main high-severity advisory is [GHSA-vfj7-8cjw-p6xm for braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affecting published versions through 3.0.3; the advisory currently lists no patched upstream version. The moderate [GHSA-rj75-hqrm-r3gf for postcss-selector-parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) affects versions below 7.1.6. These are in the development/build tooling tree, not the production dependency audit. Do not claim the full dependency tree is vulnerability-free.
- The ESLint configuration was migrated to the native Next.js 16 flat configuration described in the [official Next.js ESLint documentation](https://nextjs.org/docs/app/api-reference/config/eslint).

## Code and migration changes

- Added app/protected/super-admin/page.tsx and app/protected/super-admin/actions.ts for the protected user/role and audit console.
- Added components/super-admin/mfa-gate.tsx and app/auth/mfa/page.tsx for TOTP setup/verification.
- Added components/super-admin/role-change-form.tsx to confirm sensitive role changes.
- Updated lib/academy/auth.ts to enforce Super Admin AAL2 on protected server actions.
- Added successful-login audit trigger, restricted role-management RPCs, and teacher-class attendance RLS policies.
- Wired QR session creation and authenticated student check-in.
- Added SQL migration files for recent hardening changes under supabase/migrations/.
- Added GitHub Actions CI for lint, type-check, production build, and dependency audits.

## Remaining risks and manual requirements

- **Super Admin account:** the designated account is not present in Supabase yet; current check returned zero Super Admin profiles.
- **Failed login history:** not implemented as a trustworthy audit event. It requires a supported Supabase Auth hook/log drain. Browser-generated failure events are not proof of an actual failed login.
- **MFA and QR tests:** both flows still need end-to-end verification with real test accounts and negative cases.
- **Migration history:** the repository now tracks recent security migrations, but the original database baseline migrations are still absent from the repository. A fresh-project bootstrap is not yet reproducible from this repo alone.
- **Deployment:** the latest code/lockfile must be deployed and verified on Vercel. Earlier deployments failed before the lint/type fixes; do not treat those as the current live build.
- **Password security:** enable leaked-password protection manually in Supabase Dashboard.
- **Email:** Resend has three draft templates but no verified sending domain. Live transactional email is not ready until a domain is owned and verified.
- **Figma:** the existing design file was inspected, but the Figma Starter-plan tool limit prevented edits during this run.

## Required next verification

1. Register and verify imrankhanshahaniofficial@gmail.com.
2. Confirm the auth trigger assigns Super Admin only to that exact verified identity.
3. Complete TOTP enrollment and confirm AAL2 is required for direct RPC/Data API calls as well as app routes.
4. Run negative tests for anonymous callers, student-to-student IDOR, teacher cross-class access, ordinary-admin role escalation, forged audit writes, invalid/expired/replayed QR tokens, and role changes.
5. Enable leaked-password protection and configure trusted failed-auth logging.
6. Confirm CI passes on the committed lockfile and deploy the latest commit to Vercel.
7. Configure a verified Resend sending domain before enabling email.
8. Reconcile the missing baseline migrations before attempting a fresh-project database setup.

## Reporting rule

Do not claim “100% secure,” “unhackable,” or “zero vulnerabilities.” Only mark a check as passed if it was executed and its result was recorded. Untested areas remain unverified.
