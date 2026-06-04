import assert from "node:assert/strict";

import {
  createMemoryPageHref,
  formatMemoryRelativeDate,
  formatMemorySourceLabel,
  isMemorySourceFilter,
  normalizeMemoryBrowserParams,
} from "@/components/capture/memory-browser-utils";

assert.equal(formatMemorySourceLabel("diary"), "Diary");
assert.equal(formatMemorySourceLabel("interview"), "Interview");
assert.equal(formatMemorySourceLabel("media_caption"), "Photos");
assert.equal(formatMemorySourceLabel("voice_memo"), "Voice memo");
assert.equal(formatMemorySourceLabel("free_text"), "Free text");

assert.equal(isMemorySourceFilter("diary"), true);
assert.equal(isMemorySourceFilter("voice_memo"), true);
assert.equal(isMemorySourceFilter("free_text"), false);
assert.equal(isMemorySourceFilter("other"), false);

assert.deepEqual(
  normalizeMemoryBrowserParams({
    q: "  birthday ",
    source: "diary",
    visibility: "private",
    page: "0",
    per_page: "999",
  }),
  {
    q: "birthday",
    source: "diary",
    visibility: "private",
    page: 1,
    perPage: 50,
  },
);

assert.deepEqual(
  normalizeMemoryBrowserParams({
    q: ["first", "second"],
    source: "free_text",
    visibility: "public",
    page: "3",
    per_page: "25",
  }),
  {
    q: "first",
    source: null,
    visibility: null,
    page: 3,
    perPage: 25,
  },
);

assert.equal(
  createMemoryPageHref({
    slug: "jane-doe",
    q: "birthday",
    source: "media_caption",
    visibility: "family",
    page: 2,
    perPage: 25,
  }),
  "/capture/jane-doe/memories?q=birthday&source=media_caption&visibility=family&page=2&per_page=25",
);

assert.equal(
  createMemoryPageHref({
    slug: "jane-doe",
    q: null,
    source: null,
    visibility: null,
    page: 1,
    perPage: 20,
  }),
  "/capture/jane-doe/memories",
);

assert.equal(
  formatMemoryRelativeDate(
    "2026-06-01T12:00:00.000Z",
    new Date("2026-06-02T12:00:00.000Z"),
  ),
  "1 day ago",
);
