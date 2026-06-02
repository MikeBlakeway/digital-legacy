import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "src/app/login/page.tsx");
const formPath = join(process.cwd(), "src/app/login/LoginForm.tsx");

assert.equal(existsSync(pagePath), true, "src/app/login/page.tsx should exist.");
assert.equal(existsSync(formPath), true, "src/app/login/LoginForm.tsx should exist.");

const pageSource = readFileSync(pagePath, "utf8");
const formSource = readFileSync(formPath, "utf8");

assert.match(pageSource, /searchParams: Promise/);
assert.match(pageSource, /redirectedFrom/);
assert.match(formSource, /name="email"/);
assert.match(formSource, /name="password"/);
assert.match(formSource, /type="hidden" name="redirectedFrom"/);
assert.match(formSource, /useFormStatus/);
assert.doesNotMatch(pageSource + formSource, /sign up|sign-up|signUp/i);
