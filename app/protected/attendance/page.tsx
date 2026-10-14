import { requireAcademyRole } from "@/lib/academy/auth";
import { createAttendanceSession, markManualAttendance } from "@/lib/academy/actions";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; session?: string }>;
}) {
  const { supabase, role } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: classes }, { data: sessions }, { data: students }, { data: records }] = await Promise.all([
    supabase.from("classes").select("id,name,section"),
    supabase.from("attendance_sessions").select("id,class_id,session_date,expires_at,active"),
    supabase.from("students").select("id,full_name,student_code,class_id,active").eq("active", true),
    supabase.from("attendance_records").select("id,session_id,student_id,status,marked_at,source"),
  ]);

  const selectedSession = (sessions ?? []).find((item) => item.id === params.session);
  let qrDataUrl = "";
  if (selectedSession && selectedSession.active && new Date(selectedSession.expires_at).getTime() > Date.now()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(`qr-attendance-${selectedSession.id}`)?.value;
    if (token) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://digitalice-one.vercel.app";
      const checkInUrl = new URL("/protected/attendance/check-in", siteUrl);
      checkInUrl.searchParams.set("session", selectedSession.id);
      checkInUrl.hash = `token=${encodeURIComponent(token)}`;
      const QRCode = require("qrcode") as {
        toDataURL: (text: string, options: { width: number; margin: number; errorCorrectionLevel: string }) => Promise<string>;
      };
      qrDataUrl = await QRCode.toDataURL(checkInUrl.toString(), {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    }
  }

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Attendance</h1><p className="mt-2 text-slate-500">Create sessions, share short-lived QR codes, and record manual attendance.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Attendance data saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Action failed. Check the session, class, duplicate entry and RLS permissions.</p>}
    {params.session && !qrDataUrl && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">QR token is not available in this browser session, or the session has expired. Create a new attendance session to generate a fresh QR code.</p>}
    {qrDataUrl && selectedSession && (
      <section className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <img src={qrDataUrl} alt="Short-lived QR attendance check-in code" className="h-56 w-56 self-center rounded-lg border border-slate-200 p-2" />
        <div>
          <h2 className="text-xl font-bold">QR check-in ready</h2>
          <p className="mt-2 text-sm text-slate-600">Students in the assigned class can scan this code with their signed-in account. The token is short-lived and is not stored in the database in plain text.</p>
          <p className="mt-3 text-sm"><strong>Session:</strong> {selectedSession.id.slice(0, 8)}</p>
          <p className="mt-1 text-sm"><strong>Expires:</strong> {new Date(selectedSession.expires_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</p>
          <p className="mt-3 text-xs text-slate-500">Do not share this QR outside the class. A student can check in only once for this session.</p>
        </div>
      </section>
    )}
    <form action={createAttendanceSession} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-3">
      <h2 className="font-bold sm:col-span-3">Create attendance session</h2>
      <select name="class_id" required className="rounded-lg border p-3"><option value="">Choose class</option>{(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section ?? ""}</option>)}</select>
      <input name="session_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="rounded-lg border p-3" />
      <input name="expires_at" type="datetime-local" required className="rounded-lg border p-3" />
      <button className="rounded-lg bg-blue-900 p-3 text-white sm:col-span-3">Create session</button>
    </form>
    <form action={markManualAttendance} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-4">
      <h2 className="font-bold sm:col-span-4">Record attendance manually</h2>
      <select name="session_id" required className="rounded-lg border p-3"><option value="">Choose active session</option>{(sessions ?? []).filter(s => s.active && new Date(s.expires_at).getTime() > Date.now()).map(s => <option key={s.id} value={s.id}>{s.session_date} · {s.id.slice(0,8)}</option>)}</select>
      <select name="student_id" required className="rounded-lg border p-3"><option value="">Choose student</option>{(students ?? []).map(s => <option key={s.id} value={s.id}>{s.student_code} · {s.full_name}</option>)}</select>
      <select name="status" className="rounded-lg border p-3"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="excused">Excused</option></select>
      <button className="rounded-lg bg-blue-900 p-3 text-white">Save attendance</button>
    </form>
    <section className="overflow-x-auto rounded-2xl border bg-white p-5">
      <h2 className="mb-3 font-bold">Sessions ({sessions?.length ?? 0}) · Records ({records?.length ?? 0})</h2>
      <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Date</th><th className="p-2">Session</th><th className="p-2">Expires</th><th className="p-2">Active</th></tr></thead><tbody>
      {(sessions ?? []).map(s => <tr key={s.id} className="border-b"><td className="p-2">{s.session_date}</td><td className="p-2">{s.id.slice(0,8)}</td><td className="p-2">{new Date(s.expires_at).toLocaleString()}</td><td className="p-2">{s.active ? "Yes" : "No"}</td></tr>)}
      </tbody></table>
      <p className="mt-4 text-xs text-slate-500">Teachers can reopen a QR only in the browser session that created it. Expired tokens cannot be reused.</p>
    </section>
  </div>;
}
