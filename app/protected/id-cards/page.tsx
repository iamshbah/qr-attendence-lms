import { toDataURL } from "qrcode";
import Image from "next/image";
import { requireAcademyRole } from "@/lib/academy/auth";
import { PrintButton } from "@/components/id-cards/print-button";
import styles from "./id-cards.module.css";

export const dynamic = "force-dynamic";

export default async function StudentIdCardsPage() {
  const { supabase, user, role } = await requireAcademyRole(["admin", "teacher", "student"]);
  let studentsQuery = supabase.from("students").select("id,student_code,full_name,class_id,active");
  if (role === "student") studentsQuery = studentsQuery.eq("user_id", user.id);
  const [{ data: studentsData }, { data: classesData }] = await Promise.all([
    studentsQuery.order("full_name", { ascending: true }),
    supabase.from("classes").select("id,name,section"),
  ]);
  const students = studentsData ?? [];
  const classes = classesData ?? [];
  const classLabel = (classId: string | null) => {
    const row = classes.find((item) => item.id === classId);
    return row ? row.name + (row.section ? " · " + row.section : "") : "Class not assigned";
  };
  const cards = await Promise.all(students.map(async (student) => ({
    ...student,
    qr: await toDataURL("STU:" + student.student_code, { width: 180, margin: 1, errorCorrectionLevel: "M" }),
  })));

  return (
    <div className="space-y-6">
      <header className={styles.noPrint + " flex flex-wrap items-end justify-between gap-3"}>
        <div>
          <h1 className="text-3xl font-bold">{role === "student" ? "My Student ID Card" : "Student ID Card Generator"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Generate printable student cards with QR codes for the teacher's fast attendance scanner. The QR contains the student code only.</p>
        </div>
        {students.length > 0 && <PrintButton label={role === "student" ? "Print my ID card" : "Print all cards"} />}
      </header>
      {role === "student" && cards.length === 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-950">Student profile not linked yet</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">Ask the academy administrator to link your login account to your student record before generating an ID card.</p>
        </section>
      )}
      {cards.length > 0 && (
        <section className={styles.grid}>
          {cards.map((student) => (
            <article key={student.id} className={styles.card + " relative flex overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"}>
              <div className="flex w-2/3 flex-col justify-between p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">Digitalice Academy</p>
                  <h2 className="mt-2 text-lg font-bold leading-tight text-slate-950">{student.full_name}</h2>
                  <p className="mt-1 text-xs text-slate-500">Student ID</p>
                  <p className="text-sm font-bold tracking-wide text-slate-900">{student.student_code}</p>
                  <p className="mt-2 text-xs text-slate-600">{classLabel(student.class_id)}</p>
                </div>
                <div>
                  <span className={student.active ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800" : "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"}>{student.active ? "ACTIVE STUDENT" : "INACTIVE"}</span>
                  <p className="mt-2 text-[9px] text-slate-400">Present this card to your teacher for attendance.</p>
                </div>
              </div>
              <div className="flex w-1/3 flex-col items-center justify-center border-l border-slate-100 p-2">
                <Image src={student.qr} alt={"QR ID for " + student.student_code} width={140} height={140} unoptimized className="h-28 w-28" />
                <p className="mt-1 break-all text-center text-[9px] font-semibold text-slate-700">{student.student_code}</p>
              </div>
            </article>
          ))}
        </section>
      )}
      <p className={styles.noPrint + " text-xs leading-5 text-slate-500"}>Security note: a static card QR can be photographed or copied. The scanner requires an authenticated teacher/admin and an active session for the student's own class; staff should visually verify the person holding the card.</p>
    </div>
  );
}
