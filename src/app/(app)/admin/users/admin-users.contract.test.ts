import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const actionsSource = read("src/app/(app)/admin/users/actions.ts");
const formSource = read("src/app/(app)/admin/users/ProviderInviteForm.tsx");
const directorySource = read("src/lib/auth/user-admin.ts");
const pageSource = read("src/app/(app)/admin/users/page.tsx");
const supabaseConfig = read("supabase/config.toml");

assert.match(actionsSource, /requireAdmin\(ADMIN_USERS_PATH\)/);
assert.match(actionsSource, /inviteUserByEmail\(email, \{/);
assert.match(actionsSource, /createAccountSetupUrl\(origin, "\/capture"\)/);
assert.match(actionsSource, /updateUserById\(user\.id/);
assert.match(actionsSource, /role: "subject"/);
assert.match(actionsSource, /roles: \["subject"\]/);
assert.doesNotMatch(actionsSource, /persona_access/);

assert.match(directorySource, /auth\.admin\.listUsers/);
assert.match(directorySource, /isProvider/);
assert.match(formSource, /useActionState/);
assert.match(pageSource, /Invite a persona provider/);
assert.doesNotMatch(pageSource, /Invite a family member/);

const signupSettings = supabaseConfig.match(/enable_signup = false/g) ?? [];
assert.equal(
  signupSettings.length,
  3,
  "email, SMS, and general self-signup should all be disabled",
);

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}
