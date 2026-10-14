import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-xs text-slate-500">Signed in</p>
        <p className="text-sm font-medium text-slate-700">{user.email ?? "Academy user"}</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href="/protected">Dashboard</Link>
      </Button>
      <LogoutButton />
    </div>
  );
}
