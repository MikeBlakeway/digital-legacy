import Link from "next/link";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("/admin/users");

  return (
    <AdminShell title="User management">
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        User creation, role assignment, and deactivation controls belong here.
      </div>
    </AdminShell>
  );
}

function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <Link
            href="/admin"
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Back to admin
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            {title}
          </h1>
        </div>
        {children}
      </section>
    </main>
  );
}
