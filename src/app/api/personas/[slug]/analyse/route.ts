import { NextResponse, type NextRequest } from "next/server";

import { inferTraits } from "@/lib/ai/analyse";
import { ModalError } from "@/lib/ai/client";
import {
  countWords,
  listDiaryTraitSources,
  markDiaryEntriesProcessed,
  type DiaryTraitSource,
} from "@/lib/supabase/diary";
import {
  listCompletedInterviewTraitSources,
  type InterviewTraitSource,
} from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import {
  getLatestTraitVersion,
  insertPersonaTraits,
  unsetCurrentTraits,
} from "@/lib/supabase/traits";

export const maxDuration = 120;

export const MINIMUM_TRAIT_CORPUS_WORDS = 500;

type AnalyseRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type TraitInferenceCorpus = {
  corpus: string;
  wordCount: number;
  diaryEntryIds: string[];
  diaryEntriesAnalysed: number;
  interviewTurnsAnalysed: number;
};

export async function POST(
  _request: NextRequest,
  context: AnalyseRouteContext,
) {
  const resolved = await getSubjectOwnedPersona(context);

  if ("response" in resolved) {
    return resolved.response;
  }

  const serviceClient = createServiceRoleClient();

  try {
    const [diaryEntries, interviewSessions] = await Promise.all([
      listDiaryTraitSources(serviceClient, resolved.persona.id),
      listCompletedInterviewTraitSources(serviceClient, resolved.persona.id),
    ]);
    const traitCorpus = buildTraitInferenceCorpus({
      diaryEntries,
      interviewSessions,
    });

    if (traitCorpus.wordCount < MINIMUM_TRAIT_CORPUS_WORDS) {
      return NextResponse.json(
        {
          error: "insufficient_content",
          word_count: traitCorpus.wordCount,
          minimum: MINIMUM_TRAIT_CORPUS_WORDS,
        },
        { status: 422 },
      );
    }

    const [inference, latestVersion] = await Promise.all([
      inferTraits(traitCorpus.corpus, { timeoutMs: 120_000 }),
      getLatestTraitVersion(serviceClient, resolved.persona.id),
    ]);
    const computedAt = new Date().toISOString();

    await unsetCurrentTraits(serviceClient, resolved.persona.id);
    const traits = await insertPersonaTraits(serviceClient, {
      personaId: resolved.persona.id,
      version: latestVersion + 1,
      inference,
      diaryEntriesAnalysed: traitCorpus.diaryEntriesAnalysed,
      interviewTurnsAnalysed: traitCorpus.interviewTurnsAnalysed,
      computedAt,
      isCurrent: true,
    });

    await markDiaryEntriesProcessed(
      serviceClient,
      traitCorpus.diaryEntryIds,
      computedAt,
    );

    return NextResponse.json(traits, { status: 201 });
  } catch (error) {
    if (error instanceof ModalError) {
      console.error("Trait inference Modal call failed.", error);
      return NextResponse.json({ error: "analyse_failed" }, { status: 502 });
    }

    console.error("Trait inference pipeline failed.", error);
    return NextResponse.json({ error: "analyse_failed" }, { status: 500 });
  }
}

export function buildTraitInferenceCorpus({
  diaryEntries,
  interviewSessions,
}: {
  diaryEntries: DiaryTraitSource[];
  interviewSessions: InterviewTraitSource[];
}): TraitInferenceCorpus {
  const diarySegments = diaryEntries.map((entry) => entry.text.trim()).filter(Boolean);
  const interviewSegments = interviewSessions.flatMap((session) =>
    session.subject_turns.map((turn) => turn.trim()).filter(Boolean),
  );
  const segments = [...diarySegments, ...interviewSegments];

  return {
    corpus: segments.join("\n---\n"),
    wordCount: segments.reduce((total, segment) => total + countWords(segment), 0),
    diaryEntryIds: diaryEntries.map((entry) => entry.id),
    diaryEntriesAnalysed: diarySegments.length,
    interviewTurnsAnalysed: interviewSegments.length,
  };
}

async function getSubjectOwnedPersona(
  context: AnalyseRouteContext,
): Promise<{ persona: Persona } | { response: NextResponse }> {
  const { slug } = await context.params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims: unknown = claimsResult.data?.claims;
  const userId = readUserId(claims);

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!hasSubjectRole(claims)) {
    return {
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
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

function hasSubjectRole(claims: unknown): boolean {
  if (!isRecord(claims) || !isRecord(claims.app_metadata)) {
    return false;
  }

  const appMetadata = claims.app_metadata;

  if (appMetadata.role === "subject") {
    return true;
  }

  return (
    Array.isArray(appMetadata.roles) &&
    appMetadata.roles.some((role) => role === "subject")
  );
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
