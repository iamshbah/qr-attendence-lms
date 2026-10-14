"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAcademyRole } from "@/lib/academy/auth";

export async function setUserRole(formData: FormData) {
  const { supabase } = await requireAcademyRole(["super_admin"]);
  const targetUserId = String(formData.get("user_id") ?? "").trim();
  const newRole = String(formData.get("role") ?? "").trim();

  if (!targetUserId || !["student", "teacher", "admin"].includes(newRole)) {
    redirect("/protected/super-admin?error=invalid_request");
  }

  const { error } = await supabase.rpc("super_admin_set_user_role", {
    p_target_user_id: targetUserId,
    p_new_role: newRole,
  });

  if (error) {
    redirect("/protected/super-admin?error=role_update_failed");
  }

  revalidatePath("/protected/super-admin");
  revalidatePath("/protected");
  redirect("/protected/super-admin?saved=role_updated");
}
