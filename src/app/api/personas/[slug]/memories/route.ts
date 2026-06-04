import { NextResponse, type NextRequest } from "next/server";

import { isMemorySourceFilter } from "@/lib/memory-sources";
import {
  isMemoryVisibilityFilter,
  listMemories,
  MemoryDatabaseError,
} from "@/lib/supabase/memories";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type MemoriesRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest, context: MemoriesRouteContext) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const url = new URL(request.url);
  const sourceParam = url.searchParams.get("source");
  const visibilityParam = url.searchParams.get("visibility");

  if (sourceParam && !isMemorySourceFilter(sourceParam)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        fields: {
          source:
            "Source must be diary, interview, media_caption, or voice_memo.",
        },
      },
      { status: 400 },
    );
  }

  if (visibilityParam && !isMemoryVisibilityFilter(visibilityParam)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        fields: {
          visibility: "Visibility must be family or private.",
        },
      },
      { status: 400 },
    );
  }

  const source = isMemorySourceFilter(sourceParam) ? sourceParam : null;
  const visibility = isMemoryVisibilityFilter(visibilityParam)
    ? visibilityParam
    : null;

  try {
    const result = await listMemories(createServiceRoleClient(), {
      personaId: resolved.persona.id,
      q: url.searchParams.get("q"),
      source,
      visibility,
      page: readPositiveInteger(url.searchParams.get("page"), 1),
      perPage: Math.min(
        readPositiveInteger(url.searchParams.get("per_page"), DEFAULT_PER_PAGE),
        MAX_PER_PAGE,
      ),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MemoryDatabaseError) {
      console.error("Failed to list memories.", error);
      return NextResponse.json({ error: "list_failed" }, { status: 500 });
    }

    throw error;
  }
}

async function getOwnedPersona(
  context: MemoriesRouteContext,
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

function readPositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
