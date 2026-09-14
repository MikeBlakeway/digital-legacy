import Link from "next/link";
import type { ReactNode } from "react";

import { ProviderInviteForm } from "@/app/(app)/admin/users/ProviderInviteForm";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminUserDirectory } from "@/lib/auth/user-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("/admin/users");
  const directory = await getAdminUserDirectory();

  return (
    <AdminShell title="User management">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Invite a persona provider</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
          During beta, administrators invite the people who can create and manage
          their own persona. Their invitation continues into capture mode.
        </p>
        <ProviderInviteForm />
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">People with accounts</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
              {directory.users.length}{" "}
              {directory.users.length === 1 ? "person" : "people"}
            </p>
          </div>
        </div>

        {directory.users.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {directory.users.map((user) => (
              <article
                key={user.id}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-medium">{user.email}</h3>
                    <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                      {describeAccountStatus(user.confirmedAt, user.lastSignInAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.isAdmin ? <Badge>Admin</Badge> : null}
                    {user.isProvider ? <Badge>Provider</Badge> : null}
                    {user.ownedPersonas.map((persona) => (
                      <Badge key={persona.id}>Owns {persona.name}</Badge>
                    ))}
                  </div>
                </div>

                {user.grants.length > 0 ? (
                  <p className="mt-4 border-t border-stone-200 pt-4 text-sm text-stone-600 dark:border-zinc-800 dark:text-zinc-300">
                    Consumer access:{" "}
                    {user.grants.map((grant) => grant.personaName).join(", ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            No accounts have been created yet.
          </p>
        )}
      </section>
    </AdminShell>
  );
}

function describeAccountStatus(
  confirmedAt: string | null,
  lastSignInAt: string | null,
): string {
  if (lastSignInAt) {
    return `Last signed in ${formatDate(lastSignInAt)}`;
  }

  if (confirmedAt) {
    return `Account confirmed ${formatDate(confirmedAt)}`;
  }

  return "Invitation pending";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-200">
      {children}
    </span>
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
