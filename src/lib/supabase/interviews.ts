import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isEmotionLabel, type EmotionLabel } from "@/lib/capture/emotions";
import {
  INTERVIEW_THEMES,
  isInterviewThemeId,
  type InterviewThemeId,
} from "@/lib/interview-themes";

const INTERVIEW_SESSION_COLUMNS =
  "id, persona_id, theme, messages, turn_count, completed_at, created_at";

export type InterviewMessageRole = "agent" | "subject";

export type InterviewMessage = {
  role: InterviewMessageRole;
  content: string;
  emotion_label: EmotionLabel | null;
  voice_b2_key?: string;
  created_at: string;
};

export type InterviewSession = {
  id: string;
  persona_id: string;
  theme: InterviewThemeId;
  messages: InterviewMessage[];
  turn_count: number;
  completed_at: string | null;
  created_at: string;
};

export type InterviewSessionListItem = {
  id: string;
  persona_id: string;
  theme: InterviewThemeId;
  turn_count: number;
  completed_at: string | null;
  created_at: string;
  latest_message_preview: string;
};

export type InterviewTraitSource = {
  id: string;
  subject_turns: string[];
  completed_at: string;
  created_at: string;
};

export type InterviewSessionThemeCounts = Record<InterviewThemeId, number>;

export type CreateInterviewSessionData = {
  personaId: string;
  theme: InterviewThemeId;
  openingMessage: InterviewMessage;
};

export type GetInterviewSessionParams = {
  personaId: string;
  sessionId: string;
};

export type AppendInterviewMessagesData = {
  sessionId: string;
  messages: InterviewMessage[];
  turnCount: number;
  completedAt?: string | null;
};

export class InterviewDatabaseError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "InterviewDatabaseError";
    this.details = details;
  }
}

export function createInterviewMessage({
  role,
  content,
  emotionLabel = null,
  voiceB2Key,
  createdAt = new Date().toISOString(),
}: {
  role: InterviewMessageRole;
  content: string;
  emotionLabel?: EmotionLabel | null;
  voiceB2Key?: string | null;
  createdAt?: string;
}): InterviewMessage {
  const normalizedContent = normalizeRequiredText(content, "content");
  const normalizedVoiceKey = normalizeOptionalText(voiceB2Key);

  return {
    role,
    content: normalizedContent,
    emotion_label: emotionLabel,
    ...(normalizedVoiceKey ? { voice_b2_key: normalizedVoiceKey } : {}),
    created_at: createdAt,
  };
}

export async function createInterviewSession(
  client: SupabaseClient,
  data: CreateInterviewSessionData,
): Promise<InterviewSession> {
  const result = await client
    .from("interview_sessions")
    .insert({
      persona_id: normalizeRequiredText(data.personaId, "personaId"),
      theme: data.theme,
      messages: [normalizeInterviewMessage(data.openingMessage)],
      turn_count: 0,
      completed_at: null,
    })
    .select(INTERVIEW_SESSION_COLUMNS)
    .single();
  const session: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to create interview session.",
      result.error,
    );
  }

  return normalizeInterviewSession(session);
}

export async function appendInterviewMessages(
  client: SupabaseClient,
  data: AppendInterviewMessagesData,
): Promise<InterviewSession> {
  const result = await client
    .from("interview_sessions")
    .update({
      messages: data.messages.map(normalizeInterviewMessage),
      turn_count: data.turnCount,
      completed_at: data.completedAt ?? null,
    })
    .eq("id", normalizeRequiredText(data.sessionId, "sessionId"))
    .select(INTERVIEW_SESSION_COLUMNS)
    .single();
  const session: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to update interview session.",
      result.error,
    );
  }

  return normalizeInterviewSession(session);
}

export async function getInterviewSession(
  client: SupabaseClient,
  params: GetInterviewSessionParams,
): Promise<InterviewSession | null> {
  const result = await client
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("persona_id", normalizeRequiredText(params.personaId, "personaId"))
    .eq("id", normalizeRequiredText(params.sessionId, "sessionId"))
    .maybeSingle();
  const session: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to fetch interview session.",
      result.error,
    );
  }

  return session === null ? null : normalizeInterviewSession(session);
}

export async function listInterviewSessions(
  client: SupabaseClient,
  personaId: string,
): Promise<InterviewSessionListItem[]> {
  const result = await client
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"))
    .order("created_at", { ascending: false });
  const rows: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to list interview sessions.",
      result.error,
    );
  }

  if (!Array.isArray(rows)) {
    throw new InterviewDatabaseError(
      "Supabase returned invalid interview sessions.",
      rows,
    );
  }

  return rows.map((row) => toInterviewSessionListItem(normalizeInterviewSession(row)));
}

