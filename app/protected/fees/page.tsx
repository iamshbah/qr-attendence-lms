import { requireAcademyRole } from "@/lib/academy/auth";
import { createFee } from "@/lib/academy/actions";

export const dynamic = "force-dynamic";

export default async function FeesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { supabase } = await requireAcademyRole(["admin"]);
  const params = await searchParams;
  const [{ data: students }, { data: fees }] = await Promise.all([
    supabase.from("students").select("id,student_code,full_name").eq("active", true),
    supabase.from("fee_records").select("id,student_id,amount,fee_month,due_date,paid_at,receipt_number,payment_method"),
  ]);
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Fees & Receipts</h1><p className="mt-2 text-slate-500">Record monthly fees, dues and payments.</p></header>
    {params.saved && <p className="rounded-lg bg-green-50 p-3 text-green-800">Fee record saved.</p>}
    {params.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">Fee record failed. Check fields and database policies.</p>}
    <form action={createFee} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">Add fee record</h2>
      <select name="student_id" required className="rounded-lg border p-3"><option value="">Choose student</option>{(students ?? []).map(s => <option key={s.id} value={s.id}>{s.student_code} · {s.full_name}</option>)}</select>
      <input name="amount" type="number" min="1" step="0.01" required placeholder="Amount" className="rounded-lg border p-3" />
      <input name="fee_month" type="month" required className="rounded-lg border p-3" />
      <input name="due_date" type="date" required className="rounded-lg border p-3" />
      <select name="payment_method" className="rounded-lg border p-3"><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="other">Other</option></select>
      <label className="flex items-center gap-2 p-3"><input name="paid" type="checkbox" /> Mark as paid</label>
      <input name="notes" placeholder="Notes (optional)" className="rounded-lg border p-3 sm:col-span-2" />
      <button className="rounded-lg bg-blue-900 p-3 text-white sm:col-span-2">Save fee</button>
    </form>
    <section className="overflow-x-auto rounded-2xl border bg-white p-5"><h2 className="mb-3 font-bold">Fee ledger ({fees?.length ?? 0})</h2>
      <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Student ID</th><th className="p-2">Month</th><th className="p-2">Amount</th><th className="p-2">Due date</th><th className="p-2">Status</th></tr></thead><tbody>
      {(fees ?? []).map(f => <tr key={f.id} className="border-b"><td className="p-2">{f.student_id.slice(0,8)}</td><td className="p-2">{String(f.fee_month).slice(0,7)}</td><td className="p-2">{f.amount}</td><td className="p-2">{f.due_date}</td><td className="p-2">{f.paid_at ? "Paid" : "Due"}</td></tr>)}
      </tbody></table>
    </section>
  </div>;
}
