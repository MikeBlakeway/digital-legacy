import "server-only";

import {
  RunPodError,
  callRunPodEndpoint,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/runpod/client";

export type InferMessageRole = "user" | "assistant";

export interface InferMessage {
  role: InferMessageRole;
  content: string;
}

export interface InferInput {
  system_prompt: string;
  messages: InferMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface InferOutput {
  text: string;
}

export async function inferText(
  input: InferInput,
  options: RunPodCallOptions = {},
): Promise<InferOutput> {
  const output = await callRunPodEndpoint<InferInput, unknown>("infer", input, options);

  if (!isRecord(output) || typeof output.text !== "string") {
    throw new RunPodError("Infer endpoint returned an invalid output payload.", {
      details: output,
    });
  }

  return { text: output.text };
}
