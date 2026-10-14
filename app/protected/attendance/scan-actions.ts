"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAcademyRole } from "@/lib/academy/auth";

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CARD_QR = /^STU:(STU-[A-Z0-9]{8,20})$/i;

export async function markAttendanceByStudentCode(sessionId: string, qrPayload: string) {
  const { supabase, user, role } = await requireAcademyRole(["admin", "teacher"]);
  if (!SESSION_ID.test(sessionId)) return { ok: false, message: "Invalid attendance session." };
  const match = qrPayload.trim().toUpperCase().match(CARD_QR);
  if (!match) return { ok: false, message: "This is not a valid student ID QR code." };

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id,class_id,expires_at,active")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError || !session || !session.active || new Date(session.expires_at).getTime() <= Date.now()) {
    return { ok: false, message: "This session is inactive or expired. Choose a current session." };
  }

  if (role === "teacher") {
    const { data: assignedClass, error } = await supabase
      .from("classes")
      .select("id")
      .eq("id", session.class_id)
      .eq("teacher_id", user.id)
      .maybeSingle();
    if (error || !assignedClass) return { ok: false, message: "You are not assigned to this class." };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id,full_name,student_code,class_id,active")
    .eq("student_code", match[1])
    .maybeSingle();
  if (studentError || !student || !student.active) {
    return { ok: false, message: "Student ID was not found or the student is inactive." };
  }
  if (student.class_id !== session.class_id) {
    return { ok: false, message: "This student is not enrolled in the selected session's class." };
  }

  const { error: insertError } = await supabase.from("attendance_records").insert({
    session_id: session.id,
    student_id: student.id,
    status: "present",
    marked_by: user.id,
    source: "qr",
    device_event_id: randomUUID(),
  });
  if (insertError?.code === "23505") {
    return { ok: false, message: student.full_name + " is already marked for this session." };
  }
  if (insertError) return { ok: false, message: "Attendance could not be saved. Check session permissions and try again." };

  revalidatePath("/protected/attendance");
  revalidatePath("/protected/my-learning");
  return { ok: true, message: student.full_name + " marked present.", studentName: student.full_name };
}
