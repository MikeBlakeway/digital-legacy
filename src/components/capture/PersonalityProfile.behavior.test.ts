import assert from "node:assert/strict";

import {
  MINIMUM_PROFILE_WORDS,
  formatDominantValue,
  formatProfileMetadata,
  getProfileProgress,
} from "@/components/capture/personality-profile-utils";
import type { PersonaTraits } from "@/lib/supabase/traits";

const traits: PersonaTraits = {
  id: "22222222-2222-2222-2222-222222222222",
  persona_id: "00000000-0000-0000-0000-000000000000",
  version: 1,
  openness: 0.91,
  conscientiousness: 0.82,
  extraversion: 0.23,
  agreeableness: 0.77,
  neuroticism: 0.39,
  narrative_agency: 0.7,
  narrative_communion: 0.8,
  narrative_redemption: 0.5,
  dominant_values: ["self-direction", "benevolence"],
  summary_prose: "You come across as quietly curious and deeply loyal.",
  identity_block: "You are quietly curious and deeply loyal.",
  diary_entries_analysed: 4,
  interview_turns_analysed: 7,
  computed_at: "2026-02-01T10:30:00.000Z",
  is_current: true,
};

const metadata = formatProfileMetadata({
  traits,
  diaryEntryCount: 4,
  completedInterviewCount: 2,
  totalWordCount: 864,
});

assert.equal(
  metadata,
  "Based on 4 diary entries and 2 interview sessions (864 words). Last updated 1 February 2026.",
);

assert.equal(formatDominantValue("self-direction"), "Self Direction");
assert.equal(formatDominantValue("benevolence"), "Benevolence");

const progress = getProfileProgress({
  totalWordCount: 125,
  minimumWordCount: MINIMUM_PROFILE_WORDS,
});

assert.equal(progress.canGenerate, false);
assert.equal(progress.percent, 25);
assert.equal(progress.wordsRemaining, 375);

const completeProgress = getProfileProgress({
  totalWordCount: 500,
  minimumWordCount: MINIMUM_PROFILE_WORDS,
});

assert.equal(completeProgress.canGenerate, true);
assert.equal(completeProgress.percent, 100);
assert.equal(completeProgress.wordsRemaining, 0);
