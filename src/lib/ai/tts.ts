import "server-only";

import {
  RunPodError,
  callRunPodEndpoint,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/ai/client";

export interface TtsInput {
  text: string;
  speaker_wav_b2_key: string | null;
  language?: string;
}

export interface TtsOutput {
  audio_base64: string;
  duration_seconds: number;
}

export async function synthesizeSpeech(
  input: TtsInput,
  options: RunPodCallOptions = {},
): Promise<TtsOutput> {
  const output = await callRunPodEndpoint<TtsInput, unknown>("tts", input, options);

  if (
    !isRecord(output) ||
    typeof output.audio_base64 !== "string" ||
    typeof output.duration_seconds !== "number"
  ) {
    throw new RunPodError("TTS endpoint returned an invalid output payload.", {
      details: output,
    });
  }

  return {
    audio_base64: output.audio_base64,
    duration_seconds: output.duration_seconds,
  };
}
