import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  createClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const AUTH_USERS_PAGE_SIZE = 100;
const MAX_AUTH_USER_PAGES = 1_000;

export type AdminPersona = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
};

export type AdminPersonaGrant = {
  personaId: string;
  personaName: string;
  personaSlug: string;
  grantedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  confirmedAt: string | null;
  invitedAt: string | null;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isProvider: boolean;
  ownedPersonas: AdminPersona[];
  grants: AdminPersonaGrant[];
};

export type AdminUserDirectory = {
  users: AdminUser[];
  personas: AdminPersona[];
};

type PersonaRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
};

type PersonaAccessRow = {
  persona_id: string;
  user_id: string;
  granted_at: string;
};

export class AdminUserDirectoryError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "AdminUserDirectoryError";
    this.details = details;
  }
}

export async function getAdminUserDirectory(): Promise<AdminUserDirectory> {
  const adminClient = createServiceRoleClient();
  const databaseClient = await createClient();

  const [authUsers, personasResult, grantsResult] = await Promise.all([
    listAllAuthUsers(adminClient),
    databaseClient
      .from("personas")
      .select("id, name, slug, owner_user_id")
      .order("name", { ascending: true }),
    databaseClient
      .from("persona_access")
      .select("persona_id, user_id, granted_at")
      .order("granted_at", { ascending: false }),
  ]);

  if (personasResult.error) {
    throw new AdminUserDirectoryError(
      "Failed to load personas for user administration.",
      personasResult.error,
    );
  }

  if (grantsResult.error) {
    throw new AdminUserDirectoryError(
      "Failed to load persona access grants.",
      grantsResult.error,
    );
  }

  const personas = normalizePersonas(personasResult.data);
  const grants = normalizeGrants(grantsResult.data);
  const personasById = new Map(personas.map((persona) => [persona.id, persona]));

  return {
    personas,
    users: authUsers
      .map((user) => ({
        id: user.id,
        email: user.email ?? "No email address",
        createdAt: user.created_at,
        confirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
        invitedAt: user.invited_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        isAdmin: hasAdminRole(user),
        isProvider: hasProviderRole(user),
        ownedPersonas: personas.filter(
          (persona) => persona.ownerUserId === user.id,
        ),
        grants: grants.flatMap((grant) => {
          if (grant.user_id !== user.id) {
            return [];
          }

          const persona = personasById.get(grant.persona_id);
          return persona
            ? [
                {
                  personaId: persona.id,
                  personaName: persona.name,
                  personaSlug: persona.slug,
                  grantedAt: grant.granted_at,
                },
              ]
            : [];
        }),
      }))
      .sort((left, right) => left.email.localeCompare(right.email)),
  };
}

export async function listAllAuthUsers(
  client: ReturnType<typeof createServiceRoleClient>,
): Promise<User[]> {
  const users: User[] = [];

  for (let page = 1; page <= MAX_AUTH_USER_PAGES; page += 1) {
    const result = await client.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (result.error) {
      throw new AdminUserDirectoryError(
        "Failed to load invited users.",
        result.error,
      );
    }

    users.push(...result.data.users);

    if (
      result.data.users.length < AUTH_USERS_PAGE_SIZE ||
      (result.data.total > 0 && users.length >= result.data.total)
    ) {
      return users;
    }
  }

  throw new AdminUserDirectoryError(
    "The user directory exceeded the supported page limit.",
  );
}

function normalizePersonas(value: unknown): AdminPersona[] {
  if (!Array.isArray(value)) {
    throw new AdminUserDirectoryError("Supabase returned invalid personas.", value);
  }

  return value.map((row) => {
    if (!isPersonaRow(row)) {
      throw new AdminUserDirectoryError(
        "Supabase returned an invalid persona.",
        row,
      );
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      ownerUserId: row.owner_user_id,
    };
  });
}

function normalizeGrants(value: unknown): PersonaAccessRow[] {
  if (!Array.isArray(value) || !value.every(isPersonaAccessRow)) {
    throw new AdminUserDirectoryError(
      "Supabase returned invalid persona grants.",
      value,
    );
  }

  return value;
}

function hasAdminRole(user: User): boolean {
  return (
    user.app_metadata.role === "admin" ||
    (Array.isArray(user.app_metadata.roles) &&
      user.app_metadata.roles.includes("admin"))
  );
}

function hasProviderRole(user: User): boolean {
  return (
    user.app_metadata.role === "subject" ||
    user.app_metadata.role === "admin" ||
    (Array.isArray(user.app_metadata.roles) &&
      (user.app_metadata.roles.includes("subject") ||
        user.app_metadata.roles.includes("admin")))
  );
}

function isPersonaRow(value: unknown): value is PersonaRow {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.owner_user_id === "string"
  );
}

function isPersonaAccessRow(value: unknown): value is PersonaAccessRow {
  return (
    isRecord(value) &&
    typeof value.persona_id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.granted_at === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
