import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
} from "@/lib/b2/client";
import { embedTexts } from "@/lib/ai/embed";
import { inferText, type InferMessage } from "@/lib/ai/infer";
import { transcribeAudio } from "@/lib/ai/stt";
import { synthesizeSpeech } from "@/lib/ai/tts";
import {
  retrieveMemoriesByEmbedding,
  retrieveMemoriesForText,
} from "@/lib/rag/retrieve";
import { upsertMemoryEmbedding } from "@/lib/rag/embed";

async function assertCoreModuleContracts(supabase: SupabaseClient) {
  const uploadUrl: string = await createPresignedUploadUrl({
    key: "voice-samples/persona/sample.wav",
    contentType: "audio/wav",
  });
  const downloadUrl: string = await createPresignedDownloadUrl({
    key: "voice-samples/persona/sample.wav",
  });

  const messages: InferMessage[] = [{ role: "user", content: "Hello" }];
  const inferResult = await inferText({
    system_prompt: "You are Mike.",
    messages,
    max_tokens: 128,
    temperature: 0.7,
  });

  const ttsResult = await synthesizeSpeech({
    text: inferResult.text,
    speaker_wav_b2_key: "voice-samples/persona/reference.wav",
    language: "en",
  });

  const sttResult = await transcribeAudio({
    audio_base64: ttsResult.audio_base64,
    language: "en",
  });

  const embeddings: number[][] = await embedTexts([sttResult.transcript]);

  const memory = await upsertMemoryEmbedding({
    supabase,
    personaId: "00000000-0000-0000-0000-000000000000",
    content: "I used to walk along the river on Sundays.",
    source: "free_text",
  });

  const retrievedByVector = await retrieveMemoriesByEmbedding({
    supabase,
    personaId: memory.persona_id,
    embedding: embeddings[0],
    limit: 8,
  });

  const retrievedByText = await retrieveMemoriesForText({
    supabase,
    personaId: memory.persona_id,
    text: "Tell me about Sunday walks.",
  });

  return {
    uploadUrl,
    downloadUrl,
    inferResult,
    ttsResult,
    sttResult,
    embeddings,
    retrievedByVector,
    retrievedByText,
  };
}

void assertCoreModuleContracts({} as SupabaseClient);
