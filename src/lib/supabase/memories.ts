import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isMemorySource,
  type MemorySource,
  type MemorySourceFilter,
} from "@/lib/memory-sources";

export type { MemorySource, MemorySourceFilter };

export const MEMORY_COLUMNS =
  "id, persona_id, content, source, question_prompt, media_asset_id, is_private, created_at";

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

export type Memory = {
  id: string;
  persona_id: string;
  content: string;
  source: MemorySource;
  question_prompt: string | null;
  media_asset_id: string | null;
  is_private: boolean;
  created_at: string;
};

export type MemoryListResult = {
  memories: Memory[];
  total: number;
  page: number;
  per_page: number;
};

export type ListMemoriesParams = {
  personaId: string;
  q?: string | null;
  source?: MemorySourceFilter | null;
  page?: number;
  perPage?: number;
};

export type UpdateMemoryPrivacyParams = {
  personaId: string;
  memoryId: string;
  isPrivate: boolean;
};

export type DeleteMemoryParams = {
  personaId: string;
  memoryId: string;
};

export class MemoryDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "MemoryDatabaseError";
    this.details = details;
  }
}

export async function listMemories(
  client: SupabaseClient,
  params: ListMemoriesParams,
): Promise<MemoryListResult> {
  const page = normalizePage(params.page);
  const perPage = normalizePerPage(params.perPage);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const searchQuery = normalizeOptionalText(params.q);

  let query = client
    .from("memories")
    .select(MEMORY_COLUMNS, { count: "exact" })
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"));

  if (searchQuery) {
    query = query.ilike("content", `%${searchQuery}%`);
  }

  if (params.source) {
    query = query.eq("source", params.source);
  }

  const result = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  const rows: unknown = result.data;

  if (result.error) {
    throw new MemoryDatabaseError("Failed to list memories.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new MemoryDatabaseError("Supabase returned invalid memories.", rows);
  }

  return {
    memories: rows.map(normalizeMemory),
    total: result.count ?? 0,
    page,
    per_page: perPage,
  };
}

export async function updateMemoryPrivacy(
  client: SupabaseClient,
  params: UpdateMemoryPrivacyParams,
): Promise<Memory> {
  const result = await client
    .from("memories")
    .update({ is_private: params.isPrivate })
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"))
    .eq("id", normalizeRequiredText(params.memoryId, "memoryId"))
    .select(MEMORY_COLUMNS)
    .single();
  const row: unknown = result.data;

  if (result.error) {
    throw new MemoryDatabaseError("Failed to update memory privacy.", result.error);
  }

  return normalizeMemory(row);
}

export async function deleteMemory(
  client: SupabaseClient,
  params: DeleteMemoryParams,
): Promise<boolean> {
  const result = await client
    .from("memories")
    .delete()
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"))
    .eq("id", normalizeRequiredText(params.memoryId, "memoryId"))
    .select("id")
    .maybeSingle();
  const row: unknown = result.data;

  if (result.error) {
    throw new MemoryDatabaseError("Failed to delete memory.", result.error);
  }

  if (row === null) {
    return false;
  }

  if (!isRecord(row) || typeof row.id !== "string") {
    throw new MemoryDatabaseError("Supabase returned invalid delete result.", row);
  }

  return true;
}

function normalizeMemory(value: unknown): Memory {
  if (!isMemory(value)) {
    throw new MemoryDatabaseError("Supabase returned an invalid memory.", value);
  }

  return value;
}

function isMemory(value: unknown): value is Memory {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    typeof value.content === "string" &&
    isMemorySource(value.source) &&
    (typeof value.question_prompt === "string" || value.question_prompt === null) &&
    (typeof value.media_asset_id === "string" || value.media_asset_id === null) &&
    typeof value.is_private === "boolean" &&
    typeof value.created_at === "string"
  );
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeRequiredText(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${name} must be non-empty.`);
  }

  return normalized;
}

function normalizePage(page?: number): number {
  const normalized = page ?? 1;

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error("Memory page must be a positive integer.");
  }

  return normalized;
}

function normalizePerPage(perPage?: number): number {
  const normalized = perPage ?? DEFAULT_PER_PAGE;

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error("Memory perPage must be a positive integer.");
  }

  return Math.min(normalized, MAX_PER_PAGE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
