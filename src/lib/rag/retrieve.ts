import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { embedText, type EmbeddingVector } from "@/lib/ai/embed";
import type { RunPodCallOptions } from "@/lib/ai/client";
import { RagDatabaseError, validateEmbedding } from "@/lib/rag/embed";

const DEFAULT_MEMORY_MATCH_LIMIT = 8;
const MAX_MEMORY_MATCH_LIMIT = 50;

export interface RetrievedMemory {
  id: string;
  content: string;
  media_asset_id: string | null;
  similarity: number;
}

export interface RetrieveMemoriesByEmbeddingParams {
  supabase: SupabaseClient;
  personaId: string;
  embedding: EmbeddingVector;
  limit?: number;
  matchThreshold?: number;
}

export interface RetrieveMemoriesForTextParams {
  supabase: SupabaseClient;
  personaId: string;
  text: string;
  limit?: number;
  matchThreshold?: number;
  runPod?: RunPodCallOptions;
}

export async function retrieveMemoriesForText(
  params: RetrieveMemoriesForTextParams,
): Promise<RetrievedMemory[]> {
  const text = params.text.trim();

  if (!text) {
    throw new Error("Retrieval query text must be non-empty.");
  }

  const embedding = await embedText(text, params.runPod);

  return retrieveMemoriesByEmbedding({
    supabase: params.supabase,
    personaId: params.personaId,
    embedding,
    limit: params.limit,
    matchThreshold: params.matchThreshold,
  });
}

export async function retrieveMemoriesByEmbedding(
  params: RetrieveMemoriesByEmbeddingParams,
): Promise<RetrievedMemory[]> {
  validateEmbedding(params.embedding);

  const { data, error } = await params.supabase.rpc("match_persona_memories", {
    query_embedding: params.embedding,
    match_persona_id: params.personaId,
    match_count: normalizeLimit(params.limit),
    match_threshold: params.matchThreshold ?? 0,
  });

  if (error) {
    throw new RagDatabaseError("Failed to retrieve relevant memories.", error);
  }

  if (!Array.isArray(data) || !data.every(isRetrievedMemory)) {
    throw new RagDatabaseError("Supabase returned invalid memory matches.", data);
  }

  return data;
}

function normalizeLimit(limit?: number): number {
  const normalizedLimit = limit ?? DEFAULT_MEMORY_MATCH_LIMIT;

  if (!Number.isInteger(normalizedLimit) || normalizedLimit <= 0) {
    throw new Error("Memory retrieval limit must be a positive integer.");
  }

  return Math.min(normalizedLimit, MAX_MEMORY_MATCH_LIMIT);
}

function isRetrievedMemory(value: unknown): value is RetrievedMemory {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.content === "string" &&
    (typeof record.media_asset_id === "string" || record.media_asset_id === null) &&
    typeof record.similarity === "number"
  );
}
