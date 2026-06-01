import { NextResponse, type NextRequest } from "next/server";

import { inferPersona } from "@/lib/ai/infer";
import { buildInterviewSystemPrompt } from "@/lib/interview-agent";
import { isInterviewThemeId } from "@/lib/interview-themes";
import {
  createInterviewMessage,
  createInterviewSession,
  getInterviewSessionCounts,
  listInterviewSessions,
} from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type InterviewRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type StartInterviewRequest = {
  theme: Parameters<typeof buildInterviewSystemPrompt>[0];
};

export async function GET(_request: NextRequest, context: InterviewRouteContext) {
  const persona = await getOwnedPersona(context);

  if ("response" in persona) {
    return persona.response;
  }

  const serviceClient = createServiceRoleClient();
  const [sessions, counts] = await Promise.all([
    listInterviewSessions(serviceClient, persona.id),
    getInterviewSessionCounts(serviceClient, persona.id),
  ]);

  return NextResponse.json({
    sessions,
    counts,
  });
}

export async function POST(request: NextRequest, context: InterviewRouteContext) {
  const persona = await getOwnedPersona(context);

  if ("response" in persona) {
    return persona.response;
  }

  const parsed = await parseStartRequest(request);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  let agentResponse: string;

  try {
    const output = await inferPersona({
      system_prompt: buildInterviewSystemPrompt(parsed.theme, "opening"),
      messages: [],
      max_tokens: 220,
      temperature: 0.7,
    });
    agentResponse = output.text.trim();
  } catch (error) {
    console.error("Interview opening question failed.", error);
    return NextResponse.json({ error: "agent_failed" }, { status: 502 });
  }

  if (!agentResponse) {
    return NextResponse.json({ error: "agent_failed" }, { status: 502 });
  }

  const session = await createInterviewSession(createServiceRoleClient(), {
    personaId: persona.id,
    theme: parsed.theme,
    openingMessage: createInterviewMessage({
      role: "agent",
      content: agentResponse,
    }),
  });

  return NextResponse.json(session, { status: 201 });
}

async function getOwnedPersona(
  context: InterviewRouteContext,
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

async function parseStartRequest(
  request: NextRequest,
): Promise<StartInterviewRequest | { fields: Record<string, string> }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { fields: { body: "Request body must be valid JSON." } };
  }

  if (!isRecord(body)) {
    return { fields: { body: "Request body must be an object." } };
  }

  if (!isInterviewThemeId(body.theme)) {
    return { fields: { theme: "Interview theme is required." } };
  }

  return { theme: body.theme };
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
