import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  createClient as createServerClient,
  createServiceRoleClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server";
import { updateSession } from "@/lib/supabase/proxy";
import { config, proxy } from "@/proxy";

async function assertSupabaseAuthContracts(request: NextRequest) {
  const browserClient: SupabaseClient = createBrowserClient();
  const serverClient: SupabaseClient = await createServerClient();
  const serviceRoleClient: SupabaseClient = createServiceRoleClient();
  const serverConfig = getSupabaseServerConfig();

  const refreshedResponse: NextResponse = await updateSession(request);
  const proxyResponse: NextResponse = await proxy(request);

  const matcher: string[] = config.matcher;

  return {
    browserClient,
    serverClient,
    serviceRoleClient,
    serverConfig,
    refreshedResponse,
    proxyResponse,
    matcher,
  };
}

void assertSupabaseAuthContracts({} as NextRequest);
