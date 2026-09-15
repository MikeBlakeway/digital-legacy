import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const shellSource = read("src/components/navigation/AppShell.tsx");
const layoutSource = read("src/app/(app)/layout.tsx");
const homeSource = read("src/app/(app)/page.tsx");
const installPromptSource = read("src/components/pwa/PwaInstallPrompt.tsx");

test("authenticated routes are wrapped in the responsive app shell", () => {
  assert.match(layoutSource, /<AppShell/);
  assert.match(layoutSource, /listAccessiblePersonas/);
  assert.match(shellSource, /aria-label="Primary navigation"/);
  assert.match(shellSource, /md:grid-cols-\[4\.75rem_minmax\(0,1fr\)\]/);
  assert.match(shellSource, /lg:grid-cols-\[16rem_minmax\(0,1fr\)\]/);
  assert.match(shellSource, /env\(safe-area-inset-bottom\)/);
  assert.match(
    installPromptSource,
    /bottom-\[calc\(5rem\+env\(safe-area-inset-bottom\)\)\]/,
  );
});

test("home remains a stable persona chooser", () => {
  assert.doesNotMatch(homeSource, /personas\.length === 1/);
  assert.match(homeSource, /Choose a persona to continue/);
});

test("secondary navigation includes account and access actions", () => {
  assert.match(shellSource, /Family access/);
  assert.match(shellSource, /Administration/);
  assert.match(shellSource, /Sign out/);
  assert.match(shellSource, /action=\{signOut\}/);
});
