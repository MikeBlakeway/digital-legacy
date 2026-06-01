import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const PERSONA_COLUMNS =
  "id, name, slug, owner_user_id, birth_year, birth_place, locations_lived, lora_adapter_key, voice_sample_key, created_at, updated_at";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Persona = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  birth_year: number | null;
  birth_place: string | null;
  locations_lived: string[] | null;
  lora_adapter_key: string | null;
  voice_sample_key: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePersonaData = {
  name: string;
  slug: string;
  owner_user_id: string;
  birth_year?: number | null;
  birth_place?: string | null;
  locations_lived?: string[] | null;
};

export class PersonaDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "PersonaDatabaseError";
    this.details = details;
  }
}

export async function createPersona(
  client: SupabaseClient,
  data: CreatePersonaData,
): Promise<Persona> {
  const row = normalizeCreatePersonaData(data);
  const result = await client.from("personas").insert(row).select(PERSONA_COLUMNS).single();
  const inserted: unknown = result.data;

  if (result.error) {
    throw new PersonaDatabaseError("Failed to create persona.", result.error);
  }

  return normalizePersona(inserted);
}

export async function getPersonaBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<Persona | null> {
  const normalizedSlug = slug.trim();

  if (!isValidSlug(normalizedSlug)) {
    return null;
  }

  const result = await client
    .from("personas")
    .select(PERSONA_COLUMNS)
    .eq("slug", normalizedSlug)
    .maybeSingle();
  const persona: unknown = result.data;

  if (result.error) {
    throw new PersonaDatabaseError("Failed to fetch persona by slug.", result.error);
  }

  return persona === null ? null : normalizePersona(persona);
}

export async function getPersonasByOwner(
  client: SupabaseClient,
  owner_user_id: string,
): Promise<Persona[]> {
  const ownerUserId = owner_user_id.trim();

  if (!ownerUserId) {
    throw new Error("Persona owner_user_id must be non-empty.");
  }

  const result = await client
    .from("personas")
    .select(PERSONA_COLUMNS)
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  const personas: unknown = result.data;

  if (result.error) {
    throw new PersonaDatabaseError("Failed to fetch personas by owner.", result.error);
  }

  if (!Array.isArray(personas)) {
    throw new PersonaDatabaseError("Supabase returned invalid persona rows.", personas);
  }

  return personas.map(normalizePersona);
}

function normalizeCreatePersonaData(data: CreatePersonaData) {
  const name = data.name.trim();
  const slug = data.slug.trim();
  const ownerUserId = data.owner_user_id.trim();

  if (!name) {
    throw new Error("Persona name must be non-empty.");
  }

  if (!isValidSlug(slug)) {
    throw new Error("Persona slug must be lowercase letters, numbers, and hyphens.");
  }

  if (!ownerUserId) {
    throw new Error("Persona owner_user_id must be non-empty.");
  }

  return {
    name,
    slug,
    owner_user_id: ownerUserId,
    birth_year: data.birth_year ?? null,
    birth_place: normalizeOptionalText(data.birth_place),
    locations_lived: normalizeLocations(data.locations_lived),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeLocations(locations: string[] | null | undefined): string[] | null {
  if (!locations) {
    return null;
  }

  const normalized = locations.map((location) => location.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

function normalizePersona(value: unknown): Persona {
  if (!isPersona(value)) {
    throw new PersonaDatabaseError("Supabase returned an invalid persona row.", value);
  }

  return value;
}

function isPersona(value: unknown): value is Persona {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.owner_user_id === "string" &&
    (typeof value.birth_year === "number" || value.birth_year === null) &&
    (typeof value.birth_place === "string" || value.birth_place === null) &&
    (isStringArray(value.locations_lived) || value.locations_lived === null) &&
    (typeof value.lora_adapter_key === "string" || value.lora_adapter_key === null) &&
    (typeof value.voice_sample_key === "string" || value.voice_sample_key === null) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && SLUG_PATTERN.test(slug);
}
