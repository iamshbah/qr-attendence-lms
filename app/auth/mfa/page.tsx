import { redirect } from "next/navigation";
import { getAcademyContext } from "@/lib/academy/auth";
import { SuperAdminMfaGate } from "@/components/super-admin/mfa-gate";

export const dynamic = "force-dynamic";

export default async function SuperAdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { role } = await getAcademyContext();
  if (role !== "super_admin") redirect("/protected?error=forbidden");

  const params = await searchParams;
  const requestedNext = params.next ?? "";
  const nextPath =
    requestedNext.startsWith("/protected/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/protected/super-admin";

  return <SuperAdminMfaGate nextPath={nextPath} />;
}
