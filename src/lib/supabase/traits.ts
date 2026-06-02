import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { TraitInferenceResult } from "@/lib/ai/analyse";

const PERSONA_TRAIT_COLUMNS =
  "id, persona_id, version, openness, conscientiousness, extraversion, agreeableness, neuroticism, narrative_agency, narrative_communion, narrative_redemption, dominant_values, summary_prose, identity_block, diary_entries_analysed, interview_turns_analysed, computed_at, is_current";

export type PersonaTraits = {
  id: string;
  persona_id: string;
  version: number;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  narrative_agency: number;
  narrative_communion: number;
  narrative_redemption: number;
  dominant_values: string[];
  summary_prose: string;
  identity_block: string;
  diary_entries_analysed: number;
  interview_turns_analysed: number;
  computed_at: string;
  is_current: boolean;
};

export type InsertPersonaTraitsData = {
  personaId: string;
  version: number;
  inference: TraitInferenceResult;
  diaryEntriesAnalysed: number;
  interviewTurnsAnalysed: number;
  computedAt?: string;
  isCurrent?: boolean;
};

export class TraitsDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "TraitsDatabaseError";
    this.details = details;
  }
}

export async function getCurrentTraits(
  client: SupabaseClient,
  persona_id: string,
): Promise<PersonaTraits | null> {
  const result = await client
    .from("persona_traits")
    .select(PERSONA_TRAIT_COLUMNS)
    .eq("persona_id", normalizeRequiredText(persona_id, "persona_id"))
    .eq("is_current", true)
    .maybeSingle();
  const traits: unknown = result.data;

  if (result.error) {
    throw new TraitsDatabaseError("Failed to fetch current persona traits.", result.error);
  }

  return traits === null ? null : normalizePersonaTraits(traits);
}

