import { requireAcademyRole } from "@/lib/academy/auth";
import { createAssignment } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { supabase } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: courses }, { data: assignments }] = await Promise.all([
    supabase.from("courses").select("id,title"),
    supabase.from("assignments").select("id,course_id,title,instructions,due_at,max_score,published"),
  ]);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Assignments</h1><p className="mt-2 text-slate-500">Create homework and coursework linked to a course.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Assignment saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Assignment save failed. Check the selected course and database policies.</p>}
    <form action={createAssignment} className="grid gap-3 rounded-2xl border bg-white p-5">
      <h2 className="font-bold">Create assignment</h2>
      <select name="course_id" required className="rounded-lg border p-3"><option value="">Choose course</option>{(courses ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <input name="title" required placeholder="Assignment title" className="rounded-lg border p-3" />
      <textarea name="instructions" placeholder="Instructions" className="rounded-lg border p-3" />
      <input name="due_at" type="datetime-local" className="rounded-lg border p-3" />
      <input name="max_score" type="number" min="1" defaultValue="100" className="rounded-lg border p-3" />
      <button className="rounded-lg bg-blue-900 p-3 text-white">Save assignment as draft</button>
    </form>
    <section className="grid gap-3 md:grid-cols-2">{(assignments ?? []).map(a => <article key={a.id} className="rounded-2xl border bg-white p-5"><h2 className="font-bold">{a.title}</h2><p className="mt-2 text-sm text-slate-500">{a.instructions || "No instructions added."}</p><p className="mt-4 text-xs text-slate-500">Maximum score: {a.max_score} · {a.published ? "Published" : "Draft"}</p></article>)}</section>
  </div>;
}
