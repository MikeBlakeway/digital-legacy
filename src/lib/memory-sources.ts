export const MEMORY_SOURCES = [
  "interview",
  "voice_memo",
  "free_text",
  "media_caption",
  "diary",
] as const;

export const MEMORY_SOURCE_FILTERS = [
  "diary",
  "interview",
  "media_caption",
  "voice_memo",
] as const;

export type MemorySource = (typeof MEMORY_SOURCES)[number];
export type MemorySourceFilter = (typeof MEMORY_SOURCE_FILTERS)[number];

export function isMemorySource(value: unknown): value is MemorySource {
  return (
    typeof value === "string" &&
    MEMORY_SOURCES.some((source) => source === value)
  );
}

export function isMemorySourceFilter(value: unknown): value is MemorySourceFilter {
  return (
    typeof value === "string" &&
    MEMORY_SOURCE_FILTERS.some((source) => source === value)
  );
}
