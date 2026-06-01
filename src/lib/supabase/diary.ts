import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  EMOTION_LABELS,
  createEmptyEmotionCounts,
  isEmotionLabel,
  type EmotionCounts,
  type EmotionLabel,
} from "@/lib/capture/emotions";

export { EMOTION_LABELS, isEmotionLabel, type EmotionLabel };

const DIARY_ENTRY_COLUMNS =
  "id, persona_id, content, voice_b2_key, transcript, emotion_label, emotion_updates, word_count, processed_at, created_at";
const DIARY_LIST_COLUMNS =
  "id, persona_id, content, voice_b2_key, transcript, emotion_label, word_count, created_at";
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

export type EmotionUpdate = {
  timestamp_seconds: number;
  emotion_label: EmotionLabel;
};

export type DiaryEntry = {
  id: string;
  persona_id: string;
  content: string | null;
  voice_b2_key: string | null;
  transcript: string | null;
  emotion_label: EmotionLabel;
  emotion_updates: EmotionUpdate[] | null;
  word_count: number | null;
  processed_at: string | null;
  created_at: string;
};

export type DiaryEntryListItem = {
  id: string;
  persona_id: string;
  preview: string;
  word_count: number | null;
  emotion_label: EmotionLabel;
  created_at: string;
  has_voice: boolean;
};

export type DiaryStats = {
  total_entries: number;
  total_word_count: number;
  emotion_counts: EmotionCounts;
};

export type EmotionalVoiceSample = {
  id: string;
  persona_id: string;
  emotion_label: EmotionLabel;
  b2_key: string;
  duration_seconds: number;
  quality_score: number | null;
  created_at: string;
};

export type CreateDiaryEntryData = {
  personaId: string;
  content?: string | null;
  voiceB2Key?: string | null;
  emotionLabel: EmotionLabel;
  emotionUpdates?: EmotionUpdate[] | null;
};

export type UpdateDiaryTranscriptData = {
  entryId: string;
  transcript: string;
};

export type ListDiaryEntriesParams = {
  personaId: string;
  page?: number;
  perPage?: number;
};

export type InsertEmotionalVoiceSampleData = {
  personaId: string;
  emotionLabel: EmotionLabel;
  b2Key: string;
  durationSeconds: number;
  qualityScore?: number | null;
};

export class DiaryDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "DiaryDatabaseError";
    this.details = details;
  }
}

export async function createDiaryEntry(
  client: SupabaseClient,
  data: CreateDiaryEntryData,
): Promise<DiaryEntry> {
  const content = normalizeOptionalText(data.content);
  const voiceB2Key = normalizeOptionalText(data.voiceB2Key);

  if (!content && !voiceB2Key) {
    throw new Error("Diary entry requires content or a voice recording.");
  }

  const result = await client
    .from("diary_entries")
    .insert({
      persona_id: normalizeRequiredText(data.personaId, "personaId"),
      content,
      voice_b2_key: voiceB2Key,
      transcript: null,
      emotion_label: data.emotionLabel,
      emotion_updates: normalizeEmotionUpdates(data.emotionUpdates),
      word_count: content ? countWords(content) : null,
      processed_at: null,
    })
    .select(DIARY_ENTRY_COLUMNS)
    .single();
  const entry: unknown = result.data;

  if (result.error) {
    throw new DiaryDatabaseError("Failed to create diary entry.", result.error);
  }

  return normalizeDiaryEntry(entry);
}

export async function updateDiaryTranscript(
  client: SupabaseClient,
  data: UpdateDiaryTranscriptData,
): Promise<DiaryEntry> {
  const transcript = normalizeRequiredText(data.transcript, "transcript");

  const result = await client
    .from("diary_entries")
    .update({
      transcript,
      word_count: countWords(transcript),
    })
    .eq("id", normalizeRequiredText(data.entryId, "entryId"))
    .select(DIARY_ENTRY_COLUMNS)
    .single();
  const entry: unknown = result.data;

  if (result.error) {
    throw new DiaryDatabaseError("Failed to update diary transcript.", result.error);
  }

  return normalizeDiaryEntry(entry);
}

