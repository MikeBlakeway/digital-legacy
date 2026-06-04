import { NextResponse, type NextRequest } from "next/server";

import { listConversationsForPersonaUser } from "@/lib/supabase/conversations";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type ConversationsRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: ConversationsRouteContext,
) {
  const resolved = await getAccessiblePersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const limit = readPositiveInteger(new URL(request.url).searchParams.get("limit"));
  const conversations = await listConversationsForPersonaUser(
    createServiceRoleClient(),
    {
      personaId: resolved.persona.id,
      userId: resolved.userId,
      ...(limit ? { limit } : {}),
    },
  );

  return NextResponse.json({ conversations });
}

async function getAccessiblePersona(
  context: ConversationsRouteContext,
): Promise<{ persona: Persona; userId: string } | { response: NextResponse }> {
  const { slug } = await context.params;
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

  if (!persona) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  if (persona.owner_user_id === userId) {
    return { persona, userId };
  }

  const accessResult = await serviceClient
    .from("persona_access")
    .select("persona_id")
    .eq("persona_id", persona.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (accessResult.error || !accessResult.data) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return { persona, userId };
}

function readPositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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
