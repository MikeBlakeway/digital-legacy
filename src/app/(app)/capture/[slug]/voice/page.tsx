import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import EmotionalCoverageGrid from '@/components/capture/EmotionalCoverageGrid'
import VoiceReadinessIndicator from '@/components/capture/VoiceReadinessIndicator'
import VoiceRecorder from '@/components/capture/VoiceRecorder'
import { EMOTION_OPTIONS } from '@/lib/capture/emotions'
import { getPersonaBySlug, type Persona } from '@/lib/supabase/personas'
import {
  createClient as createServerClient,
  createServiceRoleClient
} from '@/lib/supabase/server'
import { getVoiceSampleOverview } from '@/lib/supabase/voice-samples'

export const dynamic = 'force-dynamic'

type VoicePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function VoicePage({ params }: VoicePageProps) {
  const { slug } = await params
  const persona = await getOwnedPersona(slug)
  const overview = await getVoiceSampleOverview(
    createServiceRoleClient(),
    persona.id
  )

  return (
    <main className='flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:px-10'>
        <div>
          <Link
            href={`/capture/${persona.slug}`}
            className='text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          >
            Back to capture dashboard
          </Link>
          <h1 className='mt-4 text-3xl font-semibold tracking-normal sm:text-4xl'>
            {persona.name} voice samples
          </h1>
          <p className='mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-zinc-300'>
            Capture clean recordings for voice cloning. Each sample is tagged
            with an emotion and added to the emotional voice library.
          </p>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
          <VoiceReadinessIndicator
            totalDurationSeconds={overview.total_duration_seconds}
          />

          <section className='rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
            <h2 className='text-sm font-medium text-stone-700 dark:text-zinc-200'>
              Emotional coverage
            </h2>
            <p className='mt-2 text-sm text-stone-600 dark:text-zinc-300'>
              This reflects the voice library accumulated across your labelled
              voice captures.
            </p>
            <div className='mt-4'>
              <EmotionalCoverageGrid
                coverage={overview.emotional_coverage}
                metric='minutes'
              />
            </div>
          </section>
        </div>

        <VoiceRecorder personaSlug={persona.slug} />

        <section className='rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-stone-950 dark:text-zinc-50'>
              Recent recordings
            </h2>
            <span className='text-sm text-stone-500 dark:text-zinc-400'>
              {overview.samples.length} total
            </span>
          </div>

          {overview.samples.length === 0 ? (
            <p className='mt-4 text-sm text-stone-600 dark:text-zinc-300'>
              No dedicated voice samples yet.
            </p>
          ) : (
            <ul className='mt-4 space-y-3'>
              {overview.samples.map((sample) => {
                const emotion = EMOTION_OPTIONS.find(
                  (option) => option.label === sample.emotion_label
                )

                return (
                  <li
                    key={sample.id}
                    className='rounded-md border border-stone-200 p-4 dark:border-zinc-800'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div>
                        <p className='text-sm font-medium text-stone-900 dark:text-zinc-100'>
                          {emotion
                            ? `${emotion.emoji} ${emotion.display}`
                            : 'Voice sample'}
                        </p>
                        <p className='mt-1 text-xs text-stone-500 dark:text-zinc-400'>
                          {formatDate(sample.created_at)}
                        </p>
                      </div>
                      <span className='text-sm text-stone-600 dark:text-zinc-300'>
                        {formatDuration(sample.duration_seconds)}
                      </span>
                    </div>

                    <p className='mt-3 text-sm leading-6 text-stone-600 dark:text-zinc-300'>
                      {sample.transcript?.trim() || 'Transcript pending.'}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

async function getOwnedPersona(slug: string): Promise<Persona> {
  const supabase = await createServerClient()
  const claimsResult = await supabase.auth.getClaims()
  const userId = readUserId(claimsResult.data?.claims)

  if (claimsResult.error || !userId) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(`/capture/${slug}/voice`)}`
    )
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug)

  if (!persona || persona.owner_user_id !== userId) {
    notFound()
  }

  return persona
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)

  if (minutes === 0) {
    return `${seconds} sec`
  }

  return `${minutes} min ${String(seconds).padStart(2, '0')} sec`
}

function readUserId(claims: unknown): string | null {
  if (!isRecord(claims) || typeof claims.sub !== 'string') {
    return null
  }

  return claims.sub
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
