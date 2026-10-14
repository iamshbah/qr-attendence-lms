import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAcademyContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: profile?.role ?? "student",
    fullName: profile?.full_name ?? "",
  };
}

export async function requireAcademyRole(allowed: string[]) {
  const context = await getAcademyContext();
  if (!allowed.includes(context.role)) {
    redirect("/protected?error=forbidden");
  }
  return context;
}
