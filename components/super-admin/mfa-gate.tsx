"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "challenge";

export function SuperAdminMfaGate({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (!cancelled) setError("Please sign in again to continue.");
        return;
      }

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!assuranceError && assurance?.currentLevel === "aal2") {
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) {
        if (!cancelled) setError("Unable to check your authenticator. Refresh the page and try again.");
        return;
      }

      const verifiedFactor = factorData.totp?.find((factor) => factor.status === "verified");
      if (verifiedFactor) {
        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
        if (challengeError || !challenge?.id) {
          if (!cancelled) setError("Unable to start MFA verification. Please retry.");
          return;
        }
        if (!cancelled) {
          setFactorId(verifiedFactor.id);
          setChallengeId(challenge.id);
          setMode("challenge");
        }
        return;
      }

      const pendingFactor = factorData.all?.find((factor) => factor.factor_type === "totp" && factor.status === "unverified");
      if (pendingFactor) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });
        if (removeError) {
          if (!cancelled) setError("An unfinished authenticator setup exists. Please contact the system owner.");
          return;
        }
      }

      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Super Admin authenticator",
      });
      if (enrollmentError || !enrollment?.id || !enrollment?.totp?.qr_code) {
        if (!cancelled) setError("Unable to start authenticator setup. Check Supabase MFA settings and try again.");
        return;
      }
      if (!cancelled) {
        setFactorId(enrollment.id);
        setQrCode(enrollment.totp.qr_code);
        setSecret(enrollment.totp.secret);
        setMode("enroll");
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6,8}$/.test(code.trim())) {
      setError("Enter the current numeric code from your authenticator app.");
      return;
    }

    setBusy(true);
    setError("");
    const supabase = createClient();

    let activeChallengeId = challengeId;
    if (!activeChallengeId) {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge?.id) {
        setBusy(false);
        setError("Unable to start MFA verification. Please retry.");
        return;
      }
      activeChallengeId = challenge.id;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: activeChallengeId,
      code: code.trim(),
    });
    setBusy(false);

    if (verifyError) {
      setError("That code could not be verified. Check your authenticator and try again.");
      setCode("");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  const qrImage = qrCode
    ? qrCode.startsWith("data:")
      ? qrCode
      : `data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`
    : "";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
          <span className="text-lg font-bold">MFA</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Super Admin protection</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          {mode === "enroll" ? "Set up your authenticator" : "Verify your identity"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === "enroll"
            ? "Scan the QR code with an authenticator app, then enter the current code to finish setup. Keep the setup secret private."
            : "Enter the current code from your registered authenticator app. Super Admin operations require a verified MFA session."}
        </p>

        {mode === "loading" && <p className="mt-6 text-sm text-slate-500">Checking MFA configuration…</p>}

        {mode === "enroll" && qrImage && (
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <Image src={qrImage} alt="Authenticator setup QR code" width={192} height={192} unoptimized className="mx-auto h-48 w-48" />
            <p className="mt-4 text-xs font-semibold text-slate-700">Manual setup key</p>
            <code className="mt-1 block break-all rounded-lg bg-slate-100 p-3 text-sm text-slate-900">{secret}</code>
          </div>
        )}

        {(mode === "enroll" || mode === "challenge") && (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <label htmlFor="mfa-code" className="block text-sm font-semibold text-slate-800">Authenticator code</label>
            <input
              id="mfa-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              maxLength={8}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg tracking-[0.25em] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="000000"
            />
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-blue-950 px-4 py-3 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Verifying…" : mode === "enroll" ? "Verify and enable MFA" : "Verify and continue"}
            </button>
          </form>
        )}

        {mode === "loading" && error && (
          <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        )}
        <p className="mt-6 text-xs leading-5 text-slate-500">
          Never share your authenticator code or setup key. This screen will not display or request your password.
        </p>
      </section>
    </main>
  );
}
