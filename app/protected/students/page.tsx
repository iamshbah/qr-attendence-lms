import { requireAcademyRole } from "@/lib/academy/auth";
import { createStudent } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase, role } = await requireAcademyRole(["admin", "teacher"]);
  const params = await searchParams;
  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase.from("students").select("id,student_code,full_name,phone,active,class_id"),
    supabase.from("classes").select("id,name,section"),
  ]);

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Students & Admissions</h1>
      <p className="mt-2 text-slate-500">Student records and class assignments.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Student saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Could not save. Check required fields, role permissions and database policies.</p>}
    {role === "admin" && <form action={createStudent} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">Add student</h2>
      <input name="full_name" required placeholder="Student full name" className="rounded-lg border p-3" />
      <input name="guardian_name" placeholder="Parent / guardian name" className="rounded-lg border p-3" />
      <input name="phone" placeholder="Student phone" className="rounded-lg border p-3" />
      <input name="guardian_phone" placeholder="Guardian phone" className="rounded-lg border p-3" />
      <select name="class_id" className="rounded-lg border p-3">
        <option value="">Choose class (optional)</option>
        {(classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section ?? ""}</option>)}
      </select>
      <input name="admission_date" type="date" className="rounded-lg border p-3" />
      <input name="address" placeholder="Address" className="rounded-lg border p-3 sm:col-span-2" />
      <button className="rounded-lg bg-blue-900 p-3 font-semibold text-white sm:col-span-2">Save student</button>
    </form>}
    <section className="overflow-x-auto rounded-2xl border bg-white p-5">
      <h2 className="mb-4 font-bold">Student register ({students?.length ?? 0})</h2>
      <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Phone</th><th className="p-2">Status</th></tr></thead>
      <tbody>{(students ?? []).map(s => <tr key={s.id} className="border-b last:border-0"><td className="p-2">{s.student_code}</td><td className="p-2">{s.full_name}</td><td className="p-2">{s.phone ?? "—"}</td><td className="p-2">{s.active ? "Active" : "Inactive"}</td></tr>)}</tbody></table>
    </section>
  </div>;
}
