"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAcademyRole } from "@/lib/academy/auth";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function fail(path: string, reason: string): never {
  redirect(`${path}?error=${encodeURIComponent(reason)}`);
}

function done(path: string): never {
  revalidatePath(path);
  redirect(`${path}?saved=1`);
}

export async function createStudent(form: FormData) {
  const { supabase } = await requireAcademyRole(["admin"]);
  const full_name = value(form, "full_name");
  if (!full_name) fail("/protected/students", "name_required");

  const { error } = await supabase.from("students").insert({
    student_code: `STU-${randomUUID().slice(0, 8).toUpperCase()}`,
    full_name,
    guardian_name: value(form, "guardian_name") || null,
    phone: value(form, "phone") || null,
    guardian_phone: value(form, "guardian_phone") || null,
    address: value(form, "address") || null,
    class_id: value(form, "class_id") || null,
    admission_date: value(form, "admission_date") || new Date().toISOString().slice(0, 10),
    active: true,
  });

  if (error) fail("/protected/students", "save_failed");
  done("/protected/students");
}

export async function createAttendanceSession(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin", "teacher"]);
  const class_id = value(form, "class_id");
  const session_date = value(form, "session_date");
  const expires_at = value(form, "expires_at");

  if (!class_id || !session_date || !expires_at) {
    fail("/protected/attendance", "required_fields");
  }

  const token = randomUUID() + randomUUID();
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.from("attendance_sessions").insert({
    class_id,
    session_date,
    starts_at: new Date().toISOString(),
    expires_at: new Date(expires_at).toISOString(),
    token_hash,
    active: true,
    created_by: user.id,
  });

  if (error) fail("/protected/attendance", "session_failed");
  done("/protected/attendance");
}

