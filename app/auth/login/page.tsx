import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-5 md:p-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 font-semibold text-white/95">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold">AL</span>
              Academy LMS
            </Link>
            <h1 className="mt-12 text-3xl font-bold leading-tight">Secure academy operations, all in one dashboard.</h1>
            <p className="mt-4 max-w-md text-sm text-slate-300">
              Manage admissions, attendance, fees, courses, assignments, and exam performance from one protected workspace.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Student and class management</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">QR attendance and status tracking</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Role-aware access for admin, teacher, and student accounts</div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
