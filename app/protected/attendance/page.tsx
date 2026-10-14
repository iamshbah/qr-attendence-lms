import { requireAcademyRole } from "@/lib/academy/auth";
import { createAttendanceSession, markManualAttendance } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: classes }, { data: sessions }, { data: students }, { data: records }] = await Promise.all([
    supabase.from("classes").select("id,name,section"),
    supabase.from("attendance_sessions").select("id,class_id,session_date,expires_at,active"),
    supabase.from("students").select("id,full_name,student_code,class_id,active").eq("active", true),
    supabase.from("attendance_records").select("id,session_id,student_id,status,marked_at,source"),
  ]);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Attendance</h1><p className="mt-2 text-slate-500">Create sessions and record manual attendance.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Attendance data saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Action failed. Check the session, class, duplicate entry and RLS permissions.</p>}
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
      <p className="mt-4 text-xs text-slate-500">QR scanning and offline queue are not enabled by this initial page.</p>
    </section>
  </div>;
}
