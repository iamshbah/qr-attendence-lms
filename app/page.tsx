import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Wallet,
  Users,
  QrCode,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student & class management",
    description: "Keep student profiles, class assignments, and staff workflows organized in one place.",
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  {
    icon: QrCode,
    title: "QR attendance",
    description: "Make attendance check-ins faster with time-limited QR sessions and clear records.",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  {
    icon: Wallet,
    title: "Fees & receipts",
    description: "Track payments, outstanding balances, and fee records without scattered spreadsheets.",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  {
    icon: BookOpen,
    title: "Courses & lessons",
    description: "Organize learning materials, lessons, assignments, and resources by course.",
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    icon: ClipboardList,
    title: "Exams & results",
    description: "Keep assessments, submissions, grades, and published results easy to follow.",
    tint: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description: "Give administrators, teachers, and students a workspace suited to their role.",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  },
];

const steps = [
  { number: "01", title: "Set up your academy", description: "Organize classes, students, and teacher access." },
  { number: "02", title: "Take attendance", description: "Run a QR session and review check-in records." },
  { number: "03", title: "Keep learning moving", description: "Share course materials and assignments." },
  { number: "04", title: "Review progress", description: "Follow results and academy activity in one place." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#080d19]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Academy LMS home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-sm font-black tracking-tight text-white shadow-lg shadow-blue-700/20 transition group-hover:-translate-y-0.5">
              AL
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">Academy LMS</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Attendance · Learning · Operations
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300" aria-label="Main navigation">
            <a href="#features" className="transition hover:text-blue-700 dark:hover:text-blue-300">Features</a>
            <a href="#workflow" className="transition hover:text-blue-700 dark:hover:text-blue-300">How it works</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher />
            {hasEnvVars ? (
              <Suspense fallback={<span className="h-10 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />}>
                <AuthButton />
              </Suspense>
            ) : (
              <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800">
                Open portal <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        <div className="pointer-events-none absolute -left-40 top-12 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Smart academy operations
          </div>
          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl xl:text-[4.4rem]">
            Less admin work.
            <span className="mt-1 block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-300 dark:via-cyan-300 dark:to-teal-200">
              More learning.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Manage attendance, students, classes, fees, courses, assignments, and exam results from one clear academy workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/login" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800">
              Sign in to your portal <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              Explore features
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Role-aware workflows</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> QR attendance</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Learning tools</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[610px]">
          <div className="absolute -inset-5 rounded-[2.2rem] bg-gradient-to-br from-blue-500/15 via-cyan-400/10 to-violet-500/15 blur-2xl" />
          <div className="relative rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-6 dark:border-white/10 dark:bg-[#111a2b] dark:shadow-black/30">
            <div className="flex items-center justify-between gap-4 px-1 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Academy workspace</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight">Your day, in one view</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Organized
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.04]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Users className="h-4 w-4" /></span>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Students</p>
                <p className="mt-1 text-sm font-bold">Student profiles</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.04]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CalendarCheck className="h-4 w-4" /></span>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Attendance</p>
                <p className="mt-1 text-sm font-bold">QR check-ins</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-1 dark:border-white/5 dark:bg-white/[0.04]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><GraduationCap className="h-4 w-4" /></span>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Learning</p>
                <p className="mt-1 text-sm font-bold">Courses & tasks</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white dark:bg-[#080d19]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-cyan-300"><BarChart3 className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-bold">Built around clear access</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">Keep admin, teacher, and student tasks organized with a role-aware workspace.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> A clearer way to run your academy
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex dark:border-white/10 dark:bg-[#172237]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span>
            <span><span className="block text-xs font-bold">Everyday workflows</span><span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">In one connected place</span></span>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white py-20 sm:py-24 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-cyan-300">One connected workspace</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">The essentials, in one place.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">A practical foundation for daily academy administration and student learning.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description, tint }) => (
              <article key={title} className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-slate-900/5 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-blue-400/30 dark:hover:bg-white/[0.05] dark:hover:shadow-black/20">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">A simple daily flow</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">From roll call to results.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Bring the routine steps of running an academy into one straightforward process.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-black tracking-widest text-blue-700 dark:text-cyan-300">{step.number}</p>
              <h3 className="mt-4 text-base font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:text-slate-400">
          <span>© {new Date().getFullYear()} Academy LMS</span>
          <span>Student · Teacher · Administrator</span>
        </div>
      </footer>
    </main>
  );
}
