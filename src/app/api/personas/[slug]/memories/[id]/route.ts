import { NextResponse, type NextRequest } from "next/server";

import {
  deleteMemory,
  MemoryDatabaseError,
  isMemoryVisibilityFilter,
  updateMemoryVisibility,
  type MemoryVisibilityFilter,
} from "@/lib/supabase/memories";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type MemoryItemRouteContext = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

type PatchMemoryRequest = {
  visibility: MemoryVisibilityFilter;
};

export async function PATCH(
  request: NextRequest,
  context: MemoryItemRouteContext,
) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const parsed = await parsePatchRequest(request);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  try {
    const { id } = await context.params;
    const memory = await updateMemoryVisibility(createServiceRoleClient(), {
      personaId: resolved.persona.id,
      memoryId: id,
      visibility: parsed.visibility,
    });

    return NextResponse.json(memory);
  } catch (error) {
    if (error instanceof MemoryDatabaseError && isMissingRowError(error.details)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (error instanceof MemoryDatabaseError) {
      console.error("Failed to update memory.", error);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  context: MemoryItemRouteContext,
) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  try {
    const { id } = await context.params;
    const deleted = await deleteMemory(createServiceRoleClient(), {
      personaId: resolved.persona.id,
      memoryId: id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof MemoryDatabaseError) {
      console.error("Failed to delete memory.", error);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    throw error;
  }
}

async function getOwnedPersona(
  context: MemoryItemRouteContext,
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

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return { persona };
}

async function parsePatchRequest(
  request: NextRequest,
): Promise<PatchMemoryRequest | { fields: Record<string, string> }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { fields: { body: "Request body must be valid JSON." } };
  }

  if (!isRecord(body)) {
    return { fields: { body: "Request body must be an object." } };
  }

  if (isMemoryVisibilityFilter(body.visibility)) {
    return { visibility: body.visibility };
  }

  if (typeof body.is_private === "boolean") {
    return { visibility: body.is_private ? "private" : "family" };
  }

  return {
    fields: {
      visibility: "Visibility must be family or private.",
    },
  };
}

function isMissingRowError(value: unknown): boolean {
  return isRecord(value) && value.code === "PGRST116";
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
