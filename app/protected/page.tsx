import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users, QrCode, Wallet, GraduationCap,
  BookOpen, ClipboardList, ShieldCheck, Languages, ArrowRight, Library
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const modules = [
  { title: "Students & Admissions", urdu: "Students ka record aur naye admissions", icon: Users, href: "/protected/students", roles: ["admin", "teacher"] },
  { title: "QR Attendance", urdu: "Class attendance sessions aur hazri records", icon: QrCode, href: "/protected/attendance", roles: ["admin", "teacher"] },
  { title: "Fees & Receipts", urdu: "Fees, dues aur receipts manage karein", icon: Wallet, href: "/protected/fees", roles: ["admin"] },
  { title: "Exams & Results", urdu: "Imtihan, marks aur result management", icon: GraduationCap, href: "/protected/exams", roles: ["admin", "teacher"] },
  { title: "Courses & Lessons", urdu: "Online lessons, videos aur notes", icon: BookOpen, href: "/protected/courses", roles: ["admin", "teacher"] },
  { title: "Assignments", urdu: "Homework aur coursework manage karein", icon: ClipboardList, href: "/protected/assignments", roles: ["admin", "teacher"] },
  { title: "My Learning", urdu: "Apne courses, assignments, attendance, results aur fees dekhein", icon: Library, href: "/protected/my-learning", roles: ["student"] },
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
  const roleLabel = role === "admin" ? "Admin" : role === "teacher" ? "Teacher" : "Student";
  const visibleModules = modules.filter((item) => item.roles.includes(role));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 p-7 text-white shadow-lg sm:p-10">
        <div className="flex items-center gap-2 text-sm text-blue-100">
          <ShieldCheck size={18} />
          Academy Management System
        </div>
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
          Assalam-o-Alaikum, {profile?.full_name || user.email?.split("@")[0] || "Welcome"}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
          {role === "admin"
            ? "Manage admissions, staff workflows, attendance, fees, courses and exams from one place."
            : role === "teacher"
              ? "Manage your academy classes, attendance, courses, assignments and exam results."
              : "Open your learning space to check courses, assignments, attendance, results and fee records."}
        </p>
        <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
          Account role: <span className="ml-2 font-semibold">{roleLabel}</span>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">{role === "student" ? "My Portal" : "Your Workspace"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only the tools available for your account role are shown.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Role-aware workspace
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{item.urdu}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-blue-800">
                  <span>Open module</span><ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Languages className="text-blue-700" size={24} />
          <div>
            <h2 className="font-bold">Urdu + English support</h2>
            <p className="mt-1 text-sm text-slate-500">
              Simple bilingual guidance for students, teachers and academy administrators.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
