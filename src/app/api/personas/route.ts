import { NextResponse, type NextRequest } from "next/server";

import {
  createPersona,
  getPersonaBySlug,
  PersonaDatabaseError,
} from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENT_YEAR = new Date().getFullYear();

type CreatePersonaRequest = {
  name: string;
  slug: string;
  birth_year?: number;
  birth_place?: string;
  locations_lived?: string[];
};

type InvalidRequest = {
  fields: Record<string, string>;
};

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims: unknown = claimsResult.data?.claims;
  const userId = readUserId(claims);

  if (claimsResult.error || !userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSubjectRole(claims)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parseResult = await parseRequest(request);

  if ("fields" in parseResult) {
    return NextResponse.json(
      { error: "invalid_request", fields: parseResult.fields },
      { status: 400 },
    );
  }

  const serviceClient = createServiceRoleClient();

  try {
    const existing = await getPersonaBySlug(serviceClient, parseResult.slug);

    if (existing) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }

    const persona = await createPersona(serviceClient, {
      ...parseResult,
      owner_user_id: userId,
    });

    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    if (error instanceof PersonaDatabaseError && isUniqueViolation(error.details)) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}

async function parseRequest(
  request: NextRequest,
): Promise<CreatePersonaRequest | InvalidRequest> {
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
  const name = readOptionalString(body.name)?.trim() ?? "";
  const slug = readOptionalString(body.slug)?.trim() ?? "";
  const birthYear = readOptionalNumber(body.birth_year);
  const birthPlace = readOptionalString(body.birth_place)?.trim();
  const locationsLived = readOptionalStringArray(body.locations_lived);

  if (!name) {
    fields.name = "Name is required.";
  }

  if (!isValidSlug(slug)) {
    fields.slug =
      "Slug must be 3-40 characters using lowercase letters, numbers, and hyphens.";
  }

  if (birthYear !== undefined) {
    if (!Number.isInteger(birthYear) || birthYear < 1 || birthYear > CURRENT_YEAR) {
      fields.birth_year = `Birth year must be between 1 and ${CURRENT_YEAR}.`;
    }
  }

  if (body.birth_year !== undefined && birthYear === undefined) {
    fields.birth_year = "Birth year must be a number.";
  }

  if (body.birth_place !== undefined && body.birth_place !== null && birthPlace === undefined) {
    fields.birth_place = "Birthplace must be text.";
  }

  if (
    body.locations_lived !== undefined &&
    body.locations_lived !== null &&
    locationsLived === undefined
  ) {
    fields.locations_lived = "Places lived must be a list of text values.";
  }

  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  return {
    name,
    slug,
    ...(birthYear === undefined ? {} : { birth_year: birthYear }),
    ...(birthPlace ? { birth_place: birthPlace } : {}),
    ...(locationsLived && locationsLived.length > 0
      ? { locations_lived: locationsLived }
      : {}),
  };
}

function hasSubjectRole(claims: unknown): boolean {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return false;
  }

  const appMetadata = claims.app_metadata;

  if (appMetadata.role === "subject") {
    return true;
  }

  return (
    Array.isArray(appMetadata.roles) &&
    appMetadata.roles.some((role) => role === "subject")
  );
}

function readUserId(claims: unknown): string | null {
  if (!isRecord(claims) || typeof claims.sub !== "string") {
    return null;
  }

  return claims.sub;
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return typeof value === "number" ? value : undefined;
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && SLUG_PATTERN.test(slug);
}

function isUniqueViolation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return value.code === "23505";
}
