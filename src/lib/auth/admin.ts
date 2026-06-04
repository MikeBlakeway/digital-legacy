import "server-only";

import { notFound, redirect } from "next/navigation";

import { createClient as createServerClient } from "@/lib/supabase/server";

export async function requireAdmin(redirectedFrom: string): Promise<string> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`);
  }

  if (!hasAdminRole(claimsResult.data?.claims)) {
    notFound();
  }

  return userId;
}

function hasAdminRole(claims: unknown): boolean {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return false;
  }

  const appMetadata = claims.app_metadata;

  return (
    appMetadata.role === "admin" ||
    (Array.isArray(appMetadata.roles) &&
      appMetadata.roles.some((role) => role === "admin"))
  );
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
