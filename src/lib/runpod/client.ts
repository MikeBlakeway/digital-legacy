import "server-only";

export const RUNPOD_API_BASE_URL = "https://api.runpod.ai/v2";
export const DEFAULT_RUNPOD_TIMEOUT_MS = 120_000;

export type RunPodEndpointName = "infer" | "tts" | "stt" | "embed";

export type RunPodStatus =
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT"
  | string;

export interface RunPodRunsyncResponse<TOutput> {
  id?: string;
  status?: RunPodStatus;
  output?: TOutput;
  error?: unknown;
  delayTime?: number;
  executionTime?: number;
}

export type RunPodFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface RunPodCallOptions {
  apiKey?: string;
  endpointId?: string;
  fetchFn?: RunPodFetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface RunPodErrorContext {
  endpointId?: string;
  responseStatus?: number;
  runpodStatus?: RunPodStatus;
  details?: unknown;
}

const ENDPOINT_ID_ENV_BY_NAME: Record<RunPodEndpointName, string> = {
  infer: "RUNPOD_INFER_ENDPOINT_ID",
  tts: "RUNPOD_TTS_ENDPOINT_ID",
  stt: "RUNPOD_STT_ENDPOINT_ID",
  embed: "RUNPOD_EMBED_ENDPOINT_ID",
};

export class RunPodError extends Error {
  readonly endpointId?: string;
  readonly responseStatus?: number;
  readonly runpodStatus?: RunPodStatus;
  readonly details?: unknown;

  constructor(message: string, context: RunPodErrorContext = {}) {
    super(message);
    this.name = "RunPodError";
    this.endpointId = context.endpointId;
    this.responseStatus = context.responseStatus;
    this.runpodStatus = context.runpodStatus;
    this.details = context.details;
  }
}

export async function callRunPodEndpoint<TInput, TOutput>(
  endpointName: RunPodEndpointName,
  input: TInput,
  options: RunPodCallOptions = {},
): Promise<TOutput> {
  return runPodRunsync<TInput, TOutput>({
    endpointId: options.endpointId ?? getRunPodEndpointId(endpointName),
    apiKey: options.apiKey ?? getRunPodApiKey(),
    input,
    fetchFn: options.fetchFn,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });
}

export async function runPodRunsync<TInput, TOutput>({
  endpointId,
  apiKey,
  input,
  fetchFn = fetch,
  signal,
  timeoutMs = DEFAULT_RUNPOD_TIMEOUT_MS,
}: {
  endpointId: string;
  apiKey: string;
  input: TInput;
  fetchFn?: RunPodFetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<TOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortListener = () => controller.abort();
  signal?.addEventListener("abort", abortListener, { once: true });

  try {
    const response = await fetchFn(`${RUNPOD_API_BASE_URL}/${endpointId}/runsync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });

    const responseBody = await readJsonResponse(response, endpointId);

    if (!response.ok) {
      throw new RunPodError(`RunPod request failed with HTTP ${response.status}.`, {
        endpointId,
        responseStatus: response.status,
        details: responseBody,
      });
    }

    const runpodStatus = isRecord(responseBody)
      ? getOptionalString(responseBody.status)
      : undefined;

    if (runpodStatus !== "COMPLETED") {
      throw new RunPodError(
        `RunPod run did not complete successfully: ${runpodStatus ?? "UNKNOWN"}.`,
        {
          endpointId,
          runpodStatus,
          details: responseBody,
        },
      );
    }

    if (!isRecord(responseBody) || !("output" in responseBody)) {
      throw new RunPodError("RunPod response did not include an output object.", {
        endpointId,
        runpodStatus,
        details: responseBody,
      });
    }

    return responseBody.output as TOutput;
  } catch (error) {
    if (error instanceof RunPodError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RunPodError(`RunPod request timed out after ${timeoutMs}ms.`, {
        endpointId,
      });
    }

    throw new RunPodError("RunPod request failed before receiving a response.", {
      endpointId,
      details: error,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortListener);
  }
}

export function getRunPodEndpointId(
  endpointName: RunPodEndpointName,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return readRequiredEnv(env, ENDPOINT_ID_ENV_BY_NAME[endpointName]);
}

export function getRunPodApiKey(env: NodeJS.ProcessEnv = process.env): string {
  return readRequiredEnv(env, "RUNPOD_API_KEY");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonResponse(response: Response, endpointId: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new RunPodError("RunPod response was not valid JSON.", {
      endpointId,
      responseStatus: response.status,
      details: error,
    });
  }
}

function readRequiredEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
