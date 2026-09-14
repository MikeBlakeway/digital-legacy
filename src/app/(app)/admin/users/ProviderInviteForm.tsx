"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  inviteProvider,
  type AdminUserMutationState,
} from "@/app/(app)/admin/users/actions";

const EMPTY_STATE: AdminUserMutationState = {
  error: null,
  message: null,
};

export function ProviderInviteForm() {
  const [state, formAction] = useActionState(inviteProvider, EMPTY_STATE);

  return (
    <form
      action={formAction}
      className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <label className="min-w-0 flex-1 text-sm font-medium text-stone-700 dark:text-zinc-200">
        Provider email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="provider@example.com"
          className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <ProviderSubmitButton />
      {state.error || state.message ? (
        <p
          role={state.error ? "alert" : "status"}
          className={`text-sm sm:basis-full ${
            state.error
              ? "text-red-700 dark:text-red-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {state.error ?? state.message}
        </p>
      ) : null}
    </form>
  );
}

function ProviderSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
    >
      {pending ? "Sending..." : "Invite provider"}
    </button>
  );
}
