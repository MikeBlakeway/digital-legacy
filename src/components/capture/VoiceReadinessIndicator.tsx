const TARGET_DURATION_SECONDS = 1800

type VoiceReadinessIndicatorProps = {
  totalDurationSeconds: number
}

export default function VoiceReadinessIndicator({
  totalDurationSeconds
}: VoiceReadinessIndicatorProps) {
  const progress = Math.min(totalDurationSeconds / TARGET_DURATION_SECONDS, 1)

  return (
    <section className='rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-sm font-medium text-stone-700 dark:text-zinc-200'>
            Voice readiness
          </h2>
          <p className='mt-2 text-3xl font-semibold text-stone-950 dark:text-zinc-50'>
            {formatMinutes(totalDurationSeconds)} / 30 min
          </p>
        </div>
        <p className='max-w-xs text-right text-sm text-stone-600 dark:text-zinc-300'>
          {readinessCopy(totalDurationSeconds)}
        </p>
      </div>

      <div className='mt-5 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800'>
        <div
          className='h-full rounded-full bg-stone-900 transition-[width] dark:bg-zinc-100'
          style={{ width: `${Math.max(progress * 100, 4)}%` }}
        />
      </div>
    </section>
  )
}

function readinessCopy(totalDurationSeconds: number): string {
  if (totalDurationSeconds < 600) {
    return 'Keep going — more voice improves quality.'
  }

  if (totalDurationSeconds < TARGET_DURATION_SECONDS) {
    return 'Good progress — aim for 30 minutes total.'
  }

  return 'Voice reference ready.'
}

function formatMinutes(totalDurationSeconds: number): string {
  const minutes = totalDurationSeconds / 60
  const rounded = Math.round(minutes * 10) / 10
  return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded)
}
