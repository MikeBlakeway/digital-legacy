import { NextResponse, type NextRequest } from "next/server";

import { createPresignedDownloadUrl } from "@/lib/b2/client";
import {
  createMediaAsset,
  listMediaAssets,
  type MediaAsset,
  type MediaType,
} from "@/lib/supabase/media";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

type MediaRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type CreateMediaRequest = {
  b2_key: string;
  media_type: MediaType;
  taken_at: string | null;
};

const PHOTO_URL_EXPIRES_IN_SECONDS = 15 * 60;
const VIDEO_URL_EXPIRES_IN_SECONDS = 4 * 60 * 60;

export async function GET(_request: NextRequest, context: MediaRouteContext) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const requestedMediaType = readMediaType(
    _request.nextUrl.searchParams.get("type"),
  );
  const assets = await listMediaAssets(createServiceRoleClient(), {
    personaId: resolved.persona.id,
    ...(requestedMediaType ? { mediaType: requestedMediaType } : {}),
  });
  const assetsWithUrls = await Promise.all(assets.map(withSignedUrl));

  return NextResponse.json({ assets: assetsWithUrls });
}

export async function POST(request: NextRequest, context: MediaRouteContext) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const parsed = await parseCreateRequest(request, resolved.persona.id);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  const asset = await createMediaAsset(createServiceRoleClient(), {
    personaId: resolved.persona.id,
    b2Key: parsed.b2_key,
    mediaType: parsed.media_type,
    takenAt: parsed.taken_at,
    uploadedBy: resolved.userId,
  });

  const withUrl = await withSignedUrl(asset);
  return NextResponse.json(withUrl, { status: 201 });
}

async function getOwnedPersona(
  context: MediaRouteContext,
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

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return { persona, userId };
}

async function parseCreateRequest(
  request: NextRequest,
  personaId: string,
): Promise<CreateMediaRequest | { fields: Record<string, string> }> {
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
  const b2Key = typeof body.b2_key === "string" ? body.b2_key.trim() : "";
  const mediaType = body.media_type ?? "photo";
  const takenAt = body.taken_at;

  if (!b2Key) {
    fields.b2_key = "B2 key is required.";
  }

  if (b2Key && !b2Key.startsWith(`media/${personaId}/`)) {
    fields.b2_key = "Media key is not valid for this persona.";
  }

  if (!isMediaType(mediaType)) {
    fields.media_type = "Media type must be photo or video.";
  }

  if (
    takenAt !== undefined &&
    takenAt !== null &&
    (typeof takenAt !== "string" || Number.isNaN(Date.parse(takenAt)))
  ) {
    fields.taken_at = "Taken at must be a valid date.";
  }

  if (Object.keys(fields).length > 0 || !isMediaType(mediaType)) {
    return { fields };
  }

  return {
    b2_key: b2Key,
    media_type: mediaType,
    taken_at: typeof takenAt === "string" ? new Date(takenAt).toISOString() : null,
  };
}

async function withSignedUrl(asset: MediaAsset) {
  const url = await createPresignedDownloadUrl({
    key: asset.b2_key,
    expiresInSeconds:
      asset.media_type === "video"
        ? VIDEO_URL_EXPIRES_IN_SECONDS
        : PHOTO_URL_EXPIRES_IN_SECONDS,
  });

  return {
    ...asset,
    url,
  };
}

function readMediaType(value: string | null): MediaType | null {
  return isMediaType(value) ? value : null;
}

function isMediaType(value: unknown): value is MediaType {
  return value === "photo" || value === "video";
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
