"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  invitePersonaConsumer,
  revokePersonaConsumer,
  type PersonaAccessMutationState,
} from "@/app/(app)/capture/[slug]/access/actions";
import type { PersonaConsumer } from "@/lib/auth/persona-sharing";

const EMPTY_STATE: PersonaAccessMutationState = {
  error: null,
  message: null,
};

export function PersonaAccessControls({
  slug,
  personaName,
  consumers,
}: {
  slug: string;
  personaName: string;
  consumers: PersonaConsumer[];
}) {
  const [inviteState, inviteAction] = useActionState(
    invitePersonaConsumer,
    EMPTY_STATE,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Invite family or friends</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
          Invite someone to talk with {personaName}. They cannot change the
          persona or see any persona you have not shared with them.
        </p>
        <form
          action={inviteAction}
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="slug" value={slug} />
          <label className="min-w-0 flex-1 text-sm font-medium text-stone-700 dark:text-zinc-200">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="family@example.com"
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <SubmitButton pendingLabel="Sending...">Send invitation</SubmitButton>
          <MutationMessage state={inviteState} className="sm:basis-full" />
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">People with access</h2>
        {consumers.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {consumers.map((consumer) => (
              <ConsumerRow
                key={consumer.userId}
                slug={slug}
                consumer={consumer}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            No one else can access this persona yet.
          </p>
        )}
      </section>
    </div>
  );
}

function ConsumerRow({
  slug,
  consumer,
}: {
  slug: string;
  consumer: PersonaConsumer;
}) {
  const [state, formAction] = useActionState(revokePersonaConsumer, EMPTY_STATE);

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{consumer.email}</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
            Added {formatDate(consumer.grantedAt)}
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="userId" value={consumer.userId} />
          <SubmitButton
            pendingLabel="Revoking..."
            tone="danger"
            confirmation={`Revoke access for ${consumer.email}?`}
          >
            Revoke access
          </SubmitButton>
        </form>
      </div>
      <MutationMessage state={state} className="mt-3" />
    </li>
  );
}

function SubmitButton({
  children,
  pendingLabel,
  tone = "primary",
  confirmation,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  tone?: "primary" | "danger";
  confirmation?: string;
}) {
  const { pending } = useFormStatus();
  const colors =
    tone === "danger"
      ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
      : "border-stone-900 bg-stone-900 text-white hover:bg-stone-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300";

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={
        confirmation
          ? (event) => {
              if (!window.confirm(confirmation)) {
                event.preventDefault();
              }
            }
          : undefined
      }
      className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${colors}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function MutationMessage({
  state,
  className = "",
}: {
  state: PersonaAccessMutationState;
  className?: string;
}) {
  if (!state.error && !state.message) {
    return null;
  }

  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`${className} text-sm ${
        state.error
          ? "text-red-700 dark:text-red-300"
          : "text-emerald-700 dark:text-emerald-300"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
