import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const actionsPath = join(process.cwd(), "src/app/login/actions.ts");

assert.equal(existsSync(actionsPath), true, "src/app/login/actions.ts should exist.");

const source = readFileSync(actionsPath, "utf8");

assert.match(source, /^"use server";/);
assert.match(source, /createClient/);
assert.match(source, /signInWithPassword/);
assert.match(source, /redirect\(redirectTarget\)/);
assert.doesNotMatch(source, /@\/lib\/supabase\/client/);
assert.doesNotMatch(source, /signUp|resetPassword|signInWithOAuth/);
