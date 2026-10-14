# Security Audit — Academy LMS

**Status:** Preliminary hardening in progress; not a zero-vulnerability certification.  
**Last reviewed:** 2026-10-14  
**Repository:** https://github.com/iamshbah/qr-attendence-lms

## Executive summary

Recent work added a protected Super Admin security console, a server-side initial Super Admin bootstrap, database-side successful-login audit logging, and role-management RPCs. Several database permission changes were applied and checked against the live Supabase project.

The application is **not yet fully verified for production security**. No authenticated end-to-end BAC/IDOR test suite or full production build has been run against the latest commit. The designated Super Admin account does not exist in Supabase yet, so the console and role-management flow cannot be validated with that identity.

## Confirmed checks

- All 13 public tables reported by PostgreSQL have Row Level Security enabled.
- profiles.role has only SELECT column privilege for authenticated; no INSERT/UPDATE grant was found for the role column on anon or authenticated.
- anon and authenticated no longer have TRUNCATE, TRIGGER, or REFERENCES table privileges in the public schema.
- public.audit_logs is readable only by authenticated callers whose profile role is exactly super_admin; anonymous SELECT was revoked. Direct writes by anon and authenticated were revoked.
- A trigger exists on auth.users.last_sign_in_at changes to record successful sign-in events into public.audit_logs. This is intended to capture successful sign-ins when Supabase updates that field; it does not record failed sign-ins.
- A private auth.users trigger promotes only the exact designated email after email verification, creates/updates the matching profile safely, and removes the Super Admin role if that identity changes its email away from the designated address. The former public bootstrap RPC has been dropped.
- public.super_admin_list_users() and public.super_admin_set_user_role() include explicit database-side Super Admin checks. Role changes cannot assign super_admin, change the caller's own role, or change the designated identity through the role-management RPC.
- The exposed QR attendance RPC is not executable by anon; it is executable only by authenticated callers and must continue validating the session token, user, class, expiry, and duplicate attendance.

## Findings fixed during this pass

- **Teacher cross-class access:** the previous policies allowed teachers to read all student records, classes, attendance sessions, and attendance records. Policies now scope teacher reads and session mutations to classes assigned to that teacher.
- **Attendance object integrity:** attendance insertion now checks in PostgreSQL that the session is active and unexpired, the student is active and belongs to the session's class, and the actor is an authorized admin or assigned teacher. Session creation is limited to a 24-hour expiry window; teacher session updates are scoped to their own assigned class.
- **QR flow:** the teacher session action now stores only a SHA-256 token hash in the database and keeps the raw token in an HttpOnly, SameSite=Strict, expiring cookie for rendering the QR. The QR embeds the token in the URL fragment (not the initial HTTP request query); the student check-in route sends it to the validating RPC. The QR RPC now uses an empty search_path and the database has a unique constraint on (session_id, student_id) to prevent duplicate attendance.
- These changes are **implemented but not yet end-to-end tested** with separate real student and teacher accounts. Do not treat them as fully verified until the latest build and negative authorization tests pass.

## Current security-advisor findings

Supabase Security Advisor still reports:
1. auth_leaked_password_protection — **Warning**: leaked-password protection is disabled. Enable it in Supabase Dashboard → Authentication → Password Security.
2. authenticated_security_definer_function_executable — **Warning** for three intentionally exposed functions:
   - public.bootstrap_initial_super_admin()
   - public.mark_attendance_with_qr(uuid, text)
   - public.super_admin_list_users()
   - public.super_admin_set_user_role(uuid, public.app_role)

These functions use a fixed empty search_path and are intended to enforce authorization internally, but the advisor warning remains. They require negative authorization tests and continued review. The warning must not be represented as a passed check.

## Code changes

- Added app/protected/super-admin/page.tsx with account/role management and recent activity views.
- Added app/protected/super-admin/actions.ts, which re-checks the Super Admin role before invoking the role-management RPC.
- Updated lib/academy/auth.ts to invoke the guarded bootstrap for the designated email and permit the super_admin role through the server-side role guard.
- Updated components/login-form.tsx to verify the bootstrap result after successful login for the designated email.
- Updated protected navigation and dashboard module visibility for the Super Admin.
- Added SQL migration files for recent database hardening changes under supabase/migrations/.\n- Added a Super Admin TOTP enrollment/verification route and confirmation before role changes.\n- Wired QR attendance creation and student check-in; the raw token is not stored in the database.

## Important limitations and unverified risks

- **Super Admin account:** the designated account was not present at the time of checking; no Super Admin profile exists yet.
- **Failed login history:** not implemented as a trustworthy audit event. Use supported Supabase Auth logs/hooks or a secure log drain. Do not trust a browser-generated event as proof of a failed login.
- **MFA:** a TOTP enrollment/verification route and server-side AAL2 requirement for Super Admin operations have been implemented in code, but the end-to-end flow has not yet been built or tested against a real Super Admin account.
- **BAC/IDOR:** RLS is enabled, but every endpoint/object-ownership policy has not yet been covered by negative tests with separate student, teacher, admin, and Super Admin identities.
- **Build/deployment:** the latest deployment build is still in progress. The latest GitHub changes must be built and tested before they can be considered live.
- **Migration history:** the repository did not previously contain the full set of migrations for the existing database. Recent hardening migrations are now tracked, but the complete database bootstrap/migration history still needs reconciliation before claiming reproducible fresh-project setup. The latest auth-trigger migration file now matches the recorded remote version; the older database baseline migrations still need reconciliation before a fresh-project setup can be considered reproducible.
- **Email:** Resend has three draft templates but no configured sending domain; production email sending is not ready.
- **Figma:** the existing design file was inspected, but the Starter-plan MCP call limit prevented further edits in this run.

## Required next verification

1. Enable Supabase leaked-password protection.
2. Register and verify the designated Super Admin account.
3. Confirm the bootstrap assigns the role only to that exact verified identity.
4. Test denied RPC calls as anonymous, student, teacher, and ordinary admin users.
5. Test cross-student and cross-teacher object IDs across all Server Actions, Route Handlers, and exposed RPCs.
6. Add and run Super Admin MFA/AAL enforcement tests.
7. Configure and validate trusted failed-auth logging.
8. Run lint, type checking, tests, dependency audit, and production build on the latest commit.
9. Verify the resulting Vercel deployment and test the deployed application.
10. Configure a verified Resend sending domain before enabling transactional email.

## Reporting rule

Do not claim “100% secure,” “unhackable,” or “zero vulnerabilities.” A passing check means only the exact check was executed and passed; untested areas remain unverified.
