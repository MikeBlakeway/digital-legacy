import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeSources = [
  join(process.cwd(), "src/app/api/personas/route.ts"),
  join(process.cwd(), "src/app/api/personas/[slug]/analyse/route.ts"),
].map((path) => readFileSync(path, "utf8"));

for (const source of routeSources) {
  assert.match(
    source,
    /appMetadata\.role === "subject" \|\| appMetadata\.role === "admin"/,
  );
  assert.match(
    source,
    /\(role\) => role === "subject" \|\| role === "admin"/,
  );
}
