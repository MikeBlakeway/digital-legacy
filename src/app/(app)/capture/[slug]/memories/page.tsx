import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import MemoryList from "@/components/capture/MemoryList";
import MemorySearch from "@/components/capture/MemorySearch";
import {
  createMemoryPageHref,
  normalizeMemoryBrowserParams,
  type MemoryBrowserSearchParams,
} from "@/components/capture/memory-browser-utils";
import { listMemories, type MemorySourceFilter } from "@/lib/supabase/memories";
import { getPersonaBySlug, type Persona } from "@/lib/supabase/personas";
import {
  createClient as createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MemoryBrowserPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<MemoryBrowserSearchParams>;
};

const SOURCE_TABS: { label: string; source: MemorySourceFilter | null }[] = [
  { label: "All", source: null },
  { label: "Diary", source: "diary" },
  { label: "Interviews", source: "interview" },
  { label: "Media", source: "media_caption" },
];

export default async function MemoryBrowserPage({
  params,
  searchParams,
}: MemoryBrowserPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const filters = normalizeMemoryBrowserParams(query);
  const persona = await getOwnedPersona(slug);
  const result = await listMemories(createServiceRoleClient(), {
    personaId: persona.id,
    q: filters.q,
    source: filters.source,
    page: filters.page,
    perPage: filters.perPage,
  });

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
              {persona.name} memories
            </h1>
            <p className="mt-3 text-sm text-stone-600 dark:text-zinc-300">
              {formatTotal(result.total)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SourceTabs
            personaSlug={persona.slug}
            q={filters.q}
            currentSource={filters.source}
            perPage={filters.perPage}
          />
          <MemorySearch key={filters.q ?? ""} initialQuery={filters.q ?? ""} />
        </div>

        <MemoryList
          personaSlug={persona.slug}
          memories={result.memories}
          total={result.total}
          page={result.page}
          perPage={result.per_page}
          q={filters.q}
          source={filters.source}
        />
      </section>
    </main>
  );
}

function SourceTabs({
  personaSlug,
  q,
  currentSource,
  perPage,
}: {
  personaSlug: string;
  q: string | null;
  currentSource: MemorySourceFilter | null;
  perPage: number;
}) {
  return (
    <nav
      aria-label="Memory source filters"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {SOURCE_TABS.map((tab) => {
        const isActive = tab.source === currentSource;

        return (
          <Link
            key={tab.label}
            href={createMemoryPageHref({
              slug: personaSlug,
              q,
              source: tab.source,
              page: 1,
              perPage,
            })}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "whitespace-nowrap rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "whitespace-nowrap rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const userId = readUserId(claimsResult.data?.claims);

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/memories`)}`,
    );
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug);

  if (!persona || persona.owner_user_id !== userId) {
    notFound();
  }

  return persona;
}

function formatTotal(total: number): string {
  return `${total} ${total === 1 ? "memory" : "memories"}`;
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
