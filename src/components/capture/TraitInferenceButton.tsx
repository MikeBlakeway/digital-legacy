"use client";

import { useState } from "react";

type TraitInferenceButtonProps = {
  personaSlug: string;
};

type AnalyseState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; version: number }
  | { status: "insufficient"; wordCount: number; minimum: number }
  | { status: "error" };

export default function TraitInferenceButton({
  personaSlug,
}: TraitInferenceButtonProps) {
  const [state, setState] = useState<AnalyseState>({ status: "idle" });
  const isRunning = state.status === "running";

  async function refreshProfile() {
    setState({ status: "running" });

    try {
      const response = await fetch(`/api/personas/${personaSlug}/analyse`, {
        method: "POST",
      });
      const body: unknown = await response.json();

      if (response.status === 422 && isInsufficientContentResponse(body)) {
        setState({
          status: "insufficient",
          wordCount: body.word_count,
          minimum: body.minimum,
        });
        return;
      }

      if (!response.ok || !isTraitResponse(body)) {
        setState({ status: "error" });
        return;
      }

      setState({ status: "success", version: body.version });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950 dark:text-zinc-50">
            Personality profile
          </h2>
        </div>
        <button
          type="button"
          onClick={refreshProfile}
          disabled={isRunning}
          className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {isRunning ? "Analysing..." : "Refresh profile"}
        </button>
      </div>
      <StatusMessage state={state} />
    </div>
  );
}

function StatusMessage({ state }: { state: AnalyseState }) {
  if (state.status === "idle" || state.status === "running") {
    return null;
  }

  if (state.status === "success") {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        Profile updated to version {state.version}.
      </p>
    );
  }

  if (state.status === "insufficient") {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        {state.wordCount} words captured. {state.minimum} words are needed.
      </p>
    );
  }

  return (
    <p className="text-sm text-red-700 dark:text-red-300">
      Profile refresh failed.
    </p>
  );
}

function isTraitResponse(value: unknown): value is { version: number } {
  return isRecord(value) && typeof value.version === "number";
}

function isInsufficientContentResponse(
  value: unknown,
): value is { word_count: number; minimum: number } {
  return (
    isRecord(value) &&
    typeof value.word_count === "number" &&
    typeof value.minimum === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
