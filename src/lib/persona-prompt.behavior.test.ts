import assert from "node:assert/strict";

import { buildPersonaSystemPrompt } from "@/lib/persona-prompt";
import type { Persona } from "@/lib/supabase/personas";
import type { PersonaTraits } from "@/lib/supabase/traits";

const persona: Persona = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Mike",
  slug: "mike",
  owner_user_id: "11111111-1111-1111-1111-111111111111",
  birth_year: 1978,
  birth_place: "Manchester, England",
  locations_lived: ["Manchester", "London"],
  lora_adapter_key: null,
  voice_sample_key: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const traits: PersonaTraits = {
  id: "22222222-2222-2222-2222-222222222222",
  persona_id: persona.id,
  version: 2,
  openness: 0.8,
  conscientiousness: 0.7,
  extraversion: 0.4,
  agreeableness: 0.9,
  neuroticism: 0.3,
  narrative_agency: 0.6,
  narrative_communion: 0.8,
  narrative_redemption: 0.5,
  dominant_values: ["benevolence", "security"],
  summary_prose: "Mike is curious and loyal.",
  identity_block: "You are curious, loyal, and reflective.",
  diary_entries_analysed: 4,
  interview_turns_analysed: 8,
  computed_at: "2026-02-01T00:00:00.000Z",
  is_current: true,
};

const promptWithTraits = buildPersonaSystemPrompt(persona, traits, [
  { content: "You remember Sunday walks in London." },
  { content: "  " },
]);

assert.equal(
  promptWithTraits,
  [
    "You are curious, loyal, and reflective.",
    "Here are some things you remember that are relevant to this conversation:\n\n- You remember Sunday walks in London.",
    "You are speaking to members of your family. Speak in first person, in your natural voice.\nKeep responses personal and human. Do not refer to yourself as an AI.",
  ].join("\n\n"),
);

const promptWithoutTraits = buildPersonaSystemPrompt(persona, null, []);

assert.equal(
  promptWithoutTraits,
  [
    "You are Mike.\nYou were born in Manchester, England in 1978.\nYou have lived in Manchester and London.",
    "You are speaking to members of your family. Speak in first person, in your natural voice.\nKeep responses personal and human. Do not refer to yourself as an AI.",
  ].join("\n\n"),
);
