import "server-only";

import {
  RunPodError,
  callRunPodEndpoint,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/runpod/client";

export interface SttInput {
  audio_base64: string;
  language?: string;
}

export interface SttOutput {
  transcript: string;
  duration_seconds: number;
}

export async function transcribeAudio(
  input: SttInput,
  options: RunPodCallOptions = {},
): Promise<SttOutput> {
  const output = await callRunPodEndpoint<SttInput, unknown>("stt", input, options);

  if (
    !isRecord(output) ||
    typeof output.transcript !== "string" ||
    typeof output.duration_seconds !== "number"
  ) {
    throw new RunPodError("STT endpoint returned an invalid output payload.", {
      details: output,
    });
  }

  return {
    transcript: output.transcript,
    duration_seconds: output.duration_seconds,
  };
}
