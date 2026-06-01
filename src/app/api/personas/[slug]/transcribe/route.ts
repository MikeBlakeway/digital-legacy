import { NextResponse, type NextRequest } from "next/server";

import { transcribeAudio } from "@/lib/ai/stt";
import { readObjectAsBase64 } from "@/lib/b2/client";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type TranscribeRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type TranscribeRequest = {
  voice_b2_key: string;
};

export async function POST(
  request: NextRequest,
  context: TranscribeRouteContext,
) {
  const persona = await getOwnedPersona(context);

  if ("response" in persona) {
    return persona.response;
  }

  const parsed = await parseRequest(request, persona);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  try {
    const audioBase64 = await readObjectAsBase64({ key: parsed.voice_b2_key });
    const transcript = await transcribeAudio({
      audio_base64: audioBase64,
      language: "en",
    });

    return NextResponse.json(transcript);
  } catch (error) {
    console.error("Interview transcription failed.", error);
    return NextResponse.json({ error: "transcription_failed" }, { status: 502 });
  }
}

async function getOwnedPersona(
  context: TranscribeRouteContext,
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

async function parseRequest(
  request: NextRequest,
  persona: Persona,
): Promise<TranscribeRequest | { fields: Record<string, string> }> {
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
  const voiceB2Key =
    typeof body.voice_b2_key === "string" ? body.voice_b2_key.trim() : "";

  if (!voiceB2Key) {
    fields.voice_b2_key = "Voice recording key is required.";
  } else if (!voiceB2Key.startsWith(`interview/${persona.id}/`)) {
    fields.voice_b2_key = "Voice recording key is not valid for this persona.";
  }

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return { voice_b2_key: voiceB2Key };
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
