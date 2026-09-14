import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "src/app/account/setup");
const actionSource = readFileSync(join(directory, "actions.ts"), "utf8");
const formSource = readFileSync(join(directory, "PasswordSetupForm.tsx"), "utf8");

assert.match(actionSource, /getClaims\(\)/);
assert.match(actionSource, /updateUser\(\{ password \}\)/);
assert.match(actionSource, /password !== confirmation/);
assert.match(actionSource, /MINIMUM_PASSWORD_LENGTH = 12/);
assert.match(formSource, /autoComplete="new-password"/);
assert.match(formSource, /minLength=\{12\}/);