export async function markManualAttendance(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin", "teacher"]);
  const session_id = value(form, "session_id");
  const student_id = value(form, "student_id");
  const status = value(form, "status");

  if (!session_id || !student_id ||
      !["present", "late", "absent", "excused"].includes(status)) {
    fail("/protected/attendance", "invalid_fields");
  }

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, class_id, expires_at, active")
    .eq("id", session_id)
    .maybeSingle();

  if (sessionError || !session || !session.active ||
      new Date(session.expires_at).getTime() < Date.now()) {
    fail("/protected/attendance", "session_inactive");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, class_id, active")
    .eq("id", student_id)
    .maybeSingle();

  if (studentError || !student || !student.active ||
      student.class_id !== session.class_id) {
    fail("/protected/attendance", "student_class_mismatch");
  }

  const { error } = await supabase.from("attendance_records").insert({
    session_id,
    student_id,
    status,
    marked_by: user.id,
    source: "manual",
    device_event_id: randomUUID(),
  });

  if (error) fail("/protected/attendance", "attendance_save_failed");
  done("/protected/attendance");
}

export async function createFee(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin"]);
  const student_id = value(form, "student_id");
  const amount = Number(value(form, "amount"));
  const month = value(form, "fee_month");
  const due_date = value(form, "due_date");
  const paid = value(form, "paid") === "on";

  if (!student_id || !Number.isFinite(amount) || amount <= 0 ||
      !month || !due_date) {
    fail("/protected/fees", "invalid_fields");
  }

  const { error } = await supabase.from("fee_records").insert({
    student_id,
    amount,
    fee_month: `${month}-01`,
    due_date,
    paid_at: paid ? new Date().toISOString() : null,
    payment_method: paid ? (value(form, "payment_method") || "cash") : null,
    receipt_number: paid ? `RCT-${randomUUID().slice(0, 8).toUpperCase()}` : null,
    notes: value(form, "notes") || null,
    recorded_by: user.id,
  });

  if (error) fail("/protected/fees", "fee_save_failed");
  done("/protected/fees");
}

export async function createCourse(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin", "teacher"]);
  const title = value(form, "title");
  if (!title) fail("/protected/courses", "title_required");

  const { error } = await supabase.from("courses").insert({
    title,
    description: value(form, "description") || null,
    class_id: value(form, "class_id") || null,
    teacher_id: user.id,
    published: false,
  });

  if (error) fail("/protected/courses", "course_save_failed");
  done("/protected/courses");
}

export async function createAssignment(form: FormData) {
  const { supabase } = await requireAcademyRole(["admin", "teacher"]);
  const course_id = value(form, "course_id");
  const title = value(form, "title");
  const max_score = Number(value(form, "max_score") || "100");

  if (!course_id || !title || !Number.isFinite(max_score) || max_score <= 0) {
    fail("/protected/assignments", "invalid_fields");
  }

  const due = value(form, "due_at");
  const { error } = await supabase.from("assignments").insert({
    course_id,
    title,
    instructions: value(form, "instructions") || null,
    due_at: due ? new Date(due).toISOString() : null,
    max_score,
    published: false,
  });

  if (error) fail("/protected/assignments", "assignment_save_failed");
  done("/protected/assignments");
}

export async function createExam(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin", "teacher"]);
  const title = value(form, "title");
  const class_id = value(form, "class_id");
  const exam_date = value(form, "exam_date");
  const total_marks = Number(value(form, "total_marks"));

  if (!title || !class_id || !exam_date ||
      !Number.isFinite(total_marks) || total_marks <= 0) {
    fail("/protected/exams", "invalid_fields");
  }

  const { error } = await supabase.from("exams").insert({
    title,
    class_id,
    exam_date,
    total_marks,
    status: "draft",
    created_by: user.id,
  });

  if (error) fail("/protected/exams", "exam_save_failed");
  done("/protected/exams");
}

export async function changeExamStatus(form: FormData) {
  const { supabase, role } = await requireAcademyRole(["admin", "teacher"]);
  const exam_id = value(form, "exam_id");
  const next = value(form, "status");

  if (!exam_id || !["verified", "published"].includes(next)) {
    fail("/protected/exams", "invalid_status");
  }
  if (next === "published" && role !== "admin") {
    fail("/protected/exams", "admin_publish_only");
  }

  const { data: exam, error: readError } = await supabase
    .from("exams").select("id,status").eq("id", exam_id).maybeSingle();

  if (readError || !exam ||
      (next === "verified" && exam.status !== "draft") ||
      (next === "published" && exam.status !== "verified")) {
    fail("/protected/exams", "invalid_workflow");
  }

  const { error } = await supabase.from("exams")
    .update({ status: next }).eq("id", exam_id);

  if (error) fail("/protected/exams", "status_update_failed");
  done("/protected/exams");
}

export async function saveResult(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["admin", "teacher"]);
  const exam_id = value(form, "exam_id");
  const student_id = value(form, "student_id");
  const marks = Number(value(form, "marks_obtained"));

  if (!exam_id || !student_id || !Number.isFinite(marks) || marks < 0) {
    fail("/protected/exams", "invalid_result");
  }

  const { data: exam, error: examError } = await supabase
    .from("exams").select("id,total_marks,status").eq("id", exam_id).maybeSingle();

  if (examError || !exam || exam.status === "published" || marks > Number(exam.total_marks)) {
    fail("/protected/exams", "result_locked_or_invalid");
  }

  const { data: existing, error: existingError } = await supabase
    .from("results").select("id")
    .eq("exam_id", exam_id).eq("student_id", student_id).maybeSingle();

  if (existingError) fail("/protected/exams", "result_read_failed");

  const payload = {
    exam_id,
    student_id,
    marks_obtained: marks,
    remarks: value(form, "remarks") || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase.from("results").update(payload).eq("id", existing.id)
    : await supabase.from("results").insert(payload);

  if (result.error) fail("/protected/exams", "result_save_failed");
  done("/protected/exams");
}

export async function submitAssignment(form: FormData) {
  const { supabase, user } = await requireAcademyRole(["student"]);
  const assignment_id = value(form, "assignment_id");
  const answer_text = value(form, "answer_text");

  if (!assignment_id || !answer_text) {
    fail("/protected/my-learning", "assignment_answer_required");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, class_id, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentError || !student || !student.active) {
    fail("/protected/my-learning", "student_profile_not_linked");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, course_id, published, due_at")
    .eq("id", assignment_id)
    .maybeSingle();

  if (assignmentError || !assignment || !assignment.published ||
      (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now())) {
    fail("/protected/my-learning", "assignment_unavailable_or_closed");
  }

  const { data: existing, error: existingError } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignment_id", assignment_id)
    .eq("student_id", student.id)
    .maybeSingle();

  if (existingError) fail("/protected/my-learning", "submission_check_failed");
  if (existing) fail("/protected/my-learning", "assignment_already_submitted");

  const { error } = await supabase.from("submissions").insert({
    assignment_id,
    student_id: student.id,
    answer_text,
    submitted_at: new Date().toISOString(),
  });

  if (error) fail("/protected/my-learning", "submission_save_failed");
  done("/protected/my-learning");
}
