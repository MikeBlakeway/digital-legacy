type InterviewProgressProps = {
  turnCount: number;
  completed: boolean;
};

const TARGET_TURNS = 10;

export default function InterviewProgress({
  turnCount,
  completed,
}: InterviewProgressProps) {
  const progress = Math.min(turnCount, TARGET_TURNS);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-stone-600 dark:text-zinc-300">
        <span>{completed ? "Complete" : "In progress"}</span>
        <span>
          {progress}/{TARGET_TURNS} turns
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-stone-900 transition-all dark:bg-zinc-100"
          style={{ width: `${(progress / TARGET_TURNS) * 100}%` }}
        />
      </div>
    </div>
  );
}
