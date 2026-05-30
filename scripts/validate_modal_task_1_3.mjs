#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];

function assertFile(path) {
  const fullPath = resolve(root, path);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required file: ${path}`);
  }
}

function assertContains(path, pattern, message) {
  const fullPath = resolve(root, path);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required file: ${path}`);
    return;
  }

  const content = readFileSync(fullPath, "utf8");
  if (!pattern.test(content)) {
    failures.push(message);
  }
}

assertFile("modal/app.py");
assertFile("src/lib/ai/client.ts");
assertFile("src/lib/ai/infer.ts");
assertFile("src/lib/ai/embed.ts");
assertFile("src/lib/ai/stt.ts");
assertFile("src/lib/ai/tts.ts");
assertFile("scripts/test_endpoints.ts");

assertContains(
  "modal/app.py",
  /fastapi_endpoint\(method=\"POST\"\)/,
  "modal/app.py must expose POST endpoints via modal.fastapi_endpoint.",
);

assertContains(
  "src/lib/ai/client.ts",
  /MODAL_INFER_URL|MODAL_TTS_URL|MODAL_STT_URL|MODAL_EMBED_URL/,
  "src/lib/ai/client.ts must map MODAL_* endpoint URLs.",
);

assertContains(
  "scripts/test_endpoints.ts",
  /MODAL_INFER_URL|MODAL_TTS_URL|MODAL_STT_URL|MODAL_EMBED_URL/,
  "scripts/test_endpoints.ts must reference MODAL_* URL variables.",
);

if (existsSync(resolve(root, "runpod"))) {
  failures.push("Legacy runpod directory should not exist after Phase 5 migration.");
}

if (failures.length > 0) {
  console.error("Modal migration validation failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Modal migration validation passed.");
