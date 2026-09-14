import assert from "node:assert/strict";

import { isProtectedPath } from "./proxy";

assert.equal(isProtectedPath("/login"), false);
assert.equal(isProtectedPath("/auth/confirm"), false);
assert.equal(isProtectedPath("/manifest.webmanifest"), false);
assert.equal(isProtectedPath("/robots.txt"), false);
assert.equal(isProtectedPath("/capture"), true);
assert.equal(isProtectedPath("/api/personas"), true);
