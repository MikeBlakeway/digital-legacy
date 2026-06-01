import type { SupabaseClient } from "@supabase/supabase-js";

import type { EmotionLabel } from "@/lib/capture/emotions";
import type { InterviewThemeId } from "@/lib/interview-themes";
import {
  appendInterviewMessages,
  createInterviewSession,
  getInterviewSession,
  getInterviewSessionCounts,
  listInterviewSessions,
  type CreateInterviewSessionData,
  type InterviewMessage,
  type InterviewSession,
  type InterviewSessionListItem,
  type InterviewSessionThemeCounts,
} from "@/lib/supabase/interviews";

async function assertInterviewContracts(supabase: SupabaseClient) {
  const emotion: EmotionLabel = "reflective";
  const theme: InterviewThemeId = "values";
  const agentMessage: InterviewMessage = {
    role: "agent",
    content: "Tell me about a principle that has guided you.",
    emotion_label: null,
    created_at: new Date().toISOString(),
  };
  const subjectMessage: InterviewMessage = {
    role: "subject",
    content: "I learned to keep showing up.",
    emotion_label: emotion,
    voice_b2_key: "interview/00000000-0000-0000-0000-000000000000/sample.webm",
    created_at: new Date().toISOString(),
  };
  const createData: CreateInterviewSessionData = {
    personaId: "00000000-0000-0000-0000-000000000000",
    theme,
    openingMessage: agentMessage,
  };

  const session: InterviewSession = await createInterviewSession(
    supabase,
    createData,
  );
  const updated: InterviewSession = await appendInterviewMessages(supabase, {
    sessionId: session.id,
    messages: [subjectMessage],
    turnCount: 1,
    completedAt: null,
  });
  const fetched: InterviewSession | null = await getInterviewSession(supabase, {
    personaId: session.persona_id,
    sessionId: session.id,
  });
  const sessions: InterviewSessionListItem[] = await listInterviewSessions(
    supabase,
    session.persona_id,
  );
  const counts: InterviewSessionThemeCounts = await getInterviewSessionCounts(
    supabase,
    session.persona_id,
  );

  return {
    updated,
    fetched,
    sessions,
    counts,
  };
}

void assertInterviewContracts({} as SupabaseClient);
