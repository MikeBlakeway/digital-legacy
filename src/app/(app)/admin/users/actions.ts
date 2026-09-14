"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireAdmin } from "@/lib/auth/admin";
import { createAccountSetupUrl } from "@/lib/auth/invite-redirects";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_USERS_PATH = "/admin/users";

export type AdminUserMutationState = {
  error: string | null;
  message: string | null;
};

export async function inviteProvider(
  _state: AdminUserMutationState,
  formData: FormData,
): Promise<AdminUserMutationState> {
  await requireAdmin(ADMIN_USERS_PATH);
  const email = readFormString(formData, "email").trim().toLowerCase();

  if (!isEmail(email)) {
    return failure("Enter a valid email address.");
  }

  const origin = await getRequestOrigin();
  const redirectTo = createAccountSetupUrl(origin, "/capture");
  const adminClient = createServiceRoleClient();
  const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (inviteResult.error || !inviteResult.data.user?.id) {
    console.error("Failed to invite provider", inviteResult.error);
    return failure(
      "The provider invitation could not be sent. The address may already have an account.",
    );
  }

  const user = inviteResult.data.user;
  const roleResult = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "subject",
      roles: ["subject"],
    },
  });

  if (roleResult.error) {
    console.error("Provider invited but role assignment failed", roleResult.error);
    revalidatePath(ADMIN_USERS_PATH);
    return failure(
      "The invitation was sent, but provider access could not be assigned. Review the account before they sign in.",
    );
  }

  revalidatePath(ADMIN_USERS_PATH);
  return success(`Provider invitation sent to ${email}.`);
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

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function success(message: string): AdminUserMutationState {
  return { error: null, message };
}

function failure(error: string): AdminUserMutationState {
  return { error, message: null };
}
