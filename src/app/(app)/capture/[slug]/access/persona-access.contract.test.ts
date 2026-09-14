import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const actionsSource = read("src/app/(app)/capture/[slug]/access/actions.ts");
const controlsSource = read(
  "src/app/(app)/capture/[slug]/access/PersonaAccessControls.tsx",
);
const pageSource = read("src/app/(app)/capture/[slug]/access/page.tsx");
const migrationSource = read(
  "supabase/migrations/20260914140717_allow_persona_owners_to_manage_access.sql",
);

assert.match(actionsSource, /persona\.owner_user_id !== userId/);
assert.match(actionsSource, /inviteUserByEmail\(email, \{/);
assert.match(actionsSource, /createAccountSetupUrl\(origin, conversationPath\)/);
assert.match(actionsSource, /\.from\("persona_access"\)\.insert/);
assert.match(actionsSource, /\.from\("persona_access"\)[\s\S]*\.delete\(\)/);
assert.match(actionsSource, /granted_by: userId/);
assert.match(actionsSource, /shouldCreateUser: false/);
assert.match(controlsSource, /window\.confirm/);
assert.match(pageSource, /Family access/);
assert.match(pageSource, /persona\.owner_user_id !== userId/);

assert.match(migrationSource, /public\.is_persona_owner\(persona_id\)/);
assert.match(migrationSource, /granted_by = \(select auth\.uid\(\)\)/);
assert.match(migrationSource, /Owners and admins can create persona grants/);
assert.match(migrationSource, /Owners and admins can delete persona grants/);

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}
