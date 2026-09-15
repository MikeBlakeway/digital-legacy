import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const globalStyles = read("src/app/globals.css");
const layoutSource = read("src/app/layout.tsx");
const selectorSource = read("src/components/theme/ThemeSelector.tsx");
const shellSource = read("src/components/navigation/AppShell.tsx");

test("semantic shell colors resolve through runtime theme variables", () => {
  assert.match(globalStyles, /--color-bg:\s+var\(--bg\)/);
  assert.match(globalStyles, /--color-surface:\s+var\(--surface\)/);
  assert.match(globalStyles, /--color-fg1:\s+var\(--fg1\)/);
  assert.match(globalStyles, /@custom-variant dark .*data-theme="dark"/);
});

test("the preferred theme is applied before hydration", () => {
  assert.match(layoutSource, /suppressHydrationWarning/);
  assert.match(layoutSource, /<ThemeScript \/>/);
});

test("appearance preferences are persistent and available in More", () => {
  assert.match(selectorSource, /digital-legacy-theme/);
  assert.match(selectorSource, /localStorage\.setItem/);
  assert.match(selectorSource, /prefers-color-scheme: dark/);
  assert.match(selectorSource, /aria-pressed=\{selected\}/);
  assert.match(shellSource, /<ThemeSelector \/>/);
});
