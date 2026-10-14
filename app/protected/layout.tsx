import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const links = [
  ["Dashboard", "/protected"],
  ["Students", "/protected/students"],
  ["Attendance", "/protected/attendance"],
  ["Fees", "/protected/fees"],
  ["Courses", "/protected/courses"],
  ["Assignments", "/protected/assignments"],
  ["Exams & Results", "/protected/exams"],
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/protected" className="flex items-center gap-3 font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">AL</span>
            <span>Academy LMS</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </nav>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-3">
          {links.map(([label, href]) => (
            <Link key={href} href={href}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-blue-50">
              {label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mt-10 border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
        Academy LMS · Secure access for your academy
      </footer>
    </div>
  );
}
