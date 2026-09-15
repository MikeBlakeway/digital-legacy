"use client";

import Link from "next/link";
import { useState } from "react";

import type { EmotionLabel } from "@/lib/capture/emotions";
import type { EmotionUpdate } from "@/lib/supabase/diary";
import DiaryVoiceRecorder, {
  type RecordingCompletePayload,
} from "@/components/capture/diary/DiaryVoiceRecorder";
import EmotionSelector from "@/components/capture/diary/EmotionSelector";

const THOUGHT_STARTERS = [
  "Something I've been thinking about lately...",
  "A moment I keep returning to...",
  "Something I've never told anyone...",
  "Today reminded me of...",
  "One thing I hope they understand...",
  "A place I can still picture clearly...",
  "Someone who changed me...",
  "A lesson I learned the hard way...",
  "A small thing I never want to forget...",
  "What I felt but did not say...",
  "A memory from childhood...",
  "If I could explain one thing...",
] as const;

type DiaryEntryComposerProps = {
  personaSlug: string;
};

type InputMode = "write" | "record";

export default function DiaryEntryComposer({ personaSlug }: DiaryEntryComposerProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(null);
  const [mode, setMode] = useState<InputMode>("write");
  const [content, setContent] = useState("");
  const [recording, setRecording] = useState<RecordingCompletePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [thoughtStarter] = useState(() => {
    const index = Math.floor(Math.random() * THOUGHT_STARTERS.length);
    return THOUGHT_STARTERS[index];
  });

  const canSave =
    Boolean(selectedEmotion) &&
    !isSaving &&
    ((mode === "write" && Boolean(content.trim())) ||
      (mode === "record" && Boolean(recording)));

  async function saveEntry() {
    if (!selectedEmotion || !canSave) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload =
      mode === "write"
        ? {
            content: content.trim(),
            emotion_label: selectedEmotion,
          }
        : {
            voice_b2_key: recording?.voice_b2_key,
            duration_seconds: recording?.duration_seconds,
            emotion_label: selectedEmotion,
            emotion_updates: normalizeEmotionUpdates(recording?.emotion_updates),
          };

    try {
      const response = await fetch(`/api/personas/${personaSlug}/diary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setErrorMessage("The entry could not be saved.");
        return;
      }

      setIsSaved(true);
    } catch {
      setErrorMessage("The entry could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetComposer() {
    setSelectedEmotion(null);
    setMode("write");
    setContent("");
    setRecording(null);
    setErrorMessage(null);
    setIsSaved(false);
  }

  if (isSaved) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <h2 className="text-xl font-semibold text-stone-950 dark:text-zinc-50">
          Story saved
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
          Your diary story has been saved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetComposer}
            className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            Write another
          </button>
          <Link
            href={`/capture/${personaSlug}/diary`}
            className="rounded-md border border-stone-300 px-5 py-2.5 text-center text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Back to diary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <div className="space-y-8">
        <EmotionSelector
          selectedEmotion={selectedEmotion}
          onSelect={setSelectedEmotion}
          disabled={isSaving}
        />

        <div
          className={
            selectedEmotion
              ? "space-y-6"
              : "pointer-events-none space-y-6 opacity-45"
          }
          aria-disabled={!selectedEmotion}
        >
          <div className="inline-flex rounded-md border border-stone-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-950">
            {(["write", "record"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => setMode(nextMode)}
                className={[
                  "rounded px-4 py-2 text-sm font-medium capitalize transition",
                  mode === nextMode
                    ? "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {nextMode}
              </button>
            ))}
          </div>

          {mode === "write" ? (
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={thoughtStarter}
              rows={12}
              className="w-full resize-y rounded-md border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-700 dark:focus:border-zinc-300"
            />
          ) : selectedEmotion ? (
            <DiaryVoiceRecorder
              key={selectedEmotion}
              personaSlug={personaSlug}
              initialEmotion={selectedEmotion}
              onRecordingComplete={setRecording}
            />
          ) : null}
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canSave}
            onClick={saveEntry}
            className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
          >
            {isSaving ? "Saving..." : "Save entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeEmotionUpdates(
  updates: EmotionUpdate[] | undefined,
): EmotionUpdate[] | undefined {
  return updates && updates.length > 0 ? updates : undefined;
}
