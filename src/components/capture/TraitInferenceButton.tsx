"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatApproximateStoryTime,
} from "@/components/capture/personality-profile-utils";

type TraitInferenceButtonProps = {
  personaSlug: string;
  actionLabel?: string;
  runningLabel?: string;
  disabled?: boolean;
  disabledMessage?: string;
  successMessage?: string;
};

type AnalyseState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; version: number }
  | { status: "insufficient"; wordCount: number; minimum: number }
  | { status: "error" };

export default function TraitInferenceButton({
  personaSlug,
  actionLabel = "Refresh profile",
  runningLabel = "Analysing...",
  disabled = false,
  disabledMessage,
  successMessage = "Profile refreshed.",
}: TraitInferenceButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<AnalyseState>({ status: "idle" });
  const isRunning = state.status === "running";
  const isDisabled = disabled || isRunning;

  async function refreshProfile() {
    if (disabled) {
      return;
    }

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
      router.refresh();
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
          disabled={isDisabled}
          className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {isRunning ? runningLabel : actionLabel}
        </button>
      </div>
      <StatusMessage
        state={state}
        disabledMessage={disabled ? disabledMessage : undefined}
        successMessage={successMessage}
      />
    </div>
  );
}

function StatusMessage({
  state,
  disabledMessage,
  successMessage,
}: {
  state: AnalyseState;
  disabledMessage?: string;
  successMessage: string;
}) {
  if (disabledMessage) {
    return (
      <p className="text-sm text-stone-600 dark:text-zinc-300">
        {disabledMessage}
      </p>
    );
  }

  if (state.status === "idle" || state.status === "running") {
    return null;
  }

  if (state.status === "success") {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        {successMessage}
      </p>
    );
  }

  if (state.status === "insufficient") {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Add {formatApproximateStoryTime(state.minimum - state.wordCount)} of
        story content before refreshing your profile.
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
