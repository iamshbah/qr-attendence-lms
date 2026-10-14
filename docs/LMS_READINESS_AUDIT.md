# LMS Readiness Audit — Digitalice Academy LMS

**Review date:** 2026-10-14  
**Repository:** https://github.com/iamshbah/qr-attendence-lms  
**Live alias:** https://digitalice-one.vercel.app  
**Status:** Feature implementation improved; not yet certified production-ready.

## Executive verdict

The project has a real Next.js/Supabase LMS foundation, role-aware routes, student learning pages, course/lesson/assignment/exam/result/fee modules, QR attendance sessions, RLS protections and a Super Admin security console. A deployment had previously reached Vercel READY and CI passed lint, TypeScript, production build and the production dependency audit.

However, this audit found only one Auth user/profile in the live database and no students, classes, courses, attendance sessions or attendance records. The live app could not be fetched through the connected Vercel integration because its project/team scope returned 403. The designated Super Admin identity is not yet set up and MFA has not been tested end-to-end. Therefore the LMS is **not yet ready for a real academy rollout**.

## What is present in the application

| Area | Current implementation | Readiness |
|---|---|---|
| Student interface | My Learning page reads linked student record, published courses/lessons, assignments/submissions, attendance, results and fees | Implemented; requires linked student + data tests |
| Teacher interface | Assigned-class-aware student/attendance/course/assignment/exam routes; manual attendance | Implemented; workflow not end-to-end tested |
| Admin interface | Student admissions, attendance sessions, fee tracking, courses, assignments, exams/results | Implemented; requires test data and workflow validation |
| Super Admin | User/role console, audit log view, TOTP/AAL2 checks | Code present; designated account/MFA not verified |
| Student ID card generator | Added /protected/id-cards; print-ready cards with QR payload containing only STU:<student_code> | Code added; print/browser QA pending |
| Fast staff scanner | Added camera scanner using html5-qrcode; server validates active session, teacher's class assignment, active student, class match and duplicate records | Code added; real device/browser QA pending |
| Student self-check-in | Existing short-lived session QR; hashed token stored in DB; server-side RPC validates token, role, class, expiry and duplicates | Code present; real student flow pending |
| Email | Resend templates are drafts; sending domain not verified | Not live-ready |
| Security | RLS on all 13 public tables; AAL2 for Super Admin; class-scoped teacher policies | Strong baseline; negative tests and remaining advisor findings unresolved |

## Research findings applied

1. Moodle's official Attendance activity separates teacher session/register management from the student's own attendance record, supports Present/Late/Absent/Excused statuses, reports and exports: https://docs.moodle.org/500/en/Attendance_quick_guide and https://docs.moodle.org/400/en/Attendance_module.
2. OWASP says authentication is not authorization: each request must enforce object-specific permissions and IDOR prevention, and authorization logic needs unit/integration tests: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html.
3. Browser camera access requires a secure context and user permission. The native BarcodeDetector API is not supported consistently enough to be the only production scanner: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia and https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API. The new staff scanner uses the project's html5-qrcode dependency instead of relying on the native API alone.
4. Static student-card QR codes can be copied. The new card QR contains only a student code, and the server requires authenticated staff, a valid session, matching class, active student and duplicate protection. Staff must visually verify the cardholder; this is not biometric proof and cannot by itself prevent proxy attendance. The existing short-lived session QR remains available for student self-check-in.

## Live checks performed

- Supabase project is ACTIVE_HEALTHY.
- Database currently has 1 Auth user/profile, 0 students, 0 classes, 0 courses, 0 attendance sessions and 0 attendance records.
- All 13 public tables have RLS enabled.
- Security Advisor still reports leaked-password protection disabled and three authenticated SECURITY DEFINER RPC warnings; review each guarded RPC rather than ignoring warnings.
- Performance Advisor reports one RLS init-plan warning and multiple permissive policies on several tables, plus unused-index informational findings.
- CI previously passed lint, TypeScript, production build and production dependency audit (0 production dependency findings). Full audit still reports 10 development/build-tooling findings (3 moderate, 7 high).
- Vercel integration denied live fetch/deployment inspection with 403 because the connected scope is not authorized for the target project/team. This is not evidence that the site itself is down.

## Required before real rollout

1. Create and verify the designated Super Admin account, then enroll TOTP MFA and test AAL2.
2. Create test class, teacher, linked student, course, lesson, assignment, session and attendance records.
3. Test the ID-card print layout on desktop and mobile print/PDF.
4. Test scanner on Android Chrome and iPhone Safari, camera denied, no camera, low light, invalid QR, inactive student, wrong class, expired session and repeated scan.
5. Test student self-check-in, manual attendance, duplicate attendance, and cross-class teacher access with separate accounts.
6. Enable Supabase leaked-password protection.
7. Reconnect Vercel integration to the correct team/project and fetch the live page; confirm the deployment commit and alias.
8. Verify a domain in Resend before enabling transactional mail.
9. Reconcile baseline migrations and run a fresh-project bootstrap test.
10. Review the remaining dependency and Supabase Advisor findings.

## Go/no-go

**Current recommendation: NO-GO for live academy attendance until test data and the above end-to-end tests pass.** The application has substantial LMS functionality, but a successful build/deployment is not proof that all roles, camera scanning, printing, data access and operational flows work in production. Do not call it 100% ready or unhackable.
