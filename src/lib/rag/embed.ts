import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  EMBEDDING_DIMENSIONS,
  embedText,
  type EmbeddingVector,
} from "@/lib/ai/embed";
import type { RunPodCallOptions } from "@/lib/ai/client";

export type MemorySource = "interview" | "voice_memo" | "free_text" | "media_caption";

export interface MemoryRecord {
  id: string;
  persona_id: string;
  content: string;
  source: MemorySource;
  question_prompt: string | null;
  media_asset_id: string | null;
  is_private: boolean;
  created_at: string;
}

export interface UpsertMemoryEmbeddingParams {
  supabase: SupabaseClient;
  personaId: string;
  content: string;
  source: MemorySource;
  id?: string;
  questionPrompt?: string | null;
  mediaAssetId?: string | null;
  isPrivate?: boolean;
  embedding?: EmbeddingVector;
  runPod?: RunPodCallOptions;
}

export class RagDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "RagDatabaseError";
    this.details = details;
  }
}

export async function embedMemoryContent(
  content: string,
  options: RunPodCallOptions = {},
): Promise<EmbeddingVector> {
  const normalizedContent = validateMemoryContent(content);
  return embedText(normalizedContent, options);
}

export async function upsertMemoryEmbedding(
  params: UpsertMemoryEmbeddingParams,
): Promise<MemoryRecord> {
  const content = validateMemoryContent(params.content);
  const embedding =
    params.embedding ?? (await embedMemoryContent(content, params.runPod));
  validateEmbedding(embedding);

  const row = {
    ...(params.id ? { id: params.id } : {}),
    persona_id: params.personaId,
    content,
    source: params.source,
    question_prompt: params.questionPrompt ?? null,
    embedding,
    media_asset_id: params.mediaAssetId ?? null,
    is_private: params.isPrivate ?? false,
  };

  const { data, error } = await params.supabase
    .from("memories")
    .upsert(row)
    .select(
      "id, persona_id, content, source, question_prompt, media_asset_id, is_private, created_at",
    )
    .single();

  if (error) {
    throw new RagDatabaseError("Failed to upsert embedded memory.", error);
  }

  return normalizeMemoryRecord(data);
}

export function validateEmbedding(embedding: EmbeddingVector): void {
  if (
    !Array.isArray(embedding) ||
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((component) => typeof component !== "number")
  ) {
    throw new Error(`Memory embeddings must contain ${EMBEDDING_DIMENSIONS} numbers.`);
  }
}

function validateMemoryContent(content: string): string {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error("Memory content must be non-empty.");
  }

  return normalizedContent;
}

function normalizeMemoryRecord(value: unknown): MemoryRecord {
  if (!isMemoryRecord(value)) {
    throw new RagDatabaseError("Supabase returned an invalid memory record.", value);
  }

  return value;
}

function isMemoryRecord(value: unknown): value is MemoryRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.persona_id === "string" &&
    typeof record.content === "string" &&
    isMemorySource(record.source) &&
    (typeof record.question_prompt === "string" || record.question_prompt === null) &&
    (typeof record.media_asset_id === "string" || record.media_asset_id === null) &&
    typeof record.is_private === "boolean" &&
    typeof record.created_at === "string"
  );
}

function isMemorySource(value: unknown): value is MemorySource {
  return (
    value === "interview" ||
    value === "voice_memo" ||
    value === "free_text" ||
    value === "media_caption"
  );
}
