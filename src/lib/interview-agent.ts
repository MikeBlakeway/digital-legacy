import "server-only";

import type { InferMessage } from "@/lib/ai/infer";
import { getInterviewTheme, type InterviewThemeId } from "@/lib/interview-themes";
import type { InterviewMessage } from "@/lib/supabase/interviews";

export function buildInterviewSystemPrompt(
  themeId: InterviewThemeId,
  mode: "opening" | "follow_up",
): string {
  const theme = getInterviewTheme(themeId);
  const basePrompt = `You are a thoughtful, skilled interviewer helping someone record their life story and personality
for future generations. Your task is to explore the theme of "${theme.title}" through genuine
conversation.

Rules you must follow:
- Ask one question at a time. Never ask multiple questions in a single turn.
- Follow threads. If the subject says something interesting or emotionally resonant, pursue it
  before moving on.
- Do not validate or affirm excessively. Avoid "That's wonderful" or "Great answer."
- Aim for depth over breadth. One profound exchange is worth more than ten surface answers.
- Keep your questions open-ended and narrative-focused. Prefer "Tell me about a time when..."
  over "Do you believe...?"
- You are not an AI assistant. You are an interviewer. Do not break character.`;

  if (mode === "opening") {
    return `${basePrompt}

Begin by asking your opening question for the theme of "${theme.title}".`;
  }

  return `${basePrompt}

Continue from the conversation history. Ask exactly one contextually relevant follow-up question.`;
}

export function toInferMessages(messages: InterviewMessage[]): InferMessage[] {
  return messages.map((message) => ({
    role: message.role === "agent" ? "assistant" : "user",
    content: message.content,
  }));
}
