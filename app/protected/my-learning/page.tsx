import Link from "next/link";
import { requireAcademyRole } from "@/lib/academy/auth";

export const dynamic = "force-dynamic";

export default async function MyLearningPage() {
  const { supabase, user } = await requireAcademyRole(["student"]);
  const { data: student } = await supabase
    .from("students")
    .select("id, student_code, full_name, class_id, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-bold text-amber-950">Student profile not linked yet</h1>
        <p className="mt-3 leading-7 text-amber-900">Your account is created, but the academy administrator still needs to link it to your student record. Please contact the academy office and share your registered email address.</p>
      </section>
    );
  }

  const [{ data: courseRows }, { data: attendanceRows }, { data: resultRows }, { data: feeRows }] = await Promise.all([
    supabase.from("courses").select("id,title,description,published,class_id").eq("published", true).eq("class_id", student.class_id),
    supabase.from("attendance_records").select("id,status,marked_at,session_id").eq("student_id", student.id).order("marked_at", { ascending: false }).limit(20),
    supabase.from("results").select("id,exam_id,marks_obtained,remarks,updated_at").eq("student_id", student.id).order("updated_at", { ascending: false }).limit(20),
    supabase.from("fee_records").select("id,amount,fee_month,due_date,paid_at,receipt_number").eq("student_id", student.id).order("fee_month", { ascending: false }).limit(12),
  ]);
  const courses = courseRows ?? [];
  const attendance = attendanceRows ?? [];
  const results = resultRows ?? [];
  const fees = feeRows ?? [];
  const presentCount = attendance.filter((r) => r.status === "present" || r.status === "late").length;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 p-7 text-white shadow-lg">
        <p className="text-sm text-blue-100">Student portal · {student.student_code}</p>
        <h1 className="mt-2 text-3xl font-bold">Assalam-o-Alaikum, {student.full_name}</h1>
        <p className="mt-2 text-blue-100">Your courses, attendance, results and fee records in one place.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Published courses", String(courses.length)],
          ["Recent attendance", String(attendance.length)],
          ["Results available", String(results.length)],
          ["Outstanding fees", String(fees.filter((f) => !f.paid_at).length)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">My courses</h2>
          <div className="mt-4 space-y-3">
            {courses.length ? courses.map((course) => <article key={course.id} className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">{course.title}</h3><p className="mt-1 text-sm text-slate-600">{course.description || "Course material will be shared by your teacher."}</p></article>) : <p className="mt-3 text-sm text-slate-500">No published courses are assigned to your class yet.</p>}
          </div>
          <Link className="mt-4 inline-block text-sm font-semibold text-blue-800 underline" href="/protected/assignments">View assignments</Link>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">Attendance</h2>
          <p className="mt-2 text-sm text-slate-500">Recent records visible to your account.</p>
          <div className="mt-4 space-y-2">
            {attendance.length ? attendance.map((record) => <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>{new Date(record.marked_at).toLocaleDateString()}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-medium capitalize">{record.status}</span></div>) : <p className="text-sm text-slate-500">No attendance records found yet.</p>}
          </div>
          <p className="mt-3 text-xs text-slate-500">{presentCount} present/late records in the recent list.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">My results</h2>
          <div className="mt-4 space-y-2">
            {results.length ? results.map((result) => <div key={result.id} className="rounded-lg border p-3"><p className="font-semibold">{result.marks_obtained} marks</p><p className="mt-1 text-sm text-slate-500">{result.remarks || "No teacher remarks."}</p></div>) : <p className="text-sm text-slate-500">Published results will appear here when available.</p>}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">Fees & receipts</h2>
          <div className="mt-4 space-y-2">
            {fees.length ? fees.map((fee) => <div key={fee.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-semibold">{Number(fee.amount).toLocaleString()}</p><p className="text-slate-500">{String(fee.fee_month).slice(0, 7)} · Due {fee.due_date}</p></div><span className={fee.paid_at ? "text-emerald-700" : "text-amber-700"}>{fee.paid_at ? "Paid" : "Due"}</span></div>) : <p className="text-sm text-slate-500">No fee records found.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
