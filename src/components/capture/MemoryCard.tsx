"use client";

import { useState, type CSSProperties } from "react";

import {
  formatMemoryRelativeDate,
  formatMemorySourceLabel,
} from "@/components/capture/memory-browser-utils";
import type { Memory, MemoryVisibility } from "@/lib/supabase/memories";

type MemoryCardProps = {
  memory: Memory;
  personaSlug: string;
};

const collapsedContentStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export default function MemoryCard({ memory, personaSlug }: MemoryCardProps) {
  const [visibility, setVisibility] = useState(memory.visibility);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isDeleted) {
    return null;
  }

  async function togglePrivacy() {
    if (isUpdatingVisibility || isDeleting) {
      return;
    }

    const previousVisibility = visibility;
    const nextVisibility = visibility === "private" ? "family" : "private";
    setVisibility(nextVisibility);
    setIsUpdatingVisibility(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/personas/${personaSlug}/memories/${memory.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ visibility: nextVisibility }),
        },
      );
      const body: unknown = await response.json();

      if (!response.ok || !isMemoryVisibilityResponse(body)) {
        throw new Error("Visibility update failed.");
      }

      setVisibility(body.visibility);
    } catch {
      setVisibility(previousVisibility);
      setErrorMessage("Visibility could not be updated.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  async function deleteCurrentMemory() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/personas/${personaSlug}/memories/${memory.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed.");
      }

      setIsDeleted(true);
    } catch {
      setIsDeleting(false);
      setErrorMessage("Memory could not be deleted.");
    }
  }

  return (
    <article className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-200">
              {formatMemorySourceLabel(memory.source)}
            </span>
            <span>{formatMemoryRelativeDate(memory.created_at)}</span>
            {memory.question_prompt ? <span>Prompted</span> : null}
            {visibility === "private" ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Private
              </span>
            ) : (
              <span className="rounded-full bg-teal-100 px-2.5 py-1 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                Family
              </span>
            )}
          </div>

          <p
            className="mt-3 text-sm leading-6 text-stone-800 dark:text-zinc-100"
            style={isExpanded ? undefined : collapsedContentStyle}
          >
            {memory.content}
          </p>

          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="mt-2 text-xs font-medium text-stone-600 hover:text-stone-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>

          {errorMessage ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={togglePrivacy}
            disabled={isUpdatingVisibility || isDeleting}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:disabled:text-zinc-500"
            aria-pressed={visibility === "private"}
          >
            {visibility === "private" ? <EyeOffIcon /> : <EyeIcon />}
            {visibility === "private" ? "Private" : "Family"}
          </button>

          {isConfirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-stone-600 dark:text-zinc-300">
                Delete this memory?
              </span>
              <button
                type="button"
                onClick={deleteCurrentMemory}
                disabled={isDeleting}
                className="min-h-10 rounded-md bg-red-700 px-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500 dark:disabled:bg-red-950 dark:disabled:text-red-300"
              >
                {isDeleting ? "Deleting" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:disabled:text-zinc-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isUpdatingVisibility || isDeleting}
              className="min-h-10 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300 dark:border-red-900 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950 dark:disabled:text-red-900"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 14 14" />
      <path d="M8.4 5.4A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.1" />
      <path d="M6.5 6.5C3.6 8.4 2 12 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
    </svg>
  );
}

function isMemoryVisibilityResponse(
  value: unknown,
): value is { visibility: MemoryVisibility } {
  return isRecord(value) && isMemoryVisibility(value.visibility);
}

function isMemoryVisibility(value: unknown): value is MemoryVisibility {
  return value === "family" || value === "private" || value === "public";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
