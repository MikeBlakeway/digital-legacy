import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

import type { InferInput } from "../src/lib/ai/infer";
import type { TtsInput } from "../src/lib/ai/tts";

const REEXEC_ENV = "DIGITAL_LEGACY_REACT_SERVER_REEXEC";
const REQUIRED_ENV = [
  "MODAL_EMBED_URL",
  "MODAL_INFER_URL",
  "MODAL_STT_URL",
  "MODAL_TTS_URL",
];

const TEST_TIMEOUT_MS = 300_000;
const INFER_TIMEOUT_MS = 580_000;

if (!hasReactServerCondition()) {
  if (process.env[REEXEC_ENV] === "1") {
    console.error("Missing react-server condition after re-exec; cannot import server-only wrappers.");
    process.exit(1);
  }

  const result = spawnSync("npx", ["tsx", fileURLToPath(import.meta.url)], {
    env: {
      ...process.env,
      [REEXEC_ENV]: "1",
      NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS, "--conditions=react-server"),
    },
    stdio: "inherit",
  });

  if (result.error) {
    console.error("Failed to re-run smoke tests with react-server condition.");
    console.error(formatUnknown(result.error));
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

loadDotenv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  process.exit(1);
}

let failures = 0;

void main();

async function main(): Promise<void> {
  const [
    { embedTexts, EMBEDDING_DIMENSIONS },
    { inferPersona },
    { transcribeAudio },
    { synthesizeSpeech },
  ] = await Promise.all([
    import("../src/lib/ai/embed"),
    import("../src/lib/ai/infer"),
    import("../src/lib/ai/stt"),
    import("../src/lib/ai/tts"),
  ]);

  await runTest("embed", async () => {
    const embeddings = await embedTexts(["This is a test of the embedding endpoint."], {
      timeoutMs: TEST_TIMEOUT_MS,
    });

    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      throw new Error("Embed endpoint did not return an embeddings array.");
    }

    if (embeddings[0]?.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected embedding length ${EMBEDDING_DIMENSIONS}, received ${embeddings[0]?.length ?? "missing"}.`,
      );
    }

    return `vector length ${EMBEDDING_DIMENSIONS}`;
  });

  await runTest("infer", async () => {
    const input: InferInput = {
      system_prompt:
        "You are Mike, a software developer from Bolton. Respond naturally and briefly.",
      messages: [{ role: "user", content: "What do you do for work?" }],
      max_tokens: 100,
      temperature: 0.7,
    };

    const response = await inferPersona(input, { timeoutMs: INFER_TIMEOUT_MS });
    const text = response.text.trim();

    if (!text) {
      throw new Error("Infer endpoint returned an empty text response.");
    }

    return `response: ${text.replace(/\s+/g, " ").slice(0, 100)}`;
  });

  await runTest("stt", async () => {
    const audioBase64 = getTestWavBase64();
    const response = await transcribeAudio(
      { audio_base64: audioBase64, language: "en" },
      { timeoutMs: TEST_TIMEOUT_MS },
    );

    if (typeof response.transcript !== "string") {
      throw new Error("STT endpoint did not return a transcript string.");
    }

    return "transcript returned";
  });

  await runTest("tts", async () => {
    const input: TtsInput = {
      text: "Hello. This is a test of the voice synthesis system.",
      speaker_wav_b2_key: null,
      language: "en",
    };

    try {
      const response = await synthesizeSpeech(input, { timeoutMs: TEST_TIMEOUT_MS });

      if (!response.audio_base64) {
        throw new Error("TTS endpoint returned an empty audio_base64 string.");
      }

      return `audio returned, ${Buffer.byteLength(response.audio_base64, "base64")} bytes`;
    } catch (error) {
      if (isLikelyMissingVoiceSample(error)) {
        throw new SmokeSkip(
          "default/fallback voice is unavailable; upload a voice sample before TTS can be used.",
          error,
        );
      }

      throw error;
    }
  });

  if (failures > 0) {
    process.exit(1);
  }
}

async function runTest(name: string, test: () => Promise<string>): Promise<void> {
  const startedAt = Date.now();

  try {
    const message = await test();
    console.log(`✓ ${name} — ${message} (${formatElapsed(Date.now() - startedAt)})`);
  } catch (error) {
    const elapsed = formatElapsed(Date.now() - startedAt);

    if (error instanceof SmokeSkip) {
      console.log(`- ${name} — skipped after ${elapsed}: ${error.message}`);
      if (error.cause) {
        console.log(formatUnknown(error.cause));
      }
      return;
    }

    failures += 1;
    console.error(`✗ ${name} — failed after ${elapsed}`);
    console.error(formatUnknown(error));
  }
}

class SmokeSkip extends Error {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "SmokeSkip";
    this.cause = cause;
  }
}

function getTestWavBase64(): string {
  const audioPath = resolve(process.cwd(), "scripts/test_audio.wav");
  const audio = existsSync(audioPath) ? readFileSync(audioPath) : createSilentWav();

  return audio.toString("base64");
}

function createSilentWav(): Buffer {
  const sampleRate = 16_000;
  const channels = 1;
  const bitsPerSample = 16;
  const durationSeconds = 1;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = sampleRate * channels * bytesPerSample * durationSeconds;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function isLikelyMissingVoiceSample(error: unknown): boolean {
  const text = formatUnknown(error).toLowerCase();

  return (
    text.includes("speaker_wav") ||
    text.includes("speaker_wav_b2_key") ||
    text.includes("missing speaker") ||
    text.includes("voice sample")
  );
}

function hasReactServerCondition(): boolean {
  const execArgv = process.execArgv.join(" ");
  const nodeOptions = process.env.NODE_OPTIONS ?? "";

  return `${execArgv} ${nodeOptions}`.includes("--conditions=react-server");
}

function appendNodeOption(existing: string | undefined, option: string): string {
  return existing?.trim() ? `${existing} ${option}` : option;
}

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatUnknown(value: unknown): string {
  return JSON.stringify(toSerializable(value), null, 2);
}

function toSerializable(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, toSerializable(entry, seen)]),
      ),
    };
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => toSerializable(entry, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, toSerializable(entry, seen)]),
  );
}
