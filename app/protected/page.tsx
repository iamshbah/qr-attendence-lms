import { redirect } from "next/navigation";
import {
  Users, QrCode, Wallet, GraduationCap,
  BookOpen, ClipboardList, ShieldCheck, Languages
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const modules = [
  { title: "Students & Admissions", urdu: "Students ka record aur naye admissions", icon: Users },
  { title: "QR Attendance", urdu: "QR scan aur hazri ka nizam", icon: QrCode },
  { title: "Fees & Receipts", urdu: "Fees, dues aur receipts", icon: Wallet },
  { title: "Exams & Results", urdu: "Imtihan aur result management", icon: GraduationCap },
  { title: "Courses & Lessons", urdu: "Online lessons, videos aur notes", icon: BookOpen },
  { title: "Assignments & Reports", urdu: "Homework, progress aur reports", icon: ClipboardList },
];

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "student";
  const roleLabel =
    role === "admin" ? "Admin" :
    role === "teacher" ? "Teacher" : "Student";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 p-7 text-white shadow-lg sm:p-10">
        <div className="flex items-center gap-2 text-sm text-blue-100">
          <ShieldCheck size={18} />
          Academy Management System
        </div>
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
          Assalam-o-Alaikum, {profile?.full_name || "Welcome"}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
          Attendance, admissions, fees, exams aur online learning —
          sab kuch ek hi jagah.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
          Account role: <span className="ml-2 font-semibold">{roleLabel}</span>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Academy Modules</h2>
            <p className="mt-1 text-sm text-slate-500">
              Academy ke tamam main sections
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Initial setup
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                  {item.urdu}
                </p>
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                  Feature implementation: next step
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Languages className="text-blue-700" size={24} />
          <div>
            <h2 className="font-bold">Urdu + English</h2>
            <p className="mt-1 text-sm text-slate-500">
              Interface ko bilingual banane ka kaam aglay marhalay mein hoga.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Note: Yeh initial dashboard interface hai. Module cards filhal
          overview hain; attendance, fees aur results ki functionality abhi
          implement aur test honi baqi hai.
        </p>
      </section>
    </div>
  );
}
