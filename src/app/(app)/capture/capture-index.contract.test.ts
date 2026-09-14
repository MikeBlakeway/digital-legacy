import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/(app)/capture/page.tsx"), "utf8");

assert.match(source, /getClaims\(\)/);
assert.match(source, /getPersonasByOwner/);
assert.match(source, /personas\.length === 0/);
assert.match(source, /redirect\("\/capture\/new"\)/);
assert.match(source, /personas\.length === 1/);
assert.match(source, /redirect\(`\/capture\/\$\{personas\[0\]\.slug\}`\)/);
assert.match(source, /redirect\("\/"\)/);
