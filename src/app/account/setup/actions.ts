"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SetPasswordState = {
  error: string | null;
};

const MINIMUM_PASSWORD_LENGTH = 12;

export async function setPassword(
  _state: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = readFormString(formData, "password");
  const confirmation = readFormString(formData, "passwordConfirmation");

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return {
      error: `Use at least ${MINIMUM_PASSWORD_LENGTH} characters for your password.`,
    };
  }

  if (password !== confirmation) {
    return { error: "The passwords do not match." };
  }

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();

  if (claimsResult.error || !claimsResult.data?.claims.sub) {
    return { error: "This invitation has expired. Ask for a new invitation." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/capture");
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
