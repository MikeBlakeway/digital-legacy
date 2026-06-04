import { NextResponse } from "next/server";

import { countWords, getDiaryStats } from "@/lib/supabase/diary";
import { listCompletedInterviewTraitSources } from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { getCurrentTraits } from "@/lib/supabase/traits";

type PersonaProfileRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  context: PersonaProfileRouteContext,
) {
  const resolved = await getOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const serviceClient = createServiceRoleClient();
  const [traits, diaryStats, interviewSources] = await Promise.all([
    getCurrentTraits(serviceClient, resolved.persona.id),
    getDiaryStats(serviceClient, resolved.persona.id),
    listCompletedInterviewTraitSources(serviceClient, resolved.persona.id),
  ]);
  const interviewWordCount = interviewSources.reduce(
    (total, source) =>
      total +
      source.subject_turns.reduce((subtotal, turn) => subtotal + countWords(turn), 0),
    0,
  );

  return NextResponse.json({
    traits,
    diary_entry_count: diaryStats.total_entries,
    completed_interview_count: interviewSources.length,
    total_word_count: diaryStats.total_word_count + interviewWordCount,
  });
}

async function getOwnedPersona(
  context: PersonaProfileRouteContext,
): Promise<{ persona: Persona } | { response: NextResponse }> {
  const { slug } = await context.params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }

  return { persona };
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
