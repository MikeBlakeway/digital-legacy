import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PersonalityProfile from "@/components/capture/PersonalityProfile";
import { countWords, getDiaryStats } from "@/lib/supabase/diary";
import { listCompletedInterviewTraitSources } from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { getCurrentTraits } from "@/lib/supabase/traits";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const persona = await getOwnedPersona(slug);
  const serviceClient = createServiceRoleClient();
  const [traits, diaryStats, interviewSources] = await Promise.all([
    getCurrentTraits(serviceClient, persona.id),
    getDiaryStats(serviceClient, persona.id),
    listCompletedInterviewTraitSources(serviceClient, persona.id),
  ]);
  const interviewWordCount = interviewSources.reduce(
    (total, source) =>
      total +
      source.subject_turns.reduce((subtotal, turn) => subtotal + countWords(turn), 0),
    0,
  );

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div>
          <Link
            href={`/capture/${persona.slug}`}
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Back to capture dashboard
          </Link>
        </div>

        <PersonalityProfile
          personaSlug={persona.slug}
          traits={traits}
          diaryEntryCount={diaryStats.total_entries}
          completedInterviewCount={interviewSources.length}
          totalWordCount={diaryStats.total_word_count + interviewWordCount}
        />
      </section>
    </main>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/profile`)}`);
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
