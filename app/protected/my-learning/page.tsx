import { submitAssignment } from "@/lib/academy/actions";
import { requireAcademyRole } from "@/lib/academy/auth";

export const dynamic = "force-dynamic";

export default async function MyLearningPage() {
  const { supabase, user } = await requireAcademyRole(["student"]);
  const { data: student } = await supabase
    .from("students")
    .select("id, student_code, full_name, class_id, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-bold text-amber-950">Student profile not linked yet</h1>
        <p className="mt-3 leading-7 text-amber-900">Your account is created, but the academy administrator still needs to link it to your student record. Please contact the academy office and share your registered email address.</p>
      </section>
    );
  }

  const [{ data: courseRows }, { data: attendanceRows }, { data: resultRows }, { data: feeRows }] = await Promise.all([
    supabase.from("courses").select("id,title,description,published,class_id").eq("published", true).eq("class_id", student.class_id),
    supabase.from("attendance_records").select("id,status,marked_at,session_id").eq("student_id", student.id).order("marked_at", { ascending: false }).limit(20),
    supabase.from("results").select("id,exam_id,marks_obtained,remarks,updated_at").eq("student_id", student.id).order("updated_at", { ascending: false }).limit(20),
    supabase.from("fee_records").select("id,amount,fee_month,due_date,paid_at,receipt_number").eq("student_id", student.id).order("fee_month", { ascending: false }).limit(12),
  ]);
  const courses = courseRows ?? [];
  const [{ data: assignmentRows }, { data: lessonRows }] = courses.length
    ? await Promise.all([
        supabase.from("assignments").select("id,title,instructions,due_at,course_id").eq("published", true).in("course_id", courses.map((course) => course.id)).order("due_at", { ascending: true }),
        supabase.from("lessons").select("id,title,content,video_url,file_path,course_id,position").eq("published", true).in("course_id", courses.map((course) => course.id)).order("position", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];
  const { data: submissionRows } = await supabase.from("submissions").select("id,assignment_id,submitted_at,score,feedback").eq("student_id", student.id);
  const submissions = submissionRows ?? [];
  const attendance = attendanceRows ?? [];
  const results = resultRows ?? [];
  const fees = feeRows ?? [];
  const assignments = assignmentRows ?? [];
  const lessons = lessonRows ?? [];
  const presentCount = attendance.filter((r) => r.status === "present" || r.status === "late").length;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 p-7 text-white shadow-lg">
        <p className="text-sm text-blue-100">Student portal · {student.student_code}</p>
        <h1 className="mt-2 text-3xl font-bold">Assalam-o-Alaikum, {student.full_name}</h1>
        <p className="mt-2 text-blue-100">Your courses, lessons, assignments, attendance, results and fee records in one place.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Published courses", String(courses.length)],
          ["Recent attendance", String(attendance.length)],
          ["Assignments", String(assignments.length)],
          ["Outstanding fees", String(fees.filter((f) => !f.paid_at).length)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">My courses & lessons</h2>
          <div className="mt-4 space-y-3">
            {courses.length ? courses.map((course) => (
              <article key={course.id} className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold">{course.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{course.description || "Course material shared by your teacher."}</p>
                {lessons.filter((lesson) => lesson.course_id === course.id).map((lesson) => (
                  <div key={lesson.id} className="mt-3 border-t border-slate-200 pt-3">
                    <p className="font-medium">{lesson.title}</p>
                    {lesson.content && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{lesson.content}</p>}
                    {lesson.video_url && <a className="mt-2 inline-block text-sm font-semibold text-blue-800 underline" href={lesson.video_url} target="_blank" rel="noreferrer">Open lesson video</a>}
                    {lesson.file_path && <p className="mt-1 break-all text-xs text-slate-500">Material file: {lesson.file_path}</p>}
                  </div>
                ))}
              </article>
            )) : <p className="mt-3 text-sm text-slate-500">No published courses are assigned to your class yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">My assignments</h2>
          <div className="mt-4 space-y-3">
            {assignments.length ? assignments.map((assignment) => { const submission = submissions.find((item) => item.assignment_id === assignment.id); return <article key={assignment.id} className="rounded-xl border p-4"><h3 className="font-semibold">{assignment.title}</h3><p className="mt-1 text-sm text-slate-600">{assignment.instructions || "Follow the instructions given by your teacher."}</p><p className="mt-2 text-xs text-slate-500">Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "Not specified"}</p>{submission ? <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"><p className="font-semibold">Submitted · {new Date(submission.submitted_at).toLocaleString()}</p>{submission.score !== null && <p className="mt-1">Score: {submission.score}</p>}{submission.feedback && <p className="mt-1">Feedback: {submission.feedback}</p>}</div> : <form action={submitAssignment} className="mt-4 space-y-2"><input type="hidden" name="assignment_id" value={assignment.id} /><label className="block text-sm font-medium" htmlFor={"answer-" + assignment.id}>Your answer</label><textarea id={"answer-" + assignment.id} name="answer_text" required minLength={2} rows={4} className="w-full rounded-lg border p-3 text-sm" placeholder="Write your answer here..." /><button className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white">Submit assignment</button></form>}</article>; }) : <p className="text-sm text-slate-500">No published assignments are available yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">Attendance</h2>
          <p className="mt-2 text-sm text-slate-500">Recent records visible to your account.</p>
          <div className="mt-4 space-y-2">
            {attendance.length ? attendance.map((record) => <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>{new Date(record.marked_at).toLocaleDateString()}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-medium capitalize">{record.status}</span></div>) : <p className="text-sm text-slate-500">No attendance records found yet.</p>}
          </div>
          <p className="mt-3 text-xs text-slate-500">{presentCount} present/late records in the recent list.</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">My results</h2>
          <div className="mt-4 space-y-2">
            {results.length ? results.map((result) => <div key={result.id} className="rounded-lg border p-3"><p className="font-semibold">{result.marks_obtained} marks</p><p className="mt-1 text-sm text-slate-500">{result.remarks || "No teacher remarks."}</p></div>) : <p className="text-sm text-slate-500">Published results will appear here when available.</p>}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <h2 className="text-xl font-bold">Fees & receipts</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {fees.length ? fees.map((fee) => <div key={fee.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-semibold">{Number(fee.amount).toLocaleString()}</p><p className="text-slate-500">{String(fee.fee_month).slice(0, 7)} · Due {fee.due_date}</p>{fee.receipt_number && <p className="text-xs text-slate-500">Receipt: {fee.receipt_number}</p>}</div><span className={fee.paid_at ? "text-emerald-700" : "text-amber-700"}>{fee.paid_at ? "Paid" : "Due"}</span></div>) : <p className="text-sm text-slate-500">No fee records found.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
