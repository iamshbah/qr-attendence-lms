"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (submissionError: unknown) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send reset email right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900">Check your email</CardTitle>
            <CardDescription className="text-sm text-slate-600">Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              We&apos;ve sent a password reset link to {email || "your email"}. Follow it to create a new password.
            </p>
            <Link href="/auth/login" className="inline-flex text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">
              Back to login
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900">Reset password</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Enter your account email and we&apos;ll send a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@academy.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset email"}
              </Button>
              <div className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
