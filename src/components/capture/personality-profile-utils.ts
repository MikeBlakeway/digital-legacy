import type { PersonaTraits } from "@/lib/supabase/traits";

export const MINIMUM_PROFILE_WORDS = 500;
// The model still evaluates transcript content; this converts that internal
// threshold into the approximate speaking time people experience while recording.
const SPOKEN_WORDS_PER_MINUTE = 125;

export type ProfileProgress = {
  canGenerate: boolean;
  percent: number;
  wordsRemaining: number;
};

export function formatProfileMetadata({
  traits,
  diaryEntryCount,
  completedInterviewCount,
  totalWordCount,
}: {
  traits: PersonaTraits;
  diaryEntryCount: number;
  completedInterviewCount: number;
  totalWordCount: number;
}): string {
  return `Based on ${formatCount(diaryEntryCount, "diary story", "diary stories")} and ${formatCount(completedInterviewCount, "guided interview", "guided interviews")} (${formatApproximateStoryTime(totalWordCount)} of story content). Last updated ${formatProfileDate(traits.computed_at)}.`;
}

export function formatApproximateStoryTime(wordCount: number): string {
  const normalizedWords = Math.max(0, wordCount);

  if (normalizedWords === 0) {
    return "0 min";
  }

  const seconds = (normalizedWords / SPOKEN_WORDS_PER_MINUTE) * 60;

  if (seconds < 60) {
    const roundedSeconds = Math.max(
      15,
      Math.min(45, Math.round(seconds / 15) * 15),
    );
    return `about ${roundedSeconds} sec`;
  }

  return `about ${Math.max(1, Math.round(seconds / 60))} min`;
}

export function formatDominantValue(value: string): string {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

export function getProfileProgress({
  totalWordCount,
  minimumWordCount = MINIMUM_PROFILE_WORDS,
}: {
  totalWordCount: number;
  minimumWordCount?: number;
}): ProfileProgress {
  const normalizedWords = Math.max(0, totalWordCount);
  const normalizedMinimum = Math.max(1, minimumWordCount);

  return {
    canGenerate: normalizedWords >= normalizedMinimum,
    percent: Math.min(
      100,
      Math.round((normalizedWords / normalizedMinimum) * 100),
    ),
    wordsRemaining: Math.max(0, normalizedMinimum - normalizedWords),
  };
}

function formatProfileDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
