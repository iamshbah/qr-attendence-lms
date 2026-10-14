import { requireAcademyRole } from "@/lib/academy/auth";
import { createCourse } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { supabase } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: classes }, { data: courses }] = await Promise.all([
    supabase.from("classes").select("id,name,section"),
    supabase.from("courses").select("id,title,description,class_id,published,created_at"),
  ]);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Courses & Lessons</h1><p className="mt-2 text-slate-500">Create courses for your academy classes.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Course saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Course save failed. Check your role and database permissions.</p>}
    <form action={createCourse} className="grid gap-3 rounded-2xl border bg-white p-5">
      <h2 className="font-bold">Create course</h2>
      <input name="title" required placeholder="Course title" className="rounded-lg border p-3" />
      <textarea name="description" placeholder="Course description" className="rounded-lg border p-3" />
      <select name="class_id" className="rounded-lg border p-3"><option value="">All classes / no class</option>{(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section ?? ""}</option>)}</select>
      <button className="rounded-lg bg-blue-900 p-3 text-white">Save course as draft</button>
    </form>
    <section className="grid gap-3 md:grid-cols-2">{(courses ?? []).map(c => <article key={c.id} className="rounded-2xl border bg-white p-5"><h2 className="font-bold">{c.title}</h2><p className="mt-2 text-sm text-slate-500">{c.description || "No description yet."}</p><p className="mt-4 text-xs text-slate-500">Status: {c.published ? "Published" : "Draft"} · ID {c.id.slice(0,8)}</p></article>)}</section>
  </div>;
}
