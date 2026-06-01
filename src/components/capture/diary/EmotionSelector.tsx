"use client";

import {
  EMOTION_OPTIONS,
  type EmotionLabel,
} from "@/lib/capture/emotions";

type EmotionSelectorProps = {
  selectedEmotion: EmotionLabel | null;
  onSelect: (emotion: EmotionLabel) => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function EmotionSelector({
  selectedEmotion,
  onSelect,
  disabled = false,
  compact = false,
}: EmotionSelectorProps) {
  return (
    <div className="space-y-4">
      {!compact ? (
        <div>
          <h2 className="text-xl font-semibold text-stone-950 dark:text-zinc-50">
            How are you feeling right now?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300">
            This helps capture the full range of your voice over time.
          </p>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {EMOTION_OPTIONS.map((option) => {
          const isSelected = option.label === selectedEmotion;

          return (
            <button
              key={option.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.label)}
              className={[
                "rounded-md border px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed",
                isSelected
                  ? "border-stone-900 bg-stone-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <span className="block text-lg" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="mt-1 block font-medium">{option.display}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
