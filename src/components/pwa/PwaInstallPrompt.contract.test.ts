import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "src/components/pwa/PwaInstallPrompt.tsx"),
  "utf8",
);

assert.match(source, /beforeinstallprompt/);
assert.match(source, /appinstalled/);
assert.match(source, /display-mode: standalone/);
assert.match(source, /navigatorWithStandalone\.standalone/);
assert.match(source, /Add to Home Screen/);
assert.match(source, /localStorage/);
