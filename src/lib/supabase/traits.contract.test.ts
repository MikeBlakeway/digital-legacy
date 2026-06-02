import type { SupabaseClient } from "@supabase/supabase-js";

import type { TraitInferenceResult } from "@/lib/ai/analyse";
import {
  getCurrentTraits,
  getLatestTraitVersion,
  getTraitHistory,
  insertPersonaTraits,
  unsetCurrentTraits,
  type PersonaTraits,
} from "@/lib/supabase/traits";

async function assertTraitContracts(supabase: SupabaseClient) {
  const inference: TraitInferenceResult = {
    openness: 0.8,
    conscientiousness: 0.6,
    extraversion: 0.4,
    agreeableness: 0.9,
    neuroticism: 0.3,
    narrative_agency: 0.7,
    narrative_communion: 0.8,
    narrative_redemption: 0.5,
    dominant_values: ["benevolence", "self-direction"],
    summary_prose: "A concise inferred profile.",
    identity_block: "You are reflective and caring.",
  };

  const personaId = "00000000-0000-0000-0000-000000000000";
  const current: PersonaTraits | null = await getCurrentTraits(supabase, personaId);
  const history: PersonaTraits[] = await getTraitHistory(supabase, personaId);
  const latestVersion: number = await getLatestTraitVersion(supabase, personaId);

  await unsetCurrentTraits(supabase, personaId);

  const inserted: PersonaTraits = await insertPersonaTraits(supabase, {
    personaId,
    version: latestVersion + 1,
    inference,
    diaryEntriesAnalysed: 2,
    interviewTurnsAnalysed: 4,
    computedAt: "2026-02-01T00:00:00.000Z",
    isCurrent: true,
  });

  return {
    current,
    history,
    inserted,
  };
}

void assertTraitContracts({} as SupabaseClient);