export async function listDiaryEntries(
  client: SupabaseClient,
  params: ListDiaryEntriesParams,
): Promise<DiaryEntryListItem[]> {
  const page = normalizePage(params.page);
  const perPage = normalizePerPage(params.perPage);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const result = await client
    .from("diary_entries")
    .select(DIARY_LIST_COLUMNS)
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"))
    .order("created_at", { ascending: false })
    .range(from, to);
  const rows: unknown = result.data;

  if (result.error) {
    throw new DiaryDatabaseError("Failed to list diary entries.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new DiaryDatabaseError("Supabase returned invalid diary entries.", rows);
  }

  return rows.map(normalizeDiaryEntryListItem);
}

export async function getDiaryStats(
  client: SupabaseClient,
  personaId: string,
): Promise<DiaryStats> {
  const result = await client
    .from("diary_entries")
    .select("word_count, emotion_label")
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"));
  const rows: unknown = result.data;

  if (result.error) {
    throw new DiaryDatabaseError("Failed to load diary stats.", result.error);
  }

  if (!Array.isArray(rows)) {
    throw new DiaryDatabaseError("Supabase returned invalid diary stats.", rows);
  }

  const emotionCounts = createEmptyEmotionCounts();
  let totalWordCount = 0;

  for (const row of rows) {
    if (!isRecord(row)) {
      throw new DiaryDatabaseError("Supabase returned invalid diary stats.", rows);
    }

    if (typeof row.word_count === "number") {
      totalWordCount += row.word_count;
    }

    if (isEmotionLabel(row.emotion_label)) {
      emotionCounts[row.emotion_label] += 1;
    }
  }

  return {
    total_entries: rows.length,
    total_word_count: totalWordCount,
    emotion_counts: emotionCounts,
  };
}

export async function insertEmotionalVoiceSample(
  client: SupabaseClient,
  data: InsertEmotionalVoiceSampleData,
): Promise<EmotionalVoiceSample> {
  const result = await client
    .from("emotional_voice_samples")
    .insert({
      persona_id: normalizeRequiredText(data.personaId, "personaId"),
      emotion_label: data.emotionLabel,
      b2_key: normalizeRequiredText(data.b2Key, "b2Key"),
      duration_seconds: data.durationSeconds,
      quality_score: data.qualityScore ?? null,
    })
    .select(
      "id, persona_id, emotion_label, b2_key, duration_seconds, quality_score, created_at",
    )
    .single();
  const sample: unknown = result.data;

  if (result.error) {
    throw new DiaryDatabaseError(
      "Failed to insert emotional voice sample.",
      result.error,
    );
  }

  return normalizeEmotionalVoiceSample(sample);
}

export function countWords(text: string): number {
  const normalized = text.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

export function createDiaryPreview(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Voice entry awaiting transcript.";
  }

  return normalized.length > 200 ? `${normalized.slice(0, 197)}...` : normalized;
}

function normalizeDiaryEntry(value: unknown): DiaryEntry {
  if (!isDiaryEntry(value)) {
    throw new DiaryDatabaseError("Supabase returned an invalid diary entry.", value);
  }

  return value;
}

function normalizeDiaryEntryListItem(value: unknown): DiaryEntryListItem {
  if (!isRecord(value)) {
    throw new DiaryDatabaseError("Supabase returned an invalid diary entry.", value);
  }

  if (
    typeof value.id !== "string" ||
    typeof value.persona_id !== "string" ||
    !isEmotionLabel(value.emotion_label) ||
    (typeof value.word_count !== "number" && value.word_count !== null) ||
    typeof value.created_at !== "string"
  ) {
    throw new DiaryDatabaseError("Supabase returned an invalid diary entry.", value);
  }

  const content = typeof value.content === "string" ? value.content : "";
  const transcript = typeof value.transcript === "string" ? value.transcript : "";

  return {
    id: value.id,
    persona_id: value.persona_id,
    preview: createDiaryPreview(content || transcript),
    word_count: value.word_count,
    emotion_label: value.emotion_label,
    created_at: value.created_at,
    has_voice: typeof value.voice_b2_key === "string",
  };
}

function normalizeEmotionalVoiceSample(value: unknown): EmotionalVoiceSample {
  if (!isEmotionalVoiceSample(value)) {
    throw new DiaryDatabaseError(
      "Supabase returned an invalid emotional voice sample.",
      value,
    );
  }

  return value;
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    (typeof value.content === "string" || value.content === null) &&
    (typeof value.voice_b2_key === "string" || value.voice_b2_key === null) &&
    (typeof value.transcript === "string" || value.transcript === null) &&
    isEmotionLabel(value.emotion_label) &&
    (isEmotionUpdates(value.emotion_updates) || value.emotion_updates === null) &&
    (typeof value.word_count === "number" || value.word_count === null) &&
    (typeof value.processed_at === "string" || value.processed_at === null) &&
    typeof value.created_at === "string"
  );
}

function isEmotionalVoiceSample(value: unknown): value is EmotionalVoiceSample {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    isEmotionLabel(value.emotion_label) &&
    typeof value.b2_key === "string" &&
    typeof value.duration_seconds === "number" &&
    (typeof value.quality_score === "number" || value.quality_score === null) &&
    typeof value.created_at === "string"
  );
}

function isEmotionUpdates(value: unknown): value is EmotionUpdate[] {
  return Array.isArray(value) && value.every(isEmotionUpdate);
}

function isEmotionUpdate(value: unknown): value is EmotionUpdate {
  return (
    isRecord(value) &&
    typeof value.timestamp_seconds === "number" &&
    isEmotionLabel(value.emotion_label)
  );
}

function normalizeEmotionUpdates(
  updates: EmotionUpdate[] | null | undefined,
): EmotionUpdate[] | null {
  if (!updates || updates.length === 0) {
    return null;
  }

  return updates.map((update) => ({
    timestamp_seconds: update.timestamp_seconds,
    emotion_label: update.emotion_label,
  }));
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
    throw new Error("Diary page must be a positive integer.");
  }

  return normalized;
}

function normalizePerPage(perPage?: number): number {
  const normalized = perPage ?? DEFAULT_PER_PAGE;

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error("Diary perPage must be a positive integer.");
  }

  return Math.min(normalized, MAX_PER_PAGE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
