import {
  formatApproximateStoryTime,
} from "@/components/capture/personality-profile-utils";
import { EMOTION_OPTIONS } from "@/lib/capture/emotions";
import type { DiaryEntryListItem } from "@/lib/supabase/diary";

type DiaryEntryListProps = {
  entries: DiaryEntryListItem[];
};

export default function DiaryEntryList({ entries }: DiaryEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        No diary stories yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {entries.map((entry) => {
        const emotion = EMOTION_OPTIONS.find(
          (option) => option.label === entry.emotion_label,
        );

        return (
          <article key={entry.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
              <span>
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.created_at))}
              </span>
              {emotion ? (
                <span>
                  <span aria-hidden="true">{emotion.emoji}</span> {emotion.display}
                </span>
              ) : null}
              {entry.has_voice ? <span>Voice</span> : null}
              {entry.word_count ? (
                <span>{formatApproximateStoryTime(entry.word_count)}</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-800 dark:text-zinc-100">
              {entry.preview}
            </p>
          </article>
        );
      })}
    </div>
  );
}
