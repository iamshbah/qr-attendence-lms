"use client";

import { useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendanceByStudentCode } from "@/app/protected/attendance/scan-actions";

type SessionOption = { id: string; label: string };

export function StudentIdScanner({ sessions }: { sessions: SessionOption[] }) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("Select an active class session, then start the camera.");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");

  async function stopCamera() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        // Camera may already have stopped after a browser permission/device error.
      }
    }
    setScanning(false);
  }

  async function startCamera() {
    if (!sessionId) {
      setTone("error");
      setMessage("Please choose an active attendance session first.");
      return;
    }
    if (scannerRef.current) await stopCamera();
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;
    setMessage("Requesting camera access…");
    setTone("neutral");
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          const result = await markAttendanceByStudentCode(sessionId, decodedText);
          setTone(result.ok ? "success" : "error");
          setMessage(result.message);
          window.setTimeout(() => { busyRef.current = false; }, result.ok ? 1000 : 1400);
        },
        () => undefined,
      );
      setScanning(true);
      setMessage("Camera ready. Scan each student's physical ID card QR.");
    } catch {
      scannerRef.current = null;
      try { scanner.clear(); } catch { /* no active camera surface */ }
      setTone("error");
      setMessage("Camera could not start. Allow camera access, use HTTPS, check that another app is not using it, or use manual attendance below.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Fast student ID scanner</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Teacher/admin scans the student's ID card. Attendance is validated on the server against the selected live session, class assignment, student status and duplicate record.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">Camera scanner</span>
      </div>
      {sessions.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <select aria-label="Attendance session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={scanning} className="min-w-0 rounded-lg border border-slate-300 p-3 text-sm">
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
          </select>
          {!scanning ? (
            <button type="button" onClick={() => void startCamera()} className="rounded-lg bg-blue-900 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Start scanner</button>
          ) : (
            <button type="button" onClick={() => void stopCamera()} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Stop camera</button>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No active sessions found. Create an attendance session above before scanning ID cards.</p>
      )}
      <p role={tone === "error" ? "alert" : "status"} className={"mt-3 rounded-lg p-3 text-sm " + (tone === "success" ? "bg-emerald-50 text-emerald-900" : tone === "error" ? "bg-red-50 text-red-900" : "bg-slate-50 text-slate-700")}>{message}</p>
      <div id={regionId} className={scanning ? "mt-4 min-h-64 overflow-hidden rounded-xl bg-slate-950" : "hidden"} />
      <p className="mt-3 text-xs leading-5 text-slate-500">The card QR contains only the student code, not personal details. Static cards can be copied; visually verify the cardholder. Use the short-lived session QR check-in below when students check in themselves.</p>
    </section>
  );
}
