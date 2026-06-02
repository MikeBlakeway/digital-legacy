import { EMOTION_OPTIONS, type EmotionLabel } from '@/lib/capture/emotions'

type EmotionalCoverageGridProps = {
  coverage: Record<EmotionLabel, number>
  metric: 'recordings' | 'minutes'
}

export default function EmotionalCoverageGrid({
  coverage,
  metric
}: EmotionalCoverageGridProps) {
  const maxValue = Math.max(...Object.values(coverage), 0)

  return (
    <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
      {EMOTION_OPTIONS.map((emotion) => {
        const value = coverage[emotion.label] ?? 0
        const emphasis = maxValue > 0 ? value / maxValue : 0

        return (
          <div
            key={emotion.label}
            title={formatTooltip(value, metric)}
            className={coverageClassName(value, emphasis)}
          >
            <span aria-hidden='true'>{emotion.emoji}</span>{' '}
            <span className='text-sm font-medium'>{emotion.display}</span>
            <span className='mt-1 block text-xs'>
              {formatValue(value, metric)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function coverageClassName(value: number, emphasis: number): string {
  if (value <= 0) {
    return 'rounded-md border border-stone-200 bg-stone-50 p-3 text-stone-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600'
  }

  if (emphasis >= 0.66) {
    return 'rounded-md border border-stone-300 bg-stone-100 p-3 text-stone-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
  }

  return 'rounded-md border border-stone-200 bg-white p-3 text-stone-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
}

function formatValue(value: number, metric: 'recordings' | 'minutes'): string {
  if (metric === 'recordings') {
    return `${Math.round(value)} recordings`
  }

  if (value <= 0) {
    return '0 minutes'
  }

  const minutes = value / 60

  if (minutes < 1) {
    return '<1 minute'
  }

  const rounded = Math.round(minutes * 10) / 10
  return `${rounded} minute${rounded === 1 ? '' : 's'}`
}

function formatTooltip(
  value: number,
  metric: 'recordings' | 'minutes'
): string {
  if (metric === 'recordings') {
    const rounded = Math.round(value)
    return `${rounded} recording${rounded === 1 ? '' : 's'}`
  }

  const minutes = Math.round((value / 60) * 10) / 10
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
