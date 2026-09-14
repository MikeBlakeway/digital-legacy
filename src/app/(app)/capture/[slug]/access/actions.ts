"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createAccountSetupUrl } from "@/lib/auth/invite-redirects";
import { listAllAuthUsers } from "@/lib/auth/user-admin";
import { getPersonaBySlug } from "@/lib/supabase/personas";
import {
  createClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export type PersonaAccessMutationState = {
  error: string | null;
  message: string | null;
};

type PersonaOwnerAuthorization =
  | {
      ok: true;
      client: Awaited<ReturnType<typeof createClient>>;
      persona: NonNullable<Awaited<ReturnType<typeof getPersonaBySlug>>>;
      userId: string;
    }
  | { ok: false; error: string };

export async function invitePersonaConsumer(
  _state: PersonaAccessMutationState,
  formData: FormData,
): Promise<PersonaAccessMutationState> {
  const authorization = await authorizePersonaOwner(formData);

  if (!authorization.ok) {
    return failure(authorization.error);
  }

  const email = readFormString(formData, "email").trim().toLowerCase();

  if (!isEmail(email)) {
    return failure("Enter a valid email address.");
  }

  const { client, persona, userId } = authorization;
  const adminClient = createServiceRoleClient();
  const users = await listAllAuthUsers(adminClient);
  const existingUser = users.find(
    (user) => user.email?.trim().toLowerCase() === email,
  );

  if (existingUser?.id === userId) {
    return failure("You already own this persona.");
  }

  const origin = await getRequestOrigin();
  const conversationPath = `/talk/${persona.slug}`;
  let consumerUserId = existingUser?.id;
  let isNewAccount = false;

  if (!consumerUserId) {
    const redirectTo = createAccountSetupUrl(origin, conversationPath);
    const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (inviteResult.error || !inviteResult.data.user?.id) {
      console.error("Failed to invite persona consumer", inviteResult.error);
      return failure("The family invitation could not be sent.");
    }

    consumerUserId = inviteResult.data.user.id;
    isNewAccount = true;
  }

  const grantResult = await client.from("persona_access").insert({
    persona_id: persona.id,
    user_id: consumerUserId,
    granted_by: userId,
  });

  if (grantResult.error) {
    if (grantResult.error.code === "23505") {
      return failure("That person already has access to this persona.");
    }

    console.error("Failed to grant persona access", grantResult.error);
    return failure(
      isNewAccount
        ? "The invitation was sent, but access could not be assigned. Try again from this page."
        : "Persona access could not be granted.",
    );
  }

  if (!isNewAccount) {
    const emailResult = await adminClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: new URL(conversationPath, origin).toString(),
      },
    });

    if (emailResult.error) {
      console.error(
        "Access granted but notification email failed",
        emailResult.error,
      );
      revalidatePath(`/capture/${persona.slug}/access`);
      return failure(
        "Access was granted, but the sign-in email could not be sent. They can still sign in normally.",
      );
    }
  }

  revalidatePath(`/capture/${persona.slug}/access`);
  return success(`Invitation sent to ${email}.`);
}

export async function revokePersonaConsumer(
  _state: PersonaAccessMutationState,
  formData: FormData,
): Promise<PersonaAccessMutationState> {
  const authorization = await authorizePersonaOwner(formData);

  if (!authorization.ok) {
    return failure(authorization.error);
  }

  const consumerUserId = readUuid(formData, "userId");

  if (!consumerUserId) {
    return failure("The family member could not be identified.");
  }

  const { client, persona } = authorization;
  const result = await client
    .from("persona_access")
    .delete()
    .eq("persona_id", persona.id)
    .eq("user_id", consumerUserId)
    .select("persona_id")
    .maybeSingle();

  if (result.error) {
    console.error("Failed to revoke persona access", result.error);
    return failure("Persona access could not be revoked.");
  }

  if (!result.data) {
    return failure("That access grant no longer exists.");
  }

  revalidatePath(`/capture/${persona.slug}/access`);
  return success("Persona access revoked.");
}

async function authorizePersonaOwner(
  formData: FormData,
): Promise<PersonaOwnerAuthorization> {
  const slug = readFormString(formData, "slug").trim();
  const client = await createClient();
  const claimsResult = await client.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    return {
      ok: false,
      error: "Your session has expired. Sign in and try again.",
    };
  }

  const persona = await getPersonaBySlug(client, slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      ok: false,
      error: "You can only manage access to your own persona.",
    };
  }

  return { ok: true, client, persona, userId };
}

async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    throw new Error("Unable to determine the invitation origin.");
  }

  return `${protocol}://${host}`;
}

function readUserId(claims: unknown): string | null {
  if (
    typeof claims !== "object" ||
    claims === null ||
    !("sub" in claims) ||
    typeof claims.sub !== "string"
  ) {
    return null;
  }

  return claims.sub;
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readUuid(formData: FormData, key: string): string | null {
  const value = readFormString(formData, key).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function success(message: string): PersonaAccessMutationState {
  return { error: null, message };
}

function failure(error: string): PersonaAccessMutationState {
  return { error, message: null };
}