export async function getInterviewSessionCounts(
  client: SupabaseClient,
  personaId: string,
): Promise<InterviewSessionThemeCounts> {
  const result = await client
    .from("interview_sessions")
    .select("theme")
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"))
    .not("completed_at", "is", null);
  const rows: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to count interview sessions.",
      result.error,
    );
  }

  if (!Array.isArray(rows)) {
    throw new InterviewDatabaseError(
      "Supabase returned invalid interview session counts.",
      rows,
    );
  }

  const counts = createEmptyInterviewSessionCounts();

  for (const row of rows) {
    if (!isRecord(row) || !isInterviewThemeId(row.theme)) {
      throw new InterviewDatabaseError(
        "Supabase returned invalid interview session counts.",
        rows,
      );
    }

    counts[row.theme] += 1;
  }

  return counts;
}

export async function listCompletedInterviewTraitSources(
  client: SupabaseClient,
  personaId: string,
): Promise<InterviewTraitSource[]> {
  const result = await client
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("persona_id", normalizeRequiredText(personaId, "personaId"))
    .not("completed_at", "is", null)
    .order("created_at", { ascending: true });
  const rows: unknown = result.data;

  if (result.error) {
    throw new InterviewDatabaseError(
      "Failed to load interviews for trait inference.",
      result.error,
    );
  }

  if (!Array.isArray(rows)) {
    throw new InterviewDatabaseError(
      "Supabase returned invalid interview trait sources.",
      rows,
    );
  }

  return rows.map((row) =>
    toInterviewTraitSource(normalizeInterviewSession(row)),
  );
}

export function extractSubjectTurnContents(
  messages: InterviewMessage[],
): string[] {
  return messages.flatMap((message) => {
    const content = message.content.trim();

    return message.role === "subject" && content ? [content] : [];
  });
}

export function createEmptyInterviewSessionCounts(): InterviewSessionThemeCounts {
  return INTERVIEW_THEMES.reduce<InterviewSessionThemeCounts>(
    (counts, theme) => ({
      ...counts,
      [theme.id]: 0,
    }),
    {
      values: 0,
      relationships: 0,
      fears: 0,
      life_stories: 0,
      formative: 0,
    },
  );
}

export function findLastAgentQuestion(
  messages: InterviewMessage[],
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "agent") {
      return message.content;
    }
  }

  return null;
}

function toInterviewSessionListItem(
  session: InterviewSession,
): InterviewSessionListItem {
  const latestMessage = session.messages[session.messages.length - 1];

  return {
    id: session.id,
    persona_id: session.persona_id,
    theme: session.theme,
    turn_count: session.turn_count,
    completed_at: session.completed_at,
    created_at: session.created_at,
    latest_message_preview: createInterviewPreview(latestMessage?.content ?? ""),
  };
}

function toInterviewTraitSource(session: InterviewSession): InterviewTraitSource {
  if (!session.completed_at) {
    throw new InterviewDatabaseError(
      "Supabase returned an incomplete interview for trait inference.",
      session,
    );
  }

  return {
    id: session.id,
    subject_turns: extractSubjectTurnContents(session.messages),
    completed_at: session.completed_at,
    created_at: session.created_at,
  };
}

function createInterviewPreview(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Interview started.";
  }

  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

function normalizeInterviewSession(value: unknown): InterviewSession {
  if (!isInterviewSession(value)) {
    throw new InterviewDatabaseError(
      "Supabase returned an invalid interview session.",
      value,
    );
  }

  return {
    ...value,
    messages: value.messages.map(normalizeInterviewMessage),
  };
}

function normalizeInterviewMessage(value: unknown): InterviewMessage {
  if (!isInterviewMessage(value)) {
    throw new InterviewDatabaseError(
      "Supabase returned an invalid interview message.",
      value,
    );
  }

  return {
    role: value.role,
    content: value.content,
    emotion_label: value.emotion_label,
    ...(value.voice_b2_key ? { voice_b2_key: value.voice_b2_key } : {}),
    created_at: value.created_at,
  };
}

function isInterviewSession(value: unknown): value is InterviewSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.persona_id === "string" &&
    isInterviewThemeId(value.theme) &&
    Array.isArray(value.messages) &&
    value.messages.every(isInterviewMessage) &&
    typeof value.turn_count === "number" &&
    (typeof value.completed_at === "string" || value.completed_at === null) &&
    typeof value.created_at === "string"
  );
}

function isInterviewMessage(value: unknown): value is InterviewMessage {
  return (
    isRecord(value) &&
    (value.role === "agent" || value.role === "subject") &&
    typeof value.content === "string" &&
    (isEmotionLabel(value.emotion_label) || value.emotion_label === null) &&
    (typeof value.voice_b2_key === "string" ||
      value.voice_b2_key === undefined) &&
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
