import { NextResponse, type NextRequest } from "next/server";

import { createPresignedUploadUrl } from "@/lib/b2/client";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const DEFAULT_EXPIRES_IN_SECONDS = 15 * 60;
const CONTENT_TYPES = ["audio/webm", "audio/webm;codecs=opus"] as const;
const KEY_PREFIXES = ["voice-samples", "diary", "interview"] as const;

type ContentType = (typeof CONTENT_TYPES)[number];
export type VoiceSampleUploadKeyPrefix = (typeof KEY_PREFIXES)[number];

type UploadRequest = {
  persona_slug: string;
  content_type: ContentType;
  content_length?: number;
  key_prefix?: VoiceSampleUploadKeyPrefix;
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

  const prefix = parsed.key_prefix ?? "voice-samples";
  const b2Key = `${prefix}/${persona.id}/${crypto.randomUUID()}.webm`;
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
  const contentLength: unknown = body.content_length;
  const keyPrefix = body.key_prefix;

  if (!personaSlug) {
    fields.persona_slug = "Persona slug is required.";
  }

  if (!isContentType(contentType)) {
    fields.content_type = "Content type must be audio/webm.";
  }

  if (
    contentLength !== undefined &&
    (typeof contentLength !== "number" ||
      !Number.isInteger(contentLength) ||
      contentLength <= 0)
  ) {
    fields.content_length = "Content length must be a positive integer.";
  }

  if (keyPrefix !== undefined && !isVoiceSampleUploadKeyPrefix(keyPrefix)) {
    fields.key_prefix = "Key prefix must be voice-samples, diary, or interview.";
  }

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return {
    persona_slug: personaSlug,
    content_type: contentType as ContentType,
    ...(typeof contentLength === "number" ? { content_length: contentLength } : {}),
    ...(isVoiceSampleUploadKeyPrefix(keyPrefix) ? { key_prefix: keyPrefix } : {}),
  };
}

function isContentType(value: unknown): value is ContentType {
  return CONTENT_TYPES.some((contentType) => contentType === value);
}

export function isVoiceSampleUploadKeyPrefix(
  value: unknown,
): value is VoiceSampleUploadKeyPrefix {
  return KEY_PREFIXES.some((keyPrefix) => keyPrefix === value);
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
