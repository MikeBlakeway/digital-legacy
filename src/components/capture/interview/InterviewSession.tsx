"use client";

import Link from "next/link";
import { useState } from "react";

import InterviewProgress from "@/components/capture/interview/InterviewProgress";
import InterviewTurnInput, {
  type SubmitInterviewTurnPayload,
} from "@/components/capture/interview/InterviewTurnInput";
import { getInterviewTheme } from "@/lib/interview-themes";
import type {
  InterviewMessage,
  InterviewSession as InterviewSessionRecord,
} from "@/lib/supabase/interviews";

type InterviewSessionProps = {
  personaSlug: string;
  initialSession: InterviewSessionRecord;
};

type SubmitTurnResponse = {
  session: InterviewSessionRecord;
  completed: boolean;
};

export default function InterviewSession({
  personaSlug,
  initialSession,
}: InterviewSessionProps) {
  const [session, setSession] = useState(initialSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const theme = getInterviewTheme(session.theme);
  const completed = Boolean(session.completed_at);

  async function submitTurn(
    payload: SubmitInterviewTurnPayload,
  ): Promise<boolean> {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/personas/${personaSlug}/interview/${session.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const responsePayload: unknown = await response.json().catch(() => null);

      if (!response.ok || !isSubmitTurnResponse(responsePayload)) {
        setErrorMessage("The response could not be saved.");
        return false;
      }

      setSession(responsePayload.session);
      return true;
    } catch {
      setErrorMessage("The response could not be saved.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-stone-500 dark:text-zinc-400">{theme.title}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950 dark:text-zinc-50">
              Interview session
            </h1>
          </div>
          <Link
            href={`/capture/${personaSlug}/interview`}
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Back to interviews
          </Link>
        </div>
        <div className="mt-5">
          <InterviewProgress turnCount={session.turn_count} completed={completed} />
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="space-y-4">
          {session.messages.map((message, index) => (
            <TranscriptMessage
              key={`${message.created_at}-${index}`}
              message={message}
            />
          ))}
        </div>

        {errorMessage ? (
          <p className="mt-5 text-sm text-red-700 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {completed ? (
          <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold text-stone-950 dark:text-zinc-50">
              This session is complete.
            </h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/capture/${personaSlug}/interview`}
                className="rounded-md bg-stone-900 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
              >
                Start another session
              </Link>
              <Link
                href={`/capture/${personaSlug}`}
                className="rounded-md border border-stone-300 px-5 py-2.5 text-center text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Capture dashboard
              </Link>
            </div>
          </div>
        ) : (
          <InterviewTurnInput
            personaSlug={personaSlug}
            disabled={isSubmitting}
            onSubmit={submitTurn}
          />
        )}
      </div>
    </div>
  );
}

function TranscriptMessage({ message }: { message: InterviewMessage }) {
  const isAgent = message.role === "agent";

  return (
    <div className={isAgent ? "flex justify-start" : "flex justify-end"}>
      <div
        className={[
          "max-w-[min(38rem,88%)] rounded-lg px-4 py-3 text-sm leading-6",
          isAgent
            ? "bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-zinc-50"
            : "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
        ].join(" ")}
      >
        <p>{message.content}</p>
        {message.emotion_label || message.voice_b2_key ? (
          <p
            className={[
              "mt-2 text-xs",
              isAgent ? "text-stone-500 dark:text-zinc-400" : "text-stone-300 dark:text-zinc-600",
            ].join(" ")}
          >
            {message.voice_b2_key ? "Voice response" : null}
            {message.voice_b2_key && message.emotion_label ? " · " : null}
            {message.emotion_label ? message.emotion_label : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function isSubmitTurnResponse(value: unknown): value is SubmitTurnResponse {
  return (
    isRecord(value) &&
    isRecord(value.session) &&
    typeof value.completed === "boolean" &&
    typeof value.session.id === "string" &&
    Array.isArray(value.session.messages)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
