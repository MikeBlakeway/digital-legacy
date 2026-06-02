import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type RedirectsModule = {
  getSafeRelativePath: (value: string | null, fallback: string) => string;
};

const modulePath = join(process.cwd(), "src/lib/redirects.ts");

assert.equal(existsSync(modulePath), true, "src/lib/redirects.ts should exist.");

async function main() {
  const { getSafeRelativePath } = (await import(
    pathToFileURL(modulePath).href
  )) as RedirectsModule;

  assert.equal(getSafeRelativePath(null, "/capture"), "/capture");
  assert.equal(getSafeRelativePath("", "/capture"), "/capture");
  assert.equal(getSafeRelativePath("/capture", "/capture"), "/capture");
  assert.equal(
    getSafeRelativePath("/capture/alice?tab=diary", "/capture"),
    "/capture/alice?tab=diary",
  );
  assert.equal(getSafeRelativePath("capture", "/capture"), "/capture");
  assert.equal(
    getSafeRelativePath("https://evil.example/capture", "/capture"),
    "/capture",
  );
  assert.equal(getSafeRelativePath("//evil.example/capture", "/capture"), "/capture");
}

void main();
