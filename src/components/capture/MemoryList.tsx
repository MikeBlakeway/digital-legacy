import Link from "next/link";

import MemoryCard from "@/components/capture/MemoryCard";
import { createMemoryPageHref } from "@/components/capture/memory-browser-utils";
import type { Memory, MemorySourceFilter } from "@/lib/supabase/memories";

type MemoryListProps = {
  personaSlug: string;
  memories: Memory[];
  total: number;
  page: number;
  perPage: number;
  q: string | null;
  source: MemorySourceFilter | null;
};

export default function MemoryList({
  personaSlug,
  memories,
  total,
  page,
  perPage,
  q,
  source,
}: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        No memories found.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex flex-col gap-4">
      <div className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            personaSlug={personaSlug}
          />
        ))}
      </div>

      <nav
        aria-label="Memory pagination"
        className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="text-stone-600 dark:text-zinc-300">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {hasPrevious ? (
            <Link
              href={createMemoryPageHref({
                slug: personaSlug,
                q,
                source,
                page: page - 1,
                perPage,
              })}
              className="rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-stone-200 px-4 py-2 font-medium text-stone-400 dark:border-zinc-800 dark:text-zinc-600">
              Previous
            </span>
          )}

          {hasNext ? (
            <Link
              href={createMemoryPageHref({
                slug: personaSlug,
                q,
                source,
                page: page + 1,
                perPage,
              })}
              className="rounded-md border border-stone-300 px-4 py-2 font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-stone-200 px-4 py-2 font-medium text-stone-400 dark:border-zinc-800 dark:text-zinc-600">
              Next
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
