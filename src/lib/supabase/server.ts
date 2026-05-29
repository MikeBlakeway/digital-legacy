import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export interface SupabaseServerConfig {
  url: string;
  publishableKey: string;
  secretKey: string;
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseServerConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes sessions.
        }
      },
    },
  });
}

export function createServiceRoleClient() {
  const { url, secretKey } = getSupabaseServerConfig();

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseServerConfig {
  return {
    url: readRequiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: readRequiredEnv(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    secretKey: readRequiredEnv(env, "SUPABASE_SECRET_KEY"),
  };
}

function readRequiredEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
