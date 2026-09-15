import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import DiaryEntryList from "@/components/capture/diary/DiaryEntryList";
import {
  formatApproximateStoryTime,
} from "@/components/capture/personality-profile-utils";
import { EMOTION_OPTIONS } from "@/lib/capture/emotions";
import {
  getDiaryStats,
  listDiaryEntries,
  type DiaryStats,
} from "@/lib/supabase/diary";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DiaryHomePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DiaryHomePage({ params }: DiaryHomePageProps) {
  const { slug } = await params;
  const persona = await getOwnedPersona(slug);
  const serviceClient = createServiceRoleClient();
  const [entries, stats] = await Promise.all([
    listDiaryEntries(serviceClient, {
      personaId: persona.id,
      page: 1,
      perPage: 20,
    }),
    getDiaryStats(serviceClient, persona.id),
  ]);

  return (
    <main className="flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/capture/${persona.slug}`}
              className="text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Back to capture dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              {persona.name} diary
            </h1>
          </div>
          <Link
            href={`/capture/${persona.slug}/diary/new`}
            className="rounded-md bg-stone-900 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            New story
          </Link>
        </div>

        <DiarySummary stats={stats} />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-stone-950 dark:text-zinc-50">
            Recent stories
          </h2>
          <DiaryEntryList entries={entries} />
        </div>
      </section>
    </main>
  );
}

function DiarySummary({ stats }: { stats: DiaryStats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-stone-500 dark:text-zinc-400">Stories</p>
        <p className="mt-2 text-3xl font-semibold">{stats.total_entries}</p>
        <p className="mt-4 text-sm text-stone-500 dark:text-zinc-400">
          Story time
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {formatApproximateStoryTime(stats.total_word_count)}
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-stone-700 dark:text-zinc-200">
          Emotional coverage
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {EMOTION_OPTIONS.map((emotion) => {
            const count = stats.emotion_counts[emotion.label];
            return (
              <div
                key={emotion.label}
                className={
                  count > 0
                    ? "rounded-md border border-stone-300 bg-stone-100 p-3 text-stone-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    : "rounded-md border border-stone-200 bg-stone-50 p-3 text-stone-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600"
                }
              >
                <span aria-hidden="true">{emotion.emoji}</span>{" "}
                <span className="text-sm font-medium">{emotion.display}</span>
                <span className="mt-1 block text-xs">{count} entries</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/diary`)}`);
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
