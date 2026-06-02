import { after, NextResponse, type NextRequest } from "next/server";

import { upsertMemoryEmbedding } from "@/lib/rag/embed";
import { updateMediaCaption } from "@/lib/supabase/media";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type MediaItemRouteContext = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

type UpdateCaptionRequest = {
  caption: string;
  caption_status: "manual";
};

export async function PATCH(
  request: NextRequest,
  context: MediaItemRouteContext,
) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const parsed = await parseUpdateRequest(request);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const updated = await updateMediaCaption(createServiceRoleClient(), {
    personaId: resolved.persona.id,
    mediaId: id,
    caption: parsed.caption,
    captionStatus: parsed.caption_status,
  });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  after(async () => {
    await safelyEmbedCaption({
      personaId: resolved.persona.id,
      mediaAssetId: updated.id,
      caption: updated.caption,
    });
  });

  return NextResponse.json(updated);
}

async function getOwnedPersona(
  context: MediaItemRouteContext,
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

async function parseUpdateRequest(
  request: NextRequest,
): Promise<UpdateCaptionRequest | { fields: Record<string, string> }> {
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
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const captionStatus = body.caption_status;

  if (!caption) {
    fields.caption = "Caption is required.";
  }

  if (captionStatus !== "manual") {
    fields.caption_status = "Caption status must be manual.";
  }

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return {
    caption,
    caption_status: "manual",
  };
}

async function safelyEmbedCaption({
  personaId,
  mediaAssetId,
  caption,
}: {
  personaId: string;
  mediaAssetId: string;
  caption: string | null;
}) {
  if (!caption) {
    return;
  }

  // TODO: auto-captioning via vision model
  // When vision endpoint is available, call it here instead of prompting for manual caption.
  // Set caption_status = 'auto' on the resulting row.
  try {
    await upsertMemoryEmbedding({
      supabase: createServiceRoleClient(),
      personaId,
      content: caption,
      source: "media_caption",
      mediaAssetId,
    });
  } catch (error) {
    console.error("Media caption embedding failed.", error);
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
