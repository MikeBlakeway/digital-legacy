'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import DiaryVoiceRecorder, {
  type RecordingCompletePayload
} from '@/components/capture/diary/DiaryVoiceRecorder'
import EmotionSelector from '@/components/capture/diary/EmotionSelector'
import type { EmotionLabel } from '@/lib/capture/emotions'

type VoiceRecorderProps = {
  personaSlug: string
}

export default function VoiceRecorder({ personaSlug }: VoiceRecorderProps) {
  const router = useRouter()
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [recorderInstance, setRecorderInstance] = useState(0)

  async function handleRecordingComplete(payload: RecordingCompletePayload) {
    if (!payload.emotion_label) {
      setErrorMessage('Choose an emotion before uploading the recording.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(
        `/api/personas/${personaSlug}/voice-samples`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            b2_key: payload.voice_b2_key,
            duration_seconds: payload.duration_seconds,
            emotion_label: payload.emotion_label
          })
        }
      )

      if (!response.ok) {
        throw new Error('Voice sample save failed.')
      }

      setSuccessMessage(
        `Sample saved. ${formatDuration(payload.duration_seconds)} contributed.`
      )
      setSelectedEmotion(null)
      setRecorderInstance((current) => current + 1)
      router.refresh()
    } catch {
      setErrorMessage('The voice sample could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className='space-y-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8'>
      <div>
        <h2 className='text-xl font-semibold text-stone-950 dark:text-zinc-50'>
          Record a clean sample
        </h2>
        <p className='mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-300'>
          Choose the emotional tone first, then record a single uninterrupted
          sample. Clean recordings make the cloned voice more reliable.
        </p>
      </div>

      <EmotionSelector
        selectedEmotion={selectedEmotion}
        onSelect={setSelectedEmotion}
        disabled={isSaving}
      />

      <div
        className={
          selectedEmotion
            ? 'space-y-4'
            : 'pointer-events-none space-y-4 opacity-45'
        }
        aria-disabled={!selectedEmotion}
      >
        <DiaryVoiceRecorder
          key={`${recorderInstance}-${selectedEmotion ?? 'none'}`}
          personaSlug={personaSlug}
          initialEmotion={selectedEmotion}
          uploadKeyPrefix='voice-samples'
          uploadOnStop={false}
          uploadButtonLabel='Upload sample'
          readyMessage='Sample uploaded and ready to save.'
          microphoneErrorMessage='Microphone access is required to record a voice sample.'
          onRecordingComplete={handleRecordingComplete}
        />
      </div>

      {!selectedEmotion ? (
        <p className='text-sm text-stone-500 dark:text-zinc-400'>
          Choose an emotion to enable recording.
        </p>
      ) : null}

      {isSaving ? (
        <p className='text-sm text-stone-600 dark:text-zinc-300'>
          Saving sample...
        </p>
      ) : null}

      {successMessage ? (
        <div className='flex flex-col gap-3 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 sm:flex-row sm:items-center sm:justify-between'>
          <span>{successMessage}</span>
          <button
            type='button'
            onClick={() => {
              setSuccessMessage(null)
              setRecorderInstance((current) => current + 1)
            }}
            className='rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800'
          >
            Record another
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className='text-sm text-red-700 dark:text-red-300' role='alert'>
          {errorMessage}
        </p>
      ) : null}
    </section>
  )
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)

  if (minutes === 0) {
    return `${seconds} sec`
  }

  return `${minutes} min ${String(seconds).padStart(2, '0')} sec`
}