export async function getTraitHistory(
  client: SupabaseClient,
  persona_id: string,
): Promise<PersonaTraits[]> {
  const result = await client
    .from("persona_traits")
    .select(PERSONA_TRAIT_COLUMNS)
    .eq("persona_id", normalizeRequiredText(persona_id, "persona_id"))
    .order("version", { ascending: false });
  const rows: unknown = result.data;

  if (result.error) {
    throw new TraitsDatabaseError("Failed to fetch persona trait history.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new TraitsDatabaseError("Supabase returned invalid trait history.", rows);
  }

  return rows.map(normalizePersonaTraits);
}

export async function getLatestTraitVersion(
  client: SupabaseClient,
  personaId: string,
): Promise<number> {
  const result = await client
    .from("persona_traits")
    .select("version")
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"))
    .order("version", { ascending: false })
    .limit(1);
  const rows: unknown = result.data;

  if (result.error) {
    throw new TraitsDatabaseError("Failed to fetch latest trait version.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new TraitsDatabaseError("Supabase returned invalid trait versions.", rows);
  }

  const latest = rows[0];

  if (latest === undefined) {
    return 0;
  }

  if (!isRecord(latest) || typeof latest.version !== "number") {
    throw new TraitsDatabaseError("Supabase returned invalid trait version.", latest);
  }

  return latest.version;
}

export async function unsetCurrentTraits(
  client: SupabaseClient,
  personaId: string,
): Promise<void> {
  const result = await client
    .from("persona_traits")
    .update({ is_current: false })
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"))
    .eq("is_current", true);

  if (result.error) {
    throw new TraitsDatabaseError("Failed to unset current persona traits.", result.error);
  }
}

export async function insertPersonaTraits(
  client: SupabaseClient,
  data: InsertPersonaTraitsData,
): Promise<PersonaTraits> {
  const inference = normalizeTraitInference(data.inference);
  const result = await client
    .from("persona_traits")
    .insert({
      persona_id: normalizeRequiredText(data.personaId, "personaId"),
      version: normalizePositiveInteger(data.version, "version"),
      openness: inference.openness,
      conscientiousness: inference.conscientiousness,
      extraversion: inference.extraversion,
      agreeableness: inference.agreeableness,
      neuroticism: inference.neuroticism,
      narrative_agency: inference.narrative_agency,
      narrative_communion: inference.narrative_communion,
      narrative_redemption: inference.narrative_redemption,
      dominant_values: inference.dominant_values,
      summary_prose: inference.summary_prose,
      identity_block: inference.identity_block,
      diary_entries_analysed: normalizeNonNegativeInteger(
        data.diaryEntriesAnalysed,
        "diaryEntriesAnalysed",
      ),
      interview_turns_analysed: normalizeNonNegativeInteger(
        data.interviewTurnsAnalysed,
        "interviewTurnsAnalysed",
      ),
      computed_at: data.computedAt ?? new Date().toISOString(),
      is_current: data.isCurrent ?? true,
    })
    .select(PERSONA_TRAIT_COLUMNS)
    .single();
  const inserted: unknown = result.data;

  if (result.error) {
    throw new TraitsDatabaseError("Failed to insert persona traits.", result.error);
  }

  return normalizePersonaTraits(inserted);
}

function normalizeTraitInference(
  inference: TraitInferenceResult,
): TraitInferenceResult {
  return {
    openness: normalizeUnitNumber(inference.openness, "openness"),
    conscientiousness: normalizeUnitNumber(
      inference.conscientiousness,
      "conscientiousness",
    ),
    extraversion: normalizeUnitNumber(inference.extraversion, "extraversion"),
    agreeableness: normalizeUnitNumber(inference.agreeableness, "agreeableness"),
    neuroticism: normalizeUnitNumber(inference.neuroticism, "neuroticism"),
    narrative_agency: normalizeUnitNumber(
      inference.narrative_agency,
      "narrative_agency",
    ),
    narrative_communion: normalizeUnitNumber(
      inference.narrative_communion,
      "narrative_communion",
    ),
    narrative_redemption: normalizeUnitNumber(
      inference.narrative_redemption,
      "narrative_redemption",
    ),
    dominant_values: normalizeStringArray(
      inference.dominant_values,
      "dominant_values",
    ),
    summary_prose: normalizeRequiredText(inference.summary_prose, "summary_prose"),
    identity_block: normalizeRequiredText(inference.identity_block, "identity_block"),
  };
}

function normalizePersonaTraits(value: unknown): PersonaTraits {
  if (!isPersonaTraits(value)) {
    throw new TraitsDatabaseError("Supabase returned an invalid trait row.", value);
  }

  return value;
}

function isPersonaTraits(value: unknown): value is PersonaTraits {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    typeof value.version === "number" &&
    isUnitNumber(value.openness) &&
    isUnitNumber(value.conscientiousness) &&
    isUnitNumber(value.extraversion) &&
    isUnitNumber(value.agreeableness) &&
    isUnitNumber(value.neuroticism) &&
    isUnitNumber(value.narrative_agency) &&
    isUnitNumber(value.narrative_communion) &&
    isUnitNumber(value.narrative_redemption) &&
    isStringArray(value.dominant_values) &&
    typeof value.summary_prose === "string" &&
    typeof value.identity_block === "string" &&
    typeof value.diary_entries_analysed === "number" &&
    typeof value.interview_turns_analysed === "number" &&
    typeof value.computed_at === "string" &&
    typeof value.is_current === "boolean"
  );
}

function normalizeRequiredText(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${name} must be non-empty.`);
  }

  return normalized;
}

function normalizeStringArray(value: string[], name: string): string[] {
  const normalized = value.map((entry) => entry.trim()).filter(Boolean);

  if (normalized.length === 0) {
    throw new Error(`${name} must contain at least one value.`);
  }

  return normalized;
}

function normalizePositiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

function normalizeNonNegativeInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return value;
}

function normalizeUnitNumber(value: number, name: string): number {
  if (!isUnitNumber(value)) {
    throw new Error(`${name} must be between 0 and 1.`);
  }

  return value;
}

function isUnitNumber(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
