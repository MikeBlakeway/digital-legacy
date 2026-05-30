import "server-only";

import {
  ModalError,
  getModalEndpointUrl,
  isRecord,
  type RunPodCallOptions,
} from "@/lib/ai/client";

export const DEFAULT_INFER_TIMEOUT_MS = 590_000;

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

export async function inferPersona(
  input: InferInput,
  options: RunPodCallOptions = {},
): Promise<InferOutput> {
  const endpointUrl = options.endpointUrl ?? getModalEndpointUrl("infer");
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = Math.min(
    options.timeoutMs ?? DEFAULT_INFER_TIMEOUT_MS,
    DEFAULT_INFER_TIMEOUT_MS,
  );
  const signal = mergeSignals(options.signal, AbortSignal.timeout(timeoutMs));

  const response = await fetchFn(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });

  const responseBody = await readJsonResponse(response, endpointUrl);

  if (!response.ok) {
    throw new ModalError(`Modal infer request failed with HTTP ${response.status}.`, {
      endpointUrl,
      responseStatus: response.status,
      details: responseBody,
    });
  }

  return parseInferOutput(responseBody, endpointUrl);
}

export async function inferText(
  input: InferInput,
  options: RunPodCallOptions = {},
): Promise<InferOutput> {
  return inferPersona(input, options);
}

function parseInferOutput(output: unknown, endpointUrl: string): InferOutput {
  if (!isRecord(output) || typeof output.text !== "string") {
    throw new ModalError("Infer endpoint returned an invalid output payload.", {
      endpointUrl,
      details: output,
    });
  }

  return { text: output.text };
}

async function readJsonResponse(response: Response, endpointUrl: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new ModalError("Modal infer response was not valid JSON.", {
      endpointUrl,
      responseStatus: response.status,
      details: error,
    });
  }
}

function mergeSignals(primary: AbortSignal | undefined, secondary: AbortSignal): AbortSignal {
  if (!primary) {
    return secondary;
  }

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([primary, secondary]);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  primary.addEventListener("abort", abort, { once: true });
  secondary.addEventListener("abort", abort, { once: true });
  return controller.signal;
}
