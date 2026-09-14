import assert from "node:assert/strict";

import manifest from "./manifest";

const value = manifest();

assert.equal(value.id, "/");
assert.equal(value.start_url, "/");
assert.equal(value.scope, "/");
assert.equal(value.display, "standalone");
assert.equal(value.orientation, "any");
assert.equal(value.icons?.length, 3);
assert.ok(value.icons?.some((icon) => icon.sizes === "192x192"));
assert.ok(value.icons?.some((icon) => icon.sizes === "512x512"));
assert.ok(value.icons?.some((icon) => icon.purpose === "maskable"));
