import { requireAcademyRole } from "@/lib/academy/auth";
import { setUserRole } from "./actions";

export const dynamic = "force-dynamic";

type UserRow = {
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_verified: boolean;
};

type AuditRow = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

function dateLabel(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
}

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { supabase } = await requireAcademyRole(["super_admin"]);
  const params = await searchParams;

  const [{ data: userData, error: usersError }, { data: auditData, error: auditError }] =
    await Promise.all([
      supabase.rpc("super_admin_list_users"),
      supabase
        .from("audit_logs")
        .select("id,actor_id,action,entity_type,entity_id,details,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const users = (userData ?? []) as UserRow[];
  const events = (auditData ?? []) as AuditRow[];

  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
          Restricted control plane
        </p>
        <h1 className="mt-2 text-3xl font-bold">Super Admin Security Console</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Manage account roles and review recorded authentication and administrative activity.
          Sensitive operations are re-authorized on the server and in PostgreSQL.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">Role-gated</span>
          <span className="rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-blue-100">RLS protected</span>
          <span className="rounded-full border border-white/20 px-3 py-1 text-slate-200">No passwords or tokens displayed</span>
        </div>
      </header>

      {params.saved && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Role update completed.
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          The request could not be completed. Check permissions and the selected account, then try again.
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Accounts and roles</h2>
            <p className="mt-1 text-sm text-slate-500">Showing up to 200 accounts. Super Admin promotion is deliberately excluded from this form.</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">{users.length} accounts</span>
        </div>

        {usersError ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Account listing is unavailable. Verify the database RPC and your Super Admin role.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Account</th>
                  <th className="px-3 py-3">Verification</th>
                  <th className="px-3 py-3">Last sign-in</th>
                  <th className="px-3 py-3">Role management</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{user.email || "Email unavailable"}</p>
                      <p className="mt-1 text-xs text-slate-500">Created {dateLabel(user.created_at)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={user.email_verified ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800" : "rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800"}>
                        {user.email_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{dateLabel(user.last_sign_in_at)}</td>
                    <td className="px-3 py-4">
                      {user.role === "super_admin" ? (
                        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Super Admin — protected</span>
                      ) : (
                        <form action={setUserRole} className="flex min-w-[270px] items-center gap-2">
                          <input type="hidden" name="user_id" value={user.user_id} />
                          <label className="sr-only" htmlFor={`role-${user.user_id}`}>Role for {user.email}</label>
                          <select id={`role-${user.user_id}`} name="role" defaultValue={user.role} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button type="submit" className="rounded-lg bg-blue-900 px-3 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                            Save
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No account records returned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest 50 records from the protected audit table.</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">{events.length} events</span>
        </div>
        {auditError ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Audit records are unavailable. Access is denied by default unless the account has the Super Admin role.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Time (PKT)</th>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">Account / object</th>
                  <th className="px-3 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="whitespace-nowrap px-3 py-4 text-slate-600">{dateLabel(event.created_at)}</td>
                    <td className="px-3 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">{event.action}</span></td>
                    <td className="px-3 py-4">
                      <p className="font-medium">{String(event.details?.email ?? event.actor_id ?? "System")}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.entity_type || "event"}{event.entity_id ? ` · ${event.entity_id}` : ""}</p>
                    </td>
                    <td className="max-w-sm break-words px-3 py-4 text-xs text-slate-600">{JSON.stringify(event.details ?? {})}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No activity records yet. Successful login auditing starts after the auth trigger observes a sign-in timestamp update.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Security note: failed login attempts are not shown here because they require a trusted Auth log hook or log drain. This panel does not claim to record failed attempts until that mechanism is configured.
      </p>
    </main>
  );
}
