"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  INTERVIEW_THEMES,
  type InterviewThemeId,
} from "@/lib/interview-themes";
import type { InterviewSessionThemeCounts } from "@/lib/supabase/interviews";

type ThemeSelectorProps = {
  personaSlug: string;
  counts: InterviewSessionThemeCounts;
};

export default function ThemeSelector({ personaSlug, counts }: ThemeSelectorProps) {
  const router = useRouter();
  const [startingTheme, setStartingTheme] = useState<InterviewThemeId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startSession(theme: InterviewThemeId) {
    setStartingTheme(theme);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/personas/${personaSlug}/interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok || !isStartSessionResponse(payload)) {
        setErrorMessage("The interview could not be started.");
        return;
      }

      router.push(`/capture/${personaSlug}/interview/${payload.id}`);
    } catch {
      setErrorMessage("The interview could not be started.");
    } finally {
      setStartingTheme(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {INTERVIEW_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            disabled={startingTheme !== null}
            onClick={() => void startSession(theme.id)}
            className="rounded-lg border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-stone-400 hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <span className="block text-base font-semibold text-stone-950 dark:text-zinc-50">
              {theme.title}
            </span>
            <span className="mt-2 block text-sm leading-6 text-stone-600 dark:text-zinc-300">
              {theme.framing}
            </span>
            <span className="mt-4 block text-xs font-medium uppercase tracking-normal text-stone-500 dark:text-zinc-400">
              {counts[theme.id]} completed
            </span>
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function isStartSessionResponse(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof value.id === "string"
  );
}
