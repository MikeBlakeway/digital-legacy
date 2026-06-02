"use server";

import { redirect } from "next/navigation";

import { getSafeRelativePath } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error: string | null;
};

export async function signIn(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = readFormString(formData, "email").trim();
  const password = readFormString(formData, "password");
  const redirectTarget = getSafeRelativePath(
    readFormString(formData, "redirectedFrom"),
    "/capture",
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTarget);
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
