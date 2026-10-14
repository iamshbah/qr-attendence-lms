"use client";

export function PrintButton({ label }: { label: string }) {
  return <button type="button" onClick={() => window.print()} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">{label}</button>;
}
