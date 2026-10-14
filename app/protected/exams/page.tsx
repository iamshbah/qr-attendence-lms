import { requireAcademyRole } from "@/lib/academy/auth";
import { changeExamStatus, createExam, saveResult } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { supabase, role } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: classes }, { data: exams }, { data: students }, { data: results }] = await Promise.all([
    supabase.from("classes").select("id,name,section"),
    supabase.from("exams").select("id,title,class_id,exam_date,total_marks,status"),
    supabase.from("students").select("id,full_name,student_code,class_id").eq("active", true),
    supabase.from("results").select("id,exam_id,student_id,marks_obtained,remarks,updated_at"),
  ]);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Exams & Results</h1><p className="mt-2 text-slate-500">Draft, verify, enter marks, then publish results.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Exam or result saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Action failed. Check workflow, marks, role and database policies.</p>}
    <form action={createExam} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">Create exam (draft)</h2>
      <input name="title" required placeholder="Exam title" className="rounded-lg border p-3" />
      <select name="class_id" required className="rounded-lg border p-3"><option value="">Choose class</option>{(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section ?? ""}</option>)}</select>
      <input name="exam_date" type="date" required className="rounded-lg border p-3" />
      <input name="total_marks" type="number" min="1" required placeholder="Total marks" className="rounded-lg border p-3" />
      <button className="rounded-lg bg-blue-900 p-3 text-white sm:col-span-2">Create exam</button>
    </form>
    <section className="space-y-3"><h2 className="text-xl font-bold">Exam workflow</h2>
      {(exams ?? []).map(e => <article key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
        <div><h3 className="font-bold">{e.title}</h3><p className="mt-1 text-sm text-slate-500">{e.exam_date} · Total {e.total_marks} · Status: {e.status}</p></div>
        <div className="flex flex-wrap gap-2">
          {e.status === "draft" && <form action={changeExamStatus}><input type="hidden" name="exam_id" value={e.id} /><input type="hidden" name="status" value="verified" /><button className="rounded-lg border px-3 py-2 text-sm">Verify</button></form>}
          {e.status === "verified" && role === "admin" && <form action={changeExamStatus}><input type="hidden" name="exam_id" value={e.id} /><input type="hidden" name="status" value="published" /><button className="rounded-lg bg-blue-900 px-3 py-2 text-sm text-white">Publish results</button></form>}
        </div>
      </article>)}
    </section>
    <form action={saveResult} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">Enter / update marks (unpublished exams only)</h2>
      <select name="exam_id" required className="rounded-lg border p-3"><option value="">Choose exam</option>{(exams ?? []).filter(e => e.status !== "published").map(e => <option key={e.id} value={e.id}>{e.title} · max {e.total_marks}</option>)}</select>
      <select name="student_id" required className="rounded-lg border p-3"><option value="">Choose student</option>{(students ?? []).map(s => <option key={s.id} value={s.id}>{s.student_code} · {s.full_name}</option>)}</select>
      <input name="marks_obtained" type="number" min="0" step="0.01" required placeholder="Marks obtained" className="rounded-lg border p-3" />
      <input name="remarks" placeholder="Teacher remarks (optional)" className="rounded-lg border p-3" />
      <button className="rounded-lg bg-blue-900 p-3 text-white sm:col-span-2">Save marks</button>
    </form>
    <section className="overflow-x-auto rounded-2xl border bg-white p-5"><h2 className="mb-3 font-bold">Result records ({results?.length ?? 0})</h2>
      <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Exam</th><th className="p-2">Student</th><th className="p-2">Marks</th><th className="p-2">Remarks</th></tr></thead><tbody>
      {(results ?? []).map(r => <tr key={r.id} className="border-b"><td className="p-2">{(exams ?? []).find(e => e.id === r.exam_id)?.title ?? r.exam_id.slice(0,8)}</td><td className="p-2">{(students ?? []).find(s => s.id === r.student_id)?.full_name ?? r.student_id.slice(0,8)}</td><td className="p-2">{r.marks_obtained}</td><td className="p-2">{r.remarks ?? "—"}</td></tr>)}
      </tbody></table>
      <p className="mt-4 text-xs text-slate-500">Production release requires independent RLS tests to confirm unpublished marks cannot be read by students.</p>
    </section>
  </div>;
}
