import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ThemeSelector from "@/components/capture/interview/ThemeSelector";
import { getInterviewTheme } from "@/lib/interview-themes";
import {
  getInterviewSessionCounts,
  listInterviewSessions,
  type InterviewSessionListItem,
} from "@/lib/supabase/interviews";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InterviewHomePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function InterviewHomePage({
  params,
}: InterviewHomePageProps) {
  const { slug } = await params;
  const persona = await getOwnedPersona(slug);
  const serviceClient = createServiceRoleClient();
  const [sessions, counts] = await Promise.all([
    listInterviewSessions(serviceClient, persona.id),
    getInterviewSessionCounts(serviceClient, persona.id),
  ]);

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
          <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            {persona.name} interviews
          </h1>
        </div>

        <section className="space-y-4" aria-labelledby="interview-themes-heading">
          <h2
            id="interview-themes-heading"
            className="text-lg font-semibold text-stone-950 dark:text-zinc-50"
          >
            Choose a theme
          </h2>
          <ThemeSelector personaSlug={persona.slug} counts={counts} />
        </section>

        <section className="space-y-4" aria-labelledby="past-sessions-heading">
          <h2
            id="past-sessions-heading"
            className="text-lg font-semibold text-stone-950 dark:text-zinc-50"
          >
            Past sessions
          </h2>
          <PastSessions personaSlug={persona.slug} sessions={sessions} />
        </section>
      </section>
    </main>
  );
}

function PastSessions({
  personaSlug,
  sessions,
}: {
  personaSlug: string;
  sessions: InterviewSessionListItem[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        No interview sessions yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {sessions.map((session) => {
        const theme = getInterviewTheme(session.theme);

        return (
          <Link
            key={session.id}
            href={`/capture/${personaSlug}/interview/${session.id}`}
            className="block p-5 transition hover:bg-stone-100 dark:hover:bg-zinc-800"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-950 dark:text-zinc-50">
                  {theme.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-300">
                  {session.latest_message_preview}
                </p>
              </div>
              <div className="shrink-0 text-sm text-stone-500 dark:text-zinc-400">
                <span>{session.turn_count} turns</span>
                <span className="mx-2">·</span>
                <span>{session.completed_at ? "Complete" : "In progress"}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/interview`)}`,
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
