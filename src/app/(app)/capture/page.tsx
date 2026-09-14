import { redirect } from "next/navigation";

import { getPersonasByOwner } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CaptureIndexPage() {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect("/login?redirectedFrom=%2Fcapture");
  }

  const personas = await getPersonasByOwner(createServiceRoleClient(), userId);

  if (personas.length === 0) {
    redirect("/capture/new");
  }

  if (personas.length === 1) {
    redirect(`/capture/${personas[0].slug}`);
  }

  redirect("/");
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
