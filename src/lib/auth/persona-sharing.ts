import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listAllAuthUsers } from "@/lib/auth/user-admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type PersonaConsumer = {
  userId: string;
  email: string;
  grantedAt: string;
};

type PersonaAccessRow = {
  user_id: string;
  granted_at: string;
};

export async function listPersonaConsumers(
  client: SupabaseClient,
  personaId: string,
): Promise<PersonaConsumer[]> {
  const [grantsResult, authUsers] = await Promise.all([
    client
      .from("persona_access")
      .select("user_id, granted_at")
      .eq("persona_id", personaId)
      .order("granted_at", { ascending: false }),
    listAllAuthUsers(createServiceRoleClient()),
  ]);

  if (grantsResult.error) {
    throw new Error("Failed to load persona access.", {
      cause: grantsResult.error,
    });
  }

  const grants = normalizeAccessRows(grantsResult.data);
  const emailsByUserId = new Map(
    authUsers.map((user) => [user.id, user.email ?? "No email address"]),
  );

  return grants.map((grant) => ({
    userId: grant.user_id,
    email: emailsByUserId.get(grant.user_id) ?? "Unknown account",
    grantedAt: grant.granted_at,
  }));
}

function normalizeAccessRows(value: unknown): PersonaAccessRow[] {
  if (!Array.isArray(value) || !value.every(isPersonaAccessRow)) {
    throw new Error("Supabase returned invalid persona access rows.");
  }

  return value;
}

function isPersonaAccessRow(value: unknown): value is PersonaAccessRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "user_id" in value &&
    typeof value.user_id === "string" &&
    "granted_at" in value &&
    typeof value.granted_at === "string"
  );
}
