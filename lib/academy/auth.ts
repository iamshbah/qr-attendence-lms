import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAcademyContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/login");

  let role = "student";
  let fullName = "";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError && profile) {
    role = profile.role ?? "student";
    fullName = profile.full_name ?? "";
  }

  return {
    supabase,
    user,
    role,
    fullName,
  };
}

export async function requireAcademyRole(allowed: string[]) {
  const context = await getAcademyContext();
  if (context.role !== "super_admin" && !allowed.includes(context.role)) {
    redirect("/protected?error=forbidden");
  }
  if (context.role === "super_admin") {
    const { data: assurance, error: assuranceError } =
      await context.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      redirect("/auth/mfa?next=/protected/super-admin");
    }
  }
  return context;
}
