import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import EmotionalCoverageGrid from "@/components/capture/EmotionalCoverageGrid";
import VoiceDashboardWidget from "@/components/capture/VoiceDashboardWidget";
import VoiceReadinessIndicator from "@/components/capture/VoiceReadinessIndicator";
import { countWords, getDiaryStats } from "@/lib/supabase/diary";
import {
  getInterviewSessionCounts,
  listCompletedInterviewTraitSources,
  listInterviewSessions,
} from "@/lib/supabase/interviews";
import { getMediaStats } from "@/lib/supabase/media";
import { getMemoryStats } from "@/lib/supabase/memories";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { getCurrentTraits } from "@/lib/supabase/traits";
import { getVoiceSampleOverview } from "@/lib/supabase/voice-samples";

export const dynamic = "force-dynamic";

const INTERVIEW_THEME_COUNT = 5;

type CaptureDashboardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CaptureDashboardPage({
  params,
}: CaptureDashboardPageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}`)}`);
  }

  const serviceClient = createServiceRoleClient();
  const persona = await getPersonaBySlug(serviceClient, slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  const [
    diaryStats,
    interviewSessions,
    interviewCounts,
    mediaStats,
    memoryStats,
    traits,
    interviewSources,
    voiceOverview,
  ] = await Promise.all([
    getDiaryStats(serviceClient, persona.id),
    listInterviewSessions(serviceClient, persona.id),
    getInterviewSessionCounts(serviceClient, persona.id),
    getMediaStats(serviceClient, persona.id),
    getMemoryStats(serviceClient, persona.id),
    getCurrentTraits(serviceClient, persona.id),
    listCompletedInterviewTraitSources(serviceClient, persona.id),
    getVoiceSampleOverview(serviceClient, persona.id),
  ]);
  const completedThemeCount = Object.values(interviewCounts).filter(
    (count) => count > 0,
  ).length;
  const interviewWordCount = interviewSources.reduce(
    (total, source) =>
      total +
      source.subject_turns.reduce((subtotal, turn) => subtotal + countWords(turn), 0),
    0,
  );
  const totalTraitWords = diaryStats.total_word_count + interviewWordCount;

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10 sm:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Capture mode
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              {persona.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-zinc-300">
              {formatBiographicalSummary(persona)}
            </p>
          </div>
          <span className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-400 dark:border-zinc-800 dark:text-zinc-600">
            Settings
          </span>
        </header>

        <section className="space-y-4" aria-labelledby="progress-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="progress-heading" className="text-lg font-semibold">
                Progress overview
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-zinc-300">
                What has been captured so far.
              </p>
            </div>
            <Link
              href={`/capture/${persona.slug}/profile`}
              className="text-sm font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100"
            >
              View profile
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Diary"
              value={`${diaryStats.total_entries} entries`}
              detail={`${diaryStats.total_word_count} words`}
            />
            <StatCard
              label="Interviews"
              value={`${completedThemeCount} of ${INTERVIEW_THEME_COUNT} themes`}
              detail={`${interviewSessions.length} sessions`}
            />
            <StatCard
              label="Photos"
              value={`${mediaStats.total_photos} photos`}
              detail={`${mediaStats.captioned_photos} captioned`}
            />
            <StatCard
              label="Videos"
              value={`${mediaStats.total_videos} videos`}
              detail="Recorded and uploaded"
            />
            <StatCard
              label="Memories"
              value={`${memoryStats.total} total`}
              detail={`${memoryStats.by_visibility.private} private`}
            />
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100">
            <span className="font-medium">Personality profile: </span>
            {traits
              ? `Last updated ${formatDate(traits.computed_at)}.`
              : `Not yet generated - need 500 words minimum (currently ${totalTraitWords} words).`}
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="voice-heading">
          <div>
            <h2 id="voice-heading" className="text-lg font-semibold">
              Voice readiness
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-zinc-300">
              Dedicated samples, diary recordings, and interview recordings all
              contribute to emotional voice coverage.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <VoiceReadinessIndicator
              totalDurationSeconds={voiceOverview.total_duration_seconds}
            />

            <section className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-medium text-stone-700 dark:text-zinc-200">
                Emotional coverage
              </h3>
              <div className="mt-4">
                <EmotionalCoverageGrid
                  coverage={voiceOverview.emotional_coverage}
                  metric="minutes"
                />
              </div>
            </section>
          </div>

          <VoiceDashboardWidget personaSlug={persona.slug} />
        </section>

        <section className="space-y-4" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="text-lg font-semibold">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href={`/capture/${persona.slug}/diary/new`}
              label="Write a diary entry"
              detail="Capture a free-form story or recording."
            />
            <QuickAction
              href={`/capture/${persona.slug}/interview`}
              label="Start an interview"
              detail="Answer structured questions with the interviewer."
            />
            <QuickAction
              href={`/capture/${persona.slug}/photos`}
              label="Upload photos"
              detail="Add captions that become searchable memories."
            />
            <QuickAction
              href={`/capture/${persona.slug}/videos`}
              label="Record a video"
              detail="Record now or add an existing video from your phone."
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-stone-950 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-2 text-sm text-stone-600 dark:text-zinc-300">{detail}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-stone-200 bg-white p-5 transition hover:border-teal-400 hover:bg-teal-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700 dark:hover:bg-teal-950/20"
    >
      <span className="text-sm font-semibold text-stone-950 dark:text-zinc-50">
        {label}
      </span>
      <span className="mt-2 block text-sm leading-6 text-stone-600 dark:text-zinc-300">
        {detail}
      </span>
    </Link>
  );
}

function formatBiographicalSummary(persona: Persona): string {
  const parts = [
    persona.birth_year ? `Born ${persona.birth_year}` : null,
    persona.birth_place ? `in ${persona.birth_place}` : null,
    persona.locations_lived?.length
      ? `Places lived: ${persona.locations_lived.join(", ")}`
      : null,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" - ")
    : "Biographical grounding can be added later.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
