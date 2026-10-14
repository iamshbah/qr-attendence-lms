import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

const features = [
  "Student admissions and class management",
  "QR-based attendance tracking",
  "Fees, receipts, and balance visibility",
  "Courses, assignments, and exam workflows",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-sm text-white">AL</span>
            <span>Academy LMS</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {hasEnvVars ? (
              <Suspense>
                <AuthButton />
              </Suspense>
            ) : (
              <Link href="/auth/login" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
                Open portal
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">
              Smart academy operations
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              End-to-end learning management for your academy.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Manage admissions, attendance, fee records, student performance, and coursework from one secure platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800">
                Login to dashboard
              </Link>
              <Link href="/auth/sign-up" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
                Create account
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Today at a glance</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Students</span>
                  <strong>1,280</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Attendance</span>
                  <strong>94.2%</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Pending fees</span>
                  <strong>36</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 h-10 w-10 rounded-xl bg-blue-50" />
              <p className="text-sm font-medium text-slate-700">{feature}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
