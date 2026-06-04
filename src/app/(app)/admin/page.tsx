import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const ADMIN_SECTIONS = [
  {
    href: "/admin/users",
    label: "Users",
    detail: "Create users, assign roles, and deactivate accounts.",
  },
  {
    href: "/admin/personas",
    label: "Personas",
    detail: "Review personas and manage family access.",
  },
  {
    href: "/admin/system",
    label: "System",
    detail: "Check Modal, B2, Supabase, and database health.",
  },
];

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Admin dashboard
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ADMIN_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:bg-red-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900 dark:hover:bg-red-950/20"
            >
              <h2 className="text-base font-semibold">{section.label}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-zinc-300">
                {section.detail}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
