import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const profileSource = read("src/components/capture/PersonalityProfile.tsx");
const inferenceSource = read("src/components/capture/TraitInferenceButton.tsx");
const dashboardSource = read("src/app/(app)/capture/[slug]/page.tsx");
const diarySource = read("src/app/(app)/capture/[slug]/diary/page.tsx");

test("profile progress is presented as story time rather than transcript words", () => {
  for (const source of [
    profileSource,
    inferenceSource,
    dashboardSource,
    diarySource,
  ]) {
    assert.doesNotMatch(source, /more words|words captured|words are needed|>Words</i);
  }

  assert.match(profileSource, /Profile readiness/);
  assert.match(profileSource, /Story time/);
  assert.match(dashboardSource, /diary or interview story content/);
  assert.match(diarySource, /Story time/);
});
