import { NextResponse, type NextRequest } from "next/server";

import { createPresignedUploadUrl } from "@/lib/b2/client";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const DEFAULT_EXPIRES_IN_SECONDS = 15 * 60;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

type UploadRequest = {
  persona_slug: string;
  content_type: AllowedContentType;
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

  const extension = extensionForMime(parsed.content_type);
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

  if (!isAllowedContentType(contentType)) {
    fields.content_type =
      "Content type must be jpeg, png, webp, heic, or heif.";
  }

  if (
    typeof contentLength !== "number" ||
    !Number.isInteger(contentLength) ||
    contentLength <= 0
  ) {
    fields.content_length = "Content length must be a positive integer.";
  } else if (contentLength > MAX_FILE_BYTES) {
    fields.content_length = "File size must be 20MB or smaller.";
  }

  if (
    Object.keys(fields).length > 0 ||
    !isAllowedContentType(contentType) ||
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

function extensionForMime(contentType: AllowedContentType): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return "bin";
  }
}

function isAllowedContentType(value: unknown): value is AllowedContentType {
  return ALLOWED_CONTENT_TYPES.some((contentType) => contentType === value);
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
