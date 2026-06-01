import { after, NextResponse, type NextRequest } from "next/server";

import { inferPersona } from "@/lib/ai/infer";
import { isEmotionLabel, type EmotionLabel } from "@/lib/capture/emotions";
import {
  buildInterviewSystemPrompt,
  toInferMessages,
} from "@/lib/interview-agent";
import { upsertMemoryEmbedding } from "@/lib/rag/embed";
import {
  appendInterviewMessages,
  createInterviewMessage,
  findLastAgentQuestion,
  getInterviewSession,
  type InterviewSession,
} from "@/lib/supabase/interviews";
import { insertEmotionalVoiceSample } from "@/lib/supabase/diary";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type InterviewSessionRouteContext = {
  params: Promise<{
    slug: string;
    sessionId: string;
  }>;
};

type SubmitTurnRequest = {
  content: string;
  emotion_label?: EmotionLabel;
  voice_b2_key?: string;
  duration_seconds?: number;
};

export async function GET(
  _request: NextRequest,
  context: InterviewSessionRouteContext,
) {
  const resolved = await getOwnedPersonaAndSession(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  return NextResponse.json(resolved.session);
}

export async function POST(
  request: NextRequest,
  context: InterviewSessionRouteContext,
) {
  const resolved = await getOwnedPersonaAndSession(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  if (resolved.session.completed_at) {
    return NextResponse.json(
      {
        error: "invalid_request",
        fields: { session: "Interview session is already complete." },
      },
      { status: 400 },
    );
  }

  const parsed = await parseSubmitRequest(request, resolved.persona);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  const serviceClient = createServiceRoleClient();
  const questionPrompt = findLastAgentQuestion(resolved.session.messages);
  const subjectMessage = createInterviewMessage({
    role: "subject",
    content: parsed.content,
    emotionLabel: parsed.emotion_label ?? null,
    voiceB2Key: parsed.voice_b2_key ?? null,
  });
  const nextTurnCount = resolved.session.turn_count + 1;
  const completedAt =
    nextTurnCount >= 10 ? new Date().toISOString() : resolved.session.completed_at;
  const messagesWithSubject = [...resolved.session.messages, subjectMessage];
  let updatedSession = await appendInterviewMessages(serviceClient, {
    sessionId: resolved.session.id,
    messages: messagesWithSubject,
    turnCount: nextTurnCount,
    completedAt,
  });

  if (parsed.voice_b2_key && parsed.emotion_label && parsed.duration_seconds) {
    await insertEmotionalVoiceSample(serviceClient, {
      personaId: resolved.persona.id,
      emotionLabel: parsed.emotion_label,
      b2Key: parsed.voice_b2_key,
      durationSeconds: parsed.duration_seconds,
    });
  }

  after(async () => {
    await safelyEmbedInterviewTurn({
      personaId: resolved.persona.id,
      content: parsed.content,
      questionPrompt,
    });
  });

  if (completedAt) {
    return NextResponse.json({
      session: updatedSession,
      completed: true,
    });
  }

  let agentResponse: string;

  try {
    const output = await inferPersona({
      system_prompt: buildInterviewSystemPrompt(resolved.session.theme, "follow_up"),
      messages: toInferMessages(messagesWithSubject),
      max_tokens: 220,
      temperature: 0.7,
    });
    agentResponse = output.text.trim();
  } catch (error) {
    console.error("Interview follow-up failed.", error);
    return NextResponse.json({ error: "agent_failed" }, { status: 502 });
  }

  if (!agentResponse) {
    return NextResponse.json({ error: "agent_failed" }, { status: 502 });
  }

  updatedSession = await appendInterviewMessages(serviceClient, {
    sessionId: resolved.session.id,
    messages: [
      ...messagesWithSubject,
      createInterviewMessage({
        role: "agent",
        content: agentResponse,
      }),
    ],
    turnCount: nextTurnCount,
    completedAt: null,
  });

  return NextResponse.json({
    session: updatedSession,
    completed: false,
  });
}

async function getOwnedPersonaAndSession(
  context: InterviewSessionRouteContext,
): Promise<
  | {
      persona: Persona;
      session: InterviewSession;
    }
  | { response: NextResponse }
> {
  const { slug, sessionId } = await context.params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const serviceClient = createServiceRoleClient();
  const persona = await getPersonaBySlug(serviceClient, slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  const session = await getInterviewSession(serviceClient, {
    personaId: persona.id,
    sessionId,
  });

  if (!session) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return {
    persona,
    session,
  };
}

async function parseSubmitRequest(
  request: NextRequest,
  persona: Persona,
): Promise<SubmitTurnRequest | { fields: Record<string, string> }> {
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
  const emotionLabel = body.emotion_label;
  const durationSeconds = body.duration_seconds;

  if (!content) {
    fields.content = "Response content is required.";
  }

  if (emotionLabel !== undefined && !isEmotionLabel(emotionLabel)) {
    fields.emotion_label = "Emotion label is not valid.";
  }

  if (voiceB2Key && !voiceB2Key.startsWith(`interview/${persona.id}/`)) {
    fields.voice_b2_key = "Voice recording key is not valid for this persona.";
  }

  if (
    durationSeconds !== undefined &&
    (typeof durationSeconds !== "number" || durationSeconds <= 0)
  ) {
    fields.duration_seconds = "Duration must be a positive number.";
  }

  if (
    voiceB2Key &&
    isEmotionLabel(emotionLabel) &&
    typeof durationSeconds !== "number"
  ) {
    fields.duration_seconds =
      "Duration is required for tagged voice recordings.";
  }

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return {
    content,
    ...(isEmotionLabel(emotionLabel) ? { emotion_label: emotionLabel } : {}),
    ...(voiceB2Key ? { voice_b2_key: voiceB2Key } : {}),
    ...(typeof durationSeconds === "number"
      ? { duration_seconds: durationSeconds }
      : {}),
  };
}

async function safelyEmbedInterviewTurn({
  personaId,
  content,
  questionPrompt,
}: {
  personaId: string;
  content: string;
  questionPrompt: string | null;
}) {
  try {
    await upsertMemoryEmbedding({
      supabase: createServiceRoleClient(),
      personaId,
      content,
      source: "interview",
      questionPrompt,
    });
  } catch (error) {
    console.error("Interview background embedding failed.", error);
  }
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
