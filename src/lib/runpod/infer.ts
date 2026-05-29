import "server-only";

import {
  RUNPOD_API_BASE_URL,
  RunPodError,
  getRunPodApiKey,
  getRunPodEndpointId,
  isRecord,
  type RunPodCallOptions,
  type RunPodFetch,
  type RunPodStatus,
} from "@/lib/runpod/client";

export const INFER_POLL_INTERVAL_MS = 2_000;
export const INFER_MAX_POLL_DURATION_MS = 580_000;

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

interface RunPodRunResponse {
  id?: string;
  status?: RunPodStatus;
  error?: unknown;
}

interface RunPodStatusResponse {
  id?: string;
  status?: RunPodStatus;
  output?: unknown;
  error?: unknown;
}

export async function inferPersona(
  input: InferInput,
  options: RunPodCallOptions = {},
): Promise<InferOutput> {
  const endpointId = options.endpointId ?? getRunPodEndpointId("infer");
  const apiKey = options.apiKey ?? getRunPodApiKey();
  const fetchFn = options.fetchFn ?? fetch;
  const maxPollDurationMs = Math.min(
    options.timeoutMs ?? INFER_MAX_POLL_DURATION_MS,
    INFER_MAX_POLL_DURATION_MS,
  );

  const run = await submitInferJob({ endpointId, apiKey, input, fetchFn, signal: options.signal });
  const jobId = run.id;

  if (!jobId) {
    throw new RunPodError("RunPod infer /run response did not include a job id.", {
      endpointId,
      runpodStatus: run.status,
      details: run,
    });
  }

  const startedAt = Date.now();
  let lastStatus: RunPodStatus | undefined = run.status;

  while (Date.now() - startedAt <= maxPollDurationMs) {
    const status = await getInferJobStatus({
      endpointId,
      apiKey,
      jobId,
      fetchFn,
      signal: options.signal,
    });
    lastStatus = status.status;

    if (status.status === "COMPLETED") {
      return parseInferOutput(status.output, endpointId, jobId);
    }

    if (status.status === "FAILED") {
      throw new RunPodError(`RunPod infer job ${jobId} failed.`, {
        endpointId,
        runpodStatus: status.status,
        details: status.error ?? status,
      });
    }

    if (status.status === "TIMED_OUT" || status.status === "CANCELLED") {
      throw new RunPodError(`RunPod infer job ${jobId} ended with status ${status.status}.`, {
        endpointId,
        runpodStatus: status.status,
        details: status.error ?? status,
      });
    }

    const elapsedMs = Date.now() - startedAt;
    const remainingMs = maxPollDurationMs - elapsedMs;

    if (remainingMs <= 0) {
      break;
    }

    await delay(Math.min(INFER_POLL_INTERVAL_MS, remainingMs), options.signal);
  }

  throw new RunPodError(
    `RunPod infer job ${jobId} timed out after ${maxPollDurationMs}ms while polling /status.`,
    {
      endpointId,
      runpodStatus: lastStatus,
      details: { jobId, maxPollDurationMs },
    },
  );
}

export async function inferText(
  input: InferInput,
  options: RunPodCallOptions = {},
): Promise<InferOutput> {
  return inferPersona(input, options);
}

async function submitInferJob({
  endpointId,
  apiKey,
  input,
  fetchFn,
  signal,
}: {
  endpointId: string;
  apiKey: string;
  input: InferInput;
  fetchFn: RunPodFetch;
  signal?: AbortSignal;
}): Promise<RunPodRunResponse> {
  const response = await fetchFn(`${RUNPOD_API_BASE_URL}/${endpointId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
    signal,
  });
  const responseBody = await readJsonResponse(response, endpointId);

  if (!response.ok) {
    throw new RunPodError(`RunPod infer /run request failed with HTTP ${response.status}.`, {
      endpointId,
      responseStatus: response.status,
      details: responseBody,
    });
  }

  if (!isRecord(responseBody)) {
    throw new RunPodError("RunPod infer /run response was not an object.", {
      endpointId,
      details: responseBody,
    });
  }

  return {
    id: typeof responseBody.id === "string" ? responseBody.id : undefined,
    status: typeof responseBody.status === "string" ? responseBody.status : undefined,
    error: responseBody.error,
  };
}

async function getInferJobStatus({
  endpointId,
  apiKey,
  jobId,
  fetchFn,
  signal,
}: {
  endpointId: string;
  apiKey: string;
  jobId: string;
  fetchFn: RunPodFetch;
  signal?: AbortSignal;
}): Promise<RunPodStatusResponse> {
  const response = await fetchFn(`${RUNPOD_API_BASE_URL}/${endpointId}/status/${jobId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
  });
  const responseBody = await readJsonResponse(response, endpointId);

  if (!response.ok) {
    throw new RunPodError(
      `RunPod infer /status request for job ${jobId} failed with HTTP ${response.status}.`,
      {
        endpointId,
        responseStatus: response.status,
        details: responseBody,
      },
    );
  }

  if (!isRecord(responseBody)) {
    throw new RunPodError(`RunPod infer /status response for job ${jobId} was not an object.`, {
      endpointId,
      details: responseBody,
    });
  }

  return {
    id: typeof responseBody.id === "string" ? responseBody.id : undefined,
    status: typeof responseBody.status === "string" ? responseBody.status : undefined,
    output: responseBody.output,
    error: responseBody.error,
  };
}

function parseInferOutput(output: unknown, endpointId: string, jobId: string): InferOutput {
  if (!isRecord(output) || typeof output.text !== "string") {
    throw new RunPodError("Infer endpoint returned an invalid output payload.", {
      endpointId,
      runpodStatus: "COMPLETED",
      details: { jobId, output },
    });
  }

  return { text: output.text };
}

async function readJsonResponse(response: Response, endpointId: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new RunPodError("RunPod infer response was not valid JSON.", {
      endpointId,
      responseStatus: response.status,
      details: error,
    });
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener("abort", abort);
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", abort, { once: true });
  });
}
