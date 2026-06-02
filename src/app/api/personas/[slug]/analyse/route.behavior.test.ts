import assert from "node:assert/strict";

import {
  buildTraitInferenceCorpus,
  MINIMUM_TRAIT_CORPUS_WORDS,
} from "@/app/api/personas/[slug]/analyse/route";

const result = buildTraitInferenceCorpus({
  diaryEntries: [
    {
      id: "diary-1",
      text: "one two three",
      word_count: 3,
      created_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "diary-2",
      text: "four five",
      word_count: 2,
      created_at: "2026-01-02T00:00:00.000Z",
    },
  ],
  interviewSessions: [
    {
      id: "interview-1",
      subject_turns: ["six seven", " eight nine "],
      completed_at: "2026-01-03T00:00:00.000Z",
      created_at: "2026-01-03T00:00:00.000Z",
    },
  ],
});

assert.equal(MINIMUM_TRAIT_CORPUS_WORDS, 500);
assert.equal(result.corpus, "one two three\n---\nfour five\n---\nsix seven\n---\neight nine");
assert.equal(result.wordCount, 9);
assert.deepEqual(result.diaryEntryIds, ["diary-1", "diary-2"]);
assert.equal(result.diaryEntriesAnalysed, 2);
assert.equal(result.interviewTurnsAnalysed, 2);
