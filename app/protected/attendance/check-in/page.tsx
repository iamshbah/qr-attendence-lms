import { redirect } from "next/navigation";
import { getAcademyContext } from "@/lib/academy/auth";
import { QrAttendanceCheckIn } from "@/components/attendance/qr-check-in";

export const dynamic = "force-dynamic";

export default async function AttendanceCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { role } = await getAcademyContext();
  if (role !== "student") redirect("/protected?error=forbidden");
  const params = await searchParams;
  const sessionId = params.session && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.session)
    ? params.session
    : "";

  return <QrAttendanceCheckIn sessionId={sessionId} />;
}
