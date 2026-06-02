import {
  isMemorySourceFilter,
  type MemorySource,
  type MemorySourceFilter,
} from "@/lib/memory-sources";

export { isMemorySourceFilter };

export type MemoryBrowserSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type NormalizedMemoryBrowserParams = {
  q: string | null;
  source: MemorySourceFilter | null;
  page: number;
  perPage: number;
};

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function normalizeMemoryBrowserParams(
  params: MemoryBrowserSearchParams,
): NormalizedMemoryBrowserParams {
  const q = normalizeSearchText(readSingleParam(params.q));
  const source = readSingleParam(params.source);

  return {
    q,
    source: isMemorySourceFilter(source) ? source : null,
    page: readPositiveInteger(readSingleParam(params.page), 1),
    perPage: Math.min(
      readPositiveInteger(readSingleParam(params.per_page), DEFAULT_PER_PAGE),
      MAX_PER_PAGE,
    ),
  };
}

export function formatMemorySourceLabel(source: MemorySource): string {
  switch (source) {
    case "diary":
      return "Diary";
    case "interview":
      return "Interview";
    case "media_caption":
      return "Media";
    case "voice_memo":
      return "Voice memo";
    case "free_text":
      return "Free text";
  }
}

export function createMemoryPageHref({
  slug,
  q,
  source,
  page,
  perPage,
}: {
  slug: string;
  q: string | null;
  source: MemorySourceFilter | null;
  page: number;
  perPage: number;
}): string {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (source) {
    params.set("source", source);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set("per_page", String(perPage));
  }

  const query = params.toString();
  return query ? `/capture/${slug}/memories?${query}` : `/capture/${slug}/memories`;
}

export function formatMemoryRelativeDate(
  value: string,
  now: Date = new Date(),
): string {
  const date = new Date(value);
  const diffMs = Math.max(0, now.getTime() - date.getTime());

  if (diffMs < MINUTE_MS) {
    return "Just now";
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return formatRelativeUnit(minutes, "minute");
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return formatRelativeUnit(hours, "hour");
  }

  const days = Math.floor(diffMs / DAY_MS);
  if (days < 30) {
    return formatRelativeUnit(days, "day");
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelativeUnit(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

function normalizeSearchText(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function readSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function readPositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
