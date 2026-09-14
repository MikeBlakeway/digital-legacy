import assert from "node:assert/strict";

import {
  createAccountSetupUrl,
  readInviteRedirect,
} from "@/lib/auth/invite-redirects";
import { getSafeRelativePath } from "@/lib/redirects";

const providerUrl = createAccountSetupUrl(
  "https://www.digital-legacy.dev",
  "/capture",
);
const consumerUrl = createAccountSetupUrl(
  "https://www.digital-legacy.dev",
  "/talk/mike",
);

assert.equal(
  providerUrl,
  "https://www.digital-legacy.dev/account/setup?next=%2Fcapture",
);
assert.equal(
  consumerUrl,
  "https://www.digital-legacy.dev/account/setup?next=%2Ftalk%2Fmike",
);
assert.equal(
  readInviteRedirect(
    consumerUrl,
    "https://www.digital-legacy.dev/auth/confirm",
  ),
  "/account/setup?next=%2Ftalk%2Fmike",
);
assert.equal(
  readInviteRedirect(
    "https://attacker.example/steal",
    "https://www.digital-legacy.dev/auth/confirm",
  ),
  "/account/setup",
);
assert.equal(getSafeRelativePath("//attacker.example", "/capture"), "/capture");
assert.equal(getSafeRelativePath("/\\attacker.example", "/capture"), "/capture");
