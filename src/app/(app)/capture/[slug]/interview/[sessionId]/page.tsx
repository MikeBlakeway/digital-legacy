import { notFound, redirect } from "next/navigation";

import InterviewSession from "@/components/capture/interview/InterviewSession";
import { getInterviewSession } from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InterviewSessionPageProps = {
  params: Promise<{
    slug: string;
    sessionId: string;
  }>;
};

export default async function InterviewSessionPage({
  params,
}: InterviewSessionPageProps) {
  const { slug, sessionId } = await params;
  const persona = await getOwnedPersona(slug, sessionId);
  const session = await getInterviewSession(createServiceRoleClient(), {
    personaId: persona.id,
    sessionId,
  });

  if (!session) {
    notFound();
  }

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10">
        <InterviewSession personaSlug={persona.slug} initialSession={session} />
      </section>
    </main>
  );
}

async function getOwnedPersona(
  slug: string,
  sessionId: string,
): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(
        `/capture/${slug}/interview/${sessionId}`,
      )}`,
    );
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  return persona;
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
