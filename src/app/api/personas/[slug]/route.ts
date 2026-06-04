import { NextResponse } from "next/server";

import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type PersonaRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: PersonaRouteContext) {
  const resolved = await getAccessiblePersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  return NextResponse.json(resolved.persona);
}

async function getAccessiblePersona(
  context: PersonaRouteContext,
): Promise<{ persona: Persona } | { response: NextResponse }> {
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
    return { persona };
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

  return { persona };
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
