import { NextResponse, type NextRequest } from "next/server";

import { createPresignedUploadUrl } from "@/lib/b2/client";
import {
  extensionForContentType,
  isMediaContentType,
  maxFileBytesForMediaType,
  mediaTypeForContentType,
  type MediaContentType,
} from "@/lib/media-upload";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const DEFAULT_EXPIRES_IN_SECONDS = 15 * 60;

type UploadRequest = {
  persona_slug: string;
  content_type: MediaContentType;
  content_length: number;
};

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = await parseRequest(request);

  if ("fields" in parsed) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.fields },
      { status: 400 },
    );
  }

  const persona = await getPersonaBySlug(
    createServiceRoleClient(),
    parsed.persona_slug,
  );

  if (!persona || persona.owner_user_id !== userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const extension = extensionForContentType(parsed.content_type);
  const b2Key = `media/${persona.id}/${crypto.randomUUID()}.${extension}`;
  const uploadUrl = await createPresignedUploadUrl({
    key: b2Key,
    contentType: parsed.content_type,
    contentLength: parsed.content_length,
    expiresInSeconds: DEFAULT_EXPIRES_IN_SECONDS,
  });

  return NextResponse.json({
    upload_url: uploadUrl,
    b2_key: b2Key,
    expires_in_seconds: DEFAULT_EXPIRES_IN_SECONDS,
  });
}

async function parseRequest(
  request: NextRequest,
): Promise<UploadRequest | { fields: Record<string, string> }> {
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
  const personaSlug =
    typeof body.persona_slug === "string" ? body.persona_slug.trim() : "";
  const contentType = body.content_type;
  const contentLength = body.content_length;

  if (!personaSlug) {
    fields.persona_slug = "Persona slug is required.";
  }

  const mediaType = mediaTypeForContentType(contentType);

  if (!mediaType) {
    fields.content_type =
      "Content type must be a supported photo or video format.";
  }

  if (
    typeof contentLength !== "number" ||
    !Number.isInteger(contentLength) ||
    contentLength <= 0
  ) {
    fields.content_length = "Content length must be a positive integer.";
  } else if (
    mediaType &&
    contentLength > maxFileBytesForMediaType(mediaType)
  ) {
    fields.content_length =
      mediaType === "video"
        ? "Video size must be 2GB or smaller."
        : "Photo size must be 20MB or smaller.";
  }

  if (
    Object.keys(fields).length > 0 ||
    !isMediaContentType(contentType) ||
    typeof contentLength !== "number"
  ) {
    return { fields };
  }

  return {
    persona_slug: personaSlug,
    content_type: contentType,
    content_length: contentLength,
  };
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
