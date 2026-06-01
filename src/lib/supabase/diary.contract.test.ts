import type { SupabaseClient } from "@supabase/supabase-js";

import {
  EMOTION_LABELS,
  countWords,
  createDiaryEntry,
  createDiaryPreview,
  getDiaryStats,
  insertEmotionalVoiceSample,
  isEmotionLabel,
  listDiaryEntries,
  updateDiaryTranscript,
  type DiaryEntry,
  type DiaryEntryListItem,
  type DiaryStats,
  type EmotionLabel,
  type EmotionUpdate,
  type EmotionalVoiceSample,
} from "@/lib/supabase/diary";

async function assertDiaryContracts(supabase: SupabaseClient) {
  const emotion: EmotionLabel = "reflective";
  const emotionUpdate: EmotionUpdate = {
    timestamp_seconds: 12.5,
    emotion_label: "tender",
  };

  if (!isEmotionLabel(emotion) || EMOTION_LABELS.length !== 8) {
    throw new Error("Emotion label contract changed unexpectedly.");
  }

  const entry: DiaryEntry = await createDiaryEntry(supabase, {
    personaId: "00000000-0000-0000-0000-000000000000",
    content: "A quiet memory from this morning.",
    voiceB2Key: null,
    emotionLabel: emotion,
    emotionUpdates: [emotionUpdate],
  });

  const updated: DiaryEntry = await updateDiaryTranscript(supabase, {
    entryId: entry.id,
    transcript: "A transcribed voice note.",
  });

  const sample: EmotionalVoiceSample = await insertEmotionalVoiceSample(supabase, {
    personaId: entry.persona_id,
    emotionLabel: "warm",
    b2Key: "diary/00000000-0000-0000-0000-000000000000/sample.webm",
    durationSeconds: 42,
  });

  const entries: DiaryEntryListItem[] = await listDiaryEntries(supabase, {
    personaId: entry.persona_id,
    page: 1,
    perPage: 10,
  });

  const stats: DiaryStats = await getDiaryStats(supabase, entry.persona_id);
  const words: number = countWords("one two three");
  const preview: string = createDiaryPreview("a".repeat(250));

  return {
    updated,
    sample,
    entries,
    stats,
    words,
    preview,
  };
}

void assertDiaryContracts({} as SupabaseClient);
