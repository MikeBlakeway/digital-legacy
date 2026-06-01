import { after, NextResponse, type NextRequest } from "next/server";

import { readObjectAsBase64 } from "@/lib/b2/client";
import { isEmotionLabel, type EmotionLabel } from "@/lib/capture/emotions";
import { transcribeAudio } from "@/lib/ai/stt";
import { upsertMemoryEmbedding } from "@/lib/rag/embed";
import {
  createDiaryEntry,
  getDiaryStats,
  insertEmotionalVoiceSample,
  listDiaryEntries,
  updateDiaryTranscript,
  type EmotionUpdate,
} from "@/lib/supabase/diary";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type DiaryRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type CreateDiaryRequest = {
  content?: string;
  voice_b2_key?: string;
  duration_seconds?: number;
  emotion_label: EmotionLabel;
  emotion_updates?: EmotionUpdate[];
};

export async function GET(request: NextRequest, context: DiaryRouteContext) {
  const persona = await getOwnedPersona(context);

  if ("response" in persona) {
    return persona.response;
  }

  const url = new URL(request.url);
  const page = readPositiveInteger(url.searchParams.get("page"), 1);
  const perPage = readPositiveInteger(url.searchParams.get("per_page"), 20);
  const serviceClient = createServiceRoleClient();

  const [entries, stats] = await Promise.all([
    listDiaryEntries(serviceClient, {
      personaId: persona.id,
      page,
      perPage,
    }),
    getDiaryStats(serviceClient, persona.id),
  ]);

  return NextResponse.json({
    entries,
    stats,
    pagination: {
      page,
      per_page: perPage,
    },
  });
}

export async function POST(request: NextRequest, context: DiaryRouteContext) {
  const persona = await getOwnedPersona(context);

  if ("response" in persona) {
    return persona.response;
  }

  const parsed = await parseCreateRequest(request, persona);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  const serviceClient = createServiceRoleClient();
  const entry = await createDiaryEntry(serviceClient, {
    personaId: persona.id,
    content: parsed.content ?? null,
    voiceB2Key: parsed.voice_b2_key ?? null,
    emotionLabel: parsed.emotion_label,
    emotionUpdates: parsed.emotion_updates ?? null,
  });

  if (parsed.voice_b2_key && parsed.duration_seconds !== undefined) {
    await insertEmotionalVoiceSample(serviceClient, {
      personaId: persona.id,
      emotionLabel: parsed.emotion_label,
      b2Key: parsed.voice_b2_key,
      durationSeconds: parsed.duration_seconds,
    });
  }

  after(async () => {
    await runBackgroundProcessing({
      personaId: persona.id,
      entryId: entry.id,
      content: parsed.content ?? null,
      voiceB2Key: parsed.voice_b2_key ?? null,
    });
  });

  return NextResponse.json(entry, { status: 201 });
}

async function getOwnedPersona(
  context: DiaryRouteContext,
): Promise<Persona | { response: NextResponse }> {
  const { slug } = await context.params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return persona;
}

async function parseCreateRequest(
  request: NextRequest,
  persona: Persona,
): Promise<CreateDiaryRequest | { fields: Record<string, string> }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { fields: { body: "Request body must be valid JSON." } };
  }

  if (!isRecord(body)) {
    return { fields: { body: "Request body must be an object." } };
  }

  const fields: Record<string, string> = {};
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const voiceB2Key =
    typeof body.voice_b2_key === "string" ? body.voice_b2_key.trim() : "";
  const durationSeconds = body.duration_seconds;
  const emotionLabel = body.emotion_label;
  const emotionUpdates = parseEmotionUpdates(body.emotion_updates);

  if (!content && !voiceB2Key) {
    fields.content = "Content or a voice recording is required.";
  }

  if (!isEmotionLabel(emotionLabel)) {
    fields.emotion_label = "Emotion label is required.";
  }

  if (voiceB2Key && !voiceB2Key.startsWith(`diary/${persona.id}/`)) {
    fields.voice_b2_key = "Voice recording key is not valid for this persona.";
  }

  if (voiceB2Key) {
    if (typeof durationSeconds !== "number" || durationSeconds <= 0) {
      fields.duration_seconds = "Duration is required for voice recordings.";
    }
  }

  if (
    body.emotion_updates !== undefined &&
    body.emotion_updates !== null &&
    emotionUpdates === undefined
  ) {
    fields.emotion_updates = "Emotion updates must include timestamps and labels.";
  }

  if (Object.keys(fields).length > 0 || !isEmotionLabel(emotionLabel)) {
    return { fields };
  }

  return {
    ...(content ? { content } : {}),
    ...(voiceB2Key ? { voice_b2_key: voiceB2Key } : {}),
    ...(typeof durationSeconds === "number"
      ? { duration_seconds: durationSeconds }
      : {}),
    emotion_label: emotionLabel,
    ...(emotionUpdates ? { emotion_updates: emotionUpdates } : {}),
  };
}

async function runBackgroundProcessing({
  personaId,
  entryId,
  content,
  voiceB2Key,
}: {
  personaId: string;
  entryId: string;
  content: string | null;
  voiceB2Key: string | null;
}) {
  const serviceClient = createServiceRoleClient();
  const textContent = content?.trim();

  if (textContent) {
    await safelyEmbedMemory({
      personaId,
      content: textContent,
      serviceClient,
    });
  }

  if (!voiceB2Key) {
    return;
  }

  try {
    const audioBase64 = await readObjectAsBase64({ key: voiceB2Key });
    const transcription = await transcribeAudio({
      audio_base64: audioBase64,
      language: "en",
    });
    const updatedEntry = await updateDiaryTranscript(serviceClient, {
      entryId,
      transcript: transcription.transcript,
    });

    if (!textContent && updatedEntry.transcript) {
      await safelyEmbedMemory({
        personaId,
        content: updatedEntry.transcript,
        serviceClient,
      });
    }
  } catch (error) {
    console.error("Diary background transcription failed.", error);
  }
}

async function safelyEmbedMemory({
  personaId,
  content,
  serviceClient,
}: {
  personaId: string;
  content: string;
  serviceClient: ReturnType<typeof createServiceRoleClient>;
}) {
  try {
    await upsertMemoryEmbedding({
      supabase: serviceClient,
      personaId,
      content,
      source: "diary",
    });
  } catch (error) {
    console.error("Diary background embedding failed.", error);
  }
}

function parseEmotionUpdates(value: unknown): EmotionUpdate[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const updates: EmotionUpdate[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.timestamp_seconds !== "number" ||
      item.timestamp_seconds < 0 ||
      !isEmotionLabel(item.emotion_label)
    ) {
      return undefined;
    }

    updates.push({
      timestamp_seconds: item.timestamp_seconds,
      emotion_label: item.emotion_label,
    });
  }

  return updates;
}

function readPositiveInteger(rawValue: string | null, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readUserId(claims: unknown): string | null {
  if (!isRecord(claims) || typeof claims.sub !== "string") {
    return null;
  }

  return claims.sub;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
