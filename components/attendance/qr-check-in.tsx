"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CheckInState = "checking" | "success" | "error";

export function QrAttendanceCheckIn({ sessionId }: { sessionId: string }) {
  const started = useRef(false);
  const [state, setState] = useState<CheckInState>("checking");
  const [message, setMessage] = useState("Validating the attendance QR code…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function checkIn() {
      const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);

      if (!sessionId || !token || token.length < 32) {
        setState("error");
        setMessage("This QR code is incomplete or invalid. Ask your teacher for a fresh code.");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("mark_attendance_with_qr", {
        p_session_id: sessionId,
        p_token: token,
      });

      if (error || !data) {
        setState("error");
        setMessage("Check-in was not accepted. The code may be expired, already used, or not assigned to your class.");
        return;
      }

      setState("success");
      setMessage("Your attendance has been recorded successfully.");
    }

    void checkIn();
  }, [sessionId]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg sm:p-8">
        <div className={state === "success" ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" : state === "error" ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-800" : "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-800"}>
          {state === "success" ? "✓" : state === "error" ? "!" : "…"}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">QR attendance check-in</h1>
        <p role={state === "error" ? "alert" : "status"} className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {state === "error" && (
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Sign in with the student account linked to your class. Do not forward the QR code to other classes.
          </p>
        )}
      </section>
    </main>
  );
}
