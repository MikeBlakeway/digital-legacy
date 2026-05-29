import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const endpoints = {
  infer: {
    requirements: ["runpod", "vllm"],
    handlerPatterns: [
      /system_prompt/,
      /messages/,
      /max_tokens/,
      /temperature/,
      /persona_slug/,
      /LoRARequest/,
      /"text"/,
    ],
  },
  tts: {
    requirements: ["runpod", "TTS", "boto3"],
    handlerPatterns: [
      /speaker_wav_b2_key/,
      /audio_base64/,
      /duration_seconds/,
      /boto3/,
      /"text"/,
    ],
  },
  stt: {
    requirements: ["runpod", "faster-whisper"],
    handlerPatterns: [
      /audio_base64/,
      /transcript/,
      /duration_seconds/,
      /WhisperModel/,
    ],
  },
  embed: {
    requirements: ["runpod", "sentence-transformers"],
    handlerPatterns: [/texts/, /embeddings/, /normalize_embeddings=True/],
  },
};

let failures = 0;

for (const [endpoint, expectations] of Object.entries(endpoints)) {
  const dir = join(root, "runpod", endpoint);
  const handler = readRequired(join(dir, "handler.py"));
  const dockerfile = readRequired(join(dir, "Dockerfile"));
  const requirements = readRequired(join(dir, "requirements.txt"));

  assertMatches(endpoint, "handler imports runpod", handler, /import runpod/);
  assertMatches(
    endpoint,
    "handler starts RunPod serverless",
    handler,
    /runpod\.serverless\.start\(\{\s*["']handler["']\s*:\s*handler\s*\}\)/,
  );

  for (const pattern of expectations.handlerPatterns) {
    assertMatches(endpoint, `handler contains ${pattern}`, handler, pattern);
  }

  assertMatches(
    endpoint,
    "Dockerfile uses RunPod CUDA base",
    dockerfile,
    /FROM runpod\/base:0\.6\.2-cuda12\.1\.0/,
  );
  assertMatches(endpoint, "Dockerfile installs requirements", dockerfile, /pip install --no-cache-dir -r requirements\.txt/);
  assertMatches(endpoint, "Dockerfile runs handler", dockerfile, /CMD \["python", "-u", "handler\.py"\]/);

  for (const requirement of expectations.requirements) {
    assertMatches(endpoint, `requirements include ${requirement}`, requirements, new RegExp(`^${escapeRegExp(requirement)}(?:[=<>~!]|$)`, "m"));
  }
}

if (failures > 0) {
  process.exit(1);
}

function readRequired(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    console.error(`Missing required file: ${path}`);
    failures += 1;
    return "";
  }
}

function assertMatches(endpoint, description, content, pattern) {
  if (!pattern.test(content)) {
    console.error(`[${endpoint}] Missing ${description}`);
    failures += 1;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
