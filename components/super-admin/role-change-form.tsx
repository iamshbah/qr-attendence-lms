"use client";

import type { FormEvent } from "react";

type RoleChangeFormProps = {
  userId: string;
  email: string | null;
  currentRole: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function RoleChangeForm({ userId, email, currentRole, action }: RoleChangeFormProps) {
  function confirmChange(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextRole = String(formData.get("role") ?? "");
    if (nextRole === currentRole) {
      event.preventDefault();
      return;
    }
    if (!window.confirm(`Change ${email || "this account"} from ${currentRole} to ${nextRole}? This action will be recorded in the audit log.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmChange} className="flex min-w-[270px] items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>Role for {email || userId}</label>
      <select id={`role-${userId}`} name="role" defaultValue={currentRole} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="rounded-lg bg-blue-900 px-3 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        Save
      </button>
    </form>
  );
}
