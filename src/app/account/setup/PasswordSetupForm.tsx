"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  setPassword,
  type SetPasswordState,
} from "@/app/account/setup/actions";

export default function PasswordSetupForm() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [state, formAction] = useActionState<SetPasswordState, FormData>(
    setPassword,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-6">
      <PasswordField
        id="password"
        label="Choose a password"
        autoComplete="new-password"
        showPassword={showPasswords}
      />
      <PasswordField
        id="passwordConfirmation"
        label="Confirm your password"
        autoComplete="new-password"
        showPassword={showPasswords}
      />

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
          className="size-4 rounded border-stone-300 accent-stone-900 dark:border-zinc-700 dark:accent-zinc-100"
        />
        Show passwords
      </label>

      {state.error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  showPassword,
}: {
  id: string;
  label: string;
  autoComplete: string;
  showPassword: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-stone-700 dark:text-zinc-200"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={9}
        required
        className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-600 dark:disabled:text-zinc-300"
    >
      {pending ? "Saving password..." : "Save password and continue"}
    </button>
  );
}
