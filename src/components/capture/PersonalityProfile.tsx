import Link from "next/link";

import TraitInferenceButton from "@/components/capture/TraitInferenceButton";
import {
  MINIMUM_PROFILE_WORDS,
  formatApproximateStoryTime,
  formatDominantValue,
  formatProfileMetadata,
  getProfileProgress,
  type ProfileProgress,
} from "@/components/capture/personality-profile-utils";
import type { PersonaTraits } from "@/lib/supabase/traits";

export {
  MINIMUM_PROFILE_WORDS,
  formatApproximateStoryTime,
  formatDominantValue,
  formatProfileMetadata,
  getProfileProgress,
};

export type PersonalityProfileProps = {
  personaSlug: string;
  traits: PersonaTraits | null;
  diaryEntryCount: number;
  completedInterviewCount: number;
  totalWordCount: number;
};

export default function PersonalityProfile({
  personaSlug,
  traits,
  diaryEntryCount,
  completedInterviewCount,
  totalWordCount,
}: PersonalityProfileProps) {
  const progress = getProfileProgress({ totalWordCount });

  if (!traits) {
    return (
      <section className="space-y-6" aria-labelledby="profile-heading">
        <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1
            id="profile-heading"
            className="text-3xl font-semibold tracking-normal text-stone-950 dark:text-zinc-50 sm:text-4xl"
          >
            Personality profile
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700 dark:text-zinc-300">
            Record a diary story or complete a guided interview to start
            shaping your profile.
          </p>
        </div>

        <ContentProgress
          diaryEntryCount={diaryEntryCount}
          completedInterviewCount={completedInterviewCount}
          totalWordCount={totalWordCount}
          progress={progress}
        />

        <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <TraitInferenceButton
            personaSlug={personaSlug}
            actionLabel="Generate profile"
            disabled={!progress.canGenerate}
            disabledMessage={
              progress.canGenerate
                ? undefined
                : `Add ${formatApproximateStoryTime(
                    progress.wordsRemaining,
                  )} of story content before generating your profile.`
            }
            successMessage="Profile generated."
          />
          {!progress.canGenerate ? (
            <div className="mt-5 flex flex-col gap-2 text-sm text-stone-600 dark:text-zinc-300 sm:flex-row">
              <Link
                href={`/capture/${personaSlug}/diary/new`}
                className="font-medium text-stone-900 hover:text-stone-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                Add a diary story
              </Link>
              <span className="hidden text-stone-300 dark:text-zinc-700 sm:inline">
                /
              </span>
              <Link
                href={`/capture/${personaSlug}/interview`}
                className="font-medium text-stone-900 hover:text-stone-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                Complete a guided interview
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="profile-heading">
      <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1
              id="profile-heading"
              className="text-3xl font-semibold tracking-normal text-stone-950 dark:text-zinc-50 sm:text-4xl"
            >
              Personality profile
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-800 dark:text-zinc-200">
              {traits.summary_prose}
            </p>
          </div>
          <TraitInferenceButton
            personaSlug={personaSlug}
            successMessage="Profile refreshed."
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-stone-950 dark:text-zinc-50">
            Dominant values
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {traits.dominant_values.map((value) => (
              <span
                key={value}
                className="rounded-md border border-stone-300 bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {formatDominantValue(value)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-stone-950 dark:text-zinc-50">
            Profile basis
          </h2>
          <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-zinc-300">
            {formatProfileMetadata({
              traits,
              diaryEntryCount,
              completedInterviewCount,
              totalWordCount,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

function ContentProgress({
  diaryEntryCount,
  completedInterviewCount,
  totalWordCount,
  progress,
}: {
  diaryEntryCount: number;
  completedInterviewCount: number;
  totalWordCount: number;
  progress: ProfileProgress;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-4 sm:grid-cols-3">
        <ProgressMetric label="Diary stories" value={diaryEntryCount} />
        <ProgressMetric
          label="Interviews complete"
          value={completedInterviewCount}
        />
        <ProgressMetric
          label="Story time"
          value={formatApproximateStoryTime(totalWordCount)}
        />
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-stone-600 dark:text-zinc-300">
          <span>Profile readiness</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-stone-900 dark:bg-zinc-100"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-stone-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
