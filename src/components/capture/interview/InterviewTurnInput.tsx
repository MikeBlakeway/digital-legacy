"use client";

import { useState, type KeyboardEvent } from "react";

import DiaryVoiceRecorder, {
  type RecordingCompletePayload,
} from "@/components/capture/diary/DiaryVoiceRecorder";
import type { EmotionLabel } from "@/lib/capture/emotions";

export type SubmitInterviewTurnPayload = {
  content: string;
  emotion_label?: EmotionLabel;
  voice_b2_key?: string;
  duration_seconds?: number;
};

type InterviewTurnInputProps = {
  personaSlug: string;
  disabled: boolean;
  onSubmit: (payload: SubmitInterviewTurnPayload) => Promise<boolean>;
};

type InputMode = "write" | "record";

type TranscribeResponse = {
  transcript: string;
  duration_seconds: number;
};

export default function InterviewTurnInput({
  personaSlug,
  disabled,
  onSubmit,
}: InterviewTurnInputProps) {
  const [mode, setMode] = useState<InputMode>("write");
  const [content, setContent] = useState("");
  const [recording, setRecording] = useState<RecordingCompletePayload | null>(
    null,
  );
  const [recorderKey, setRecorderKey] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isBusy = disabled || isTranscribing;
  const canSubmit =
    !isBusy &&
    ((mode === "write" && Boolean(content.trim())) ||
      (mode === "record" && Boolean(recording)));

  async function submit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);

    if (mode === "write") {
      const submitted = await onSubmit({ content: content.trim() });

      if (submitted) {
        setContent("");
      }

      return;
    }

    if (!recording) {
      return;
    }

    setIsTranscribing(true);

    try {
      const transcription = await transcribeRecording(recording.voice_b2_key);
      const submitted = await onSubmit({
        content: transcription.transcript.trim(),
        voice_b2_key: recording.voice_b2_key,
        duration_seconds:
          transcription.duration_seconds > 0
            ? transcription.duration_seconds
            : recording.duration_seconds,
        ...(recording.emotion_label
          ? { emotion_label: recording.emotion_label }
          : {}),
      });

      if (submitted) {
        setRecording(null);
        setRecorderKey((current) => current + 1);
      }
    } catch {
      setErrorMessage("The recording could not be transcribed.");
    } finally {
      setIsTranscribing(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  async function transcribeRecording(voiceB2Key: string): Promise<TranscribeResponse> {
    const response = await fetch(`/api/personas/${personaSlug}/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voice_b2_key: voiceB2Key }),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok || !isTranscribeResponse(payload)) {
      throw new Error("Invalid transcription response.");
    }

    if (!payload.transcript.trim()) {
      throw new Error("Transcription was empty.");
    }

    return payload;
  }

  return (
    <div className="space-y-4 border-t border-stone-200 pt-5 dark:border-zinc-800">
      <div className="inline-flex rounded-md border border-stone-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-950">
        {(["write", "record"] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            disabled={isBusy}
            onClick={() => setMode(nextMode)}
            className={[
              "rounded px-4 py-2 text-sm font-medium capitalize transition disabled:cursor-not-allowed",
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
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          rows={6}
          className="w-full resize-y rounded-md border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-700 dark:focus:border-zinc-300 dark:disabled:bg-zinc-900"
        />
      ) : (
        <DiaryVoiceRecorder
          key={recorderKey}
          personaSlug={personaSlug}
          initialEmotion={null}
          uploadKeyPrefix="interview"
          microphoneErrorMessage="Microphone access is required to record an interview response."
          readyMessage="Recording ready to submit."
          onRecordingComplete={setRecording}
        />
      )}

      {errorMessage ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {isBusy
            ? "Waiting..."
            : mode === "record"
              ? "Submit recording"
              : "Submit response"}
        </button>
      </div>
    </div>
  );
}

function isTranscribeResponse(value: unknown): value is TranscribeResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "transcript" in value &&
    "duration_seconds" in value &&
    typeof value.transcript === "string" &&
    typeof value.duration_seconds === "number"
  );
}
