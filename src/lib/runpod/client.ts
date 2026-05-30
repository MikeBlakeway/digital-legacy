import "server-only";

export const DEFAULT_MODAL_TIMEOUT_MS = 120_000;

export type RunPodEndpointName = "infer" | "tts" | "stt" | "embed";

export type RunPodFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface RunPodCallOptions {
  endpointUrl?: string;
  fetchFn?: RunPodFetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface RunPodErrorContext {
  endpointUrl?: string;
  responseStatus?: number;
  details?: unknown;
}

const ENDPOINT_URL_ENV_BY_NAME: Record<RunPodEndpointName, string> = {
  infer: "MODAL_INFER_URL",
  tts: "MODAL_TTS_URL",
  stt: "MODAL_STT_URL",
  embed: "MODAL_EMBED_URL",
};

export class RunPodError extends Error {
  readonly endpointUrl?: string;
  readonly responseStatus?: number;
  readonly details?: unknown;

  constructor(message: string, context: RunPodErrorContext = {}) {
    super(message);
    this.name = "RunPodError";
    this.endpointUrl = context.endpointUrl;
    this.responseStatus = context.responseStatus;
    this.details = context.details;
  }
}

export async function callRunPodEndpoint<TInput, TOutput>(
  endpointName: RunPodEndpointName,
  input: TInput,
  options: RunPodCallOptions = {},
): Promise<TOutput> {
  return callModalEndpoint<TInput, TOutput>({
    endpointUrl: options.endpointUrl ?? getModalEndpointUrl(endpointName),
    input,
    fetchFn: options.fetchFn,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });
}

export async function callModalEndpoint<TInput, TOutput>({
  endpointUrl,
  input,
  fetchFn = fetch,
  signal,
  timeoutMs = DEFAULT_MODAL_TIMEOUT_MS,
}: {
  endpointUrl: string;
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
    const response = await fetchFn(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const responseBody = await readJsonResponse(response, endpointUrl);

    if (!response.ok) {
      throw new RunPodError(`Modal request failed with HTTP ${response.status}.`, {
        endpointUrl,
        responseStatus: response.status,
        details: responseBody,
      });
    }

    if (!isRecord(responseBody)) {
      throw new RunPodError("Modal response was not a JSON object.", {
        endpointUrl,
        details: responseBody,
      });
    }

    return responseBody as TOutput;
  } catch (error) {
    if (error instanceof RunPodError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new RunPodError(`Modal request timed out after ${timeoutMs}ms.`, {
        endpointUrl,
      });
    }

    throw new RunPodError("Modal request failed before receiving a response.", {
      endpointUrl,
      details: error,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortListener);
  }
}

export function getModalEndpointUrl(
  endpointName: RunPodEndpointName,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return readRequiredEnv(env, ENDPOINT_URL_ENV_BY_NAME[endpointName]);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonResponse(response: Response, endpointUrl: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new RunPodError("Modal response was not valid JSON.", {
      endpointUrl,
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
