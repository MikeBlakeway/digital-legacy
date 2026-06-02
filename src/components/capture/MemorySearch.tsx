"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type MemorySearchProps = {
  initialQuery: string;
};

export default function MemorySearch({ initialQuery }: MemorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalized = query.trim();
      const current = searchParams.get("q") ?? "";

      if (normalized === current) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());

      if (normalized) {
        nextParams.set("q", normalized);
      } else {
        nextParams.delete("q");
      }

      nextParams.delete("page");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, query, router, searchParams]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="memory-search" className="sr-only">
        Search memories
      </label>
      <input
        id="memory-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search memories"
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="min-h-11 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
