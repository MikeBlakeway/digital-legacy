'use client'

import { useEffect, useRef, useState } from 'react'

import type { EmotionLabel } from '@/lib/capture/emotions'
import type { EmotionUpdate } from '@/lib/supabase/diary'
import EmotionSelector from '@/components/capture/diary/EmotionSelector'

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'
type VoiceUploadKeyPrefix = 'diary' | 'interview' | 'voice-samples'

export type RecordingCompletePayload = {
  voice_b2_key: string
  duration_seconds: number
  emotion_updates: EmotionUpdate[]
  emotion_label?: EmotionLabel
}

type DiaryVoiceRecorderProps = {
  personaSlug: string
  initialEmotion: EmotionLabel | null
  uploadKeyPrefix?: VoiceUploadKeyPrefix
  uploadOnStop?: boolean
  uploadButtonLabel?: string
  microphoneErrorMessage?: string
  readyMessage?: string
  onRecordingComplete: (payload: RecordingCompletePayload) => void
}

type UploadResponse = {
  upload_url: string
  b2_key: string
}

export default function DiaryVoiceRecorder({
  personaSlug,
  initialEmotion,
  uploadKeyPrefix = 'diary',
  uploadOnStop = true,
  uploadButtonLabel = 'Upload recording',
  microphoneErrorMessage = 'Microphone access is required to record a diary story.',
  readyMessage = 'Recording ready to save.',
  onRecordingComplete
}: DiaryVoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<EmotionLabel | null>(
    initialEmotion
  )
  const [showEmotionSelector, setShowEmotionSelector] = useState(false)
  const [emotionUpdates, setEmotionUpdates] = useState<EmotionUpdate[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const pendingBlobRef = useRef<Blob | null>(null)
  const durationRef = useRef(0)
  const uploadedDurationRef = useRef(0)
  const emotionUpdatesRef = useRef<EmotionUpdate[]>([])
  const currentEmotionRef = useRef<EmotionLabel | null>(initialEmotion)

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (recordingState !== 'recording') {
      return
    }

    const interval = window.setInterval(() => {
      setDurationSeconds((current) => {
        const next = current + 1
        durationRef.current = next
        return next
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [recordingState])

  useEffect(() => {
    emotionUpdatesRef.current = emotionUpdates
  }, [emotionUpdates])

  useEffect(() => {
    currentEmotionRef.current = currentEmotion
  }, [currentEmotion])

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      stopStream()
    }
  }, [audioUrl])

  async function startRecording() {
    setErrorMessage(null)
    setUploadState('idle')
    setAudioUrl(null)
    setEmotionUpdates([])
    pendingBlobRef.current = null
    uploadedDurationRef.current = 0
    durationRef.current = 0
    setDurationSeconds(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stopStream()
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        })
        pendingBlobRef.current = blob
        const nextAudioUrl = URL.createObjectURL(blob)
        setAudioUrl(nextAudioUrl)

        if (uploadOnStop) {
          void uploadRecording(blob, Math.max(durationRef.current, 1))
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingState('recording')
    } catch {
      setErrorMessage(microphoneErrorMessage)
      setRecordingState('idle')
    }
  }

  function pauseRecording() {
    mediaRecorderRef.current?.pause()
    setRecordingState('paused')
  }

  function resumeRecording() {
    mediaRecorderRef.current?.resume()
    setRecordingState('recording')
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecordingState('stopped')
  }

  function retagEmotion(nextEmotion: EmotionLabel) {
    setCurrentEmotion(nextEmotion)
    setEmotionUpdates((current) => [
      ...current,
      {
        timestamp_seconds: durationRef.current,
        emotion_label: nextEmotion
      }
    ])
    setShowEmotionSelector(false)
  }

  async function uploadRecording(blob: Blob, duration: number) {
    setUploadState('uploading')
    uploadedDurationRef.current = duration

    try {
      const contentType = blob.type || 'audio/webm'
      const uploadResponse = await fetch('/api/upload/voice-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          persona_slug: personaSlug,
          content_type: contentType,
          content_length: blob.size,
          key_prefix: uploadKeyPrefix
        })
      })
      const uploadPayload: unknown = await uploadResponse
        .json()
        .catch(() => null)

      if (!uploadResponse.ok || !isUploadResponse(uploadPayload)) {
        throw new Error('Failed to prepare voice upload.')
      }

      const b2Response = await fetch(uploadPayload.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType
        },
        body: blob
      })

      if (!b2Response.ok) {
        throw new Error('Failed to upload voice recording.')
      }

      setUploadState('done')
      pendingBlobRef.current = null
      onRecordingComplete({
        voice_b2_key: uploadPayload.b2_key,
        duration_seconds: duration,
        emotion_updates: emotionUpdatesRef.current,
        ...(currentEmotionRef.current
          ? { emotion_label: currentEmotionRef.current }
          : {})
      })
    } catch {
      setUploadState('error')
      setErrorMessage('The recording could not be uploaded.')
    }
  }

  return (
    <div className='space-y-4 rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <button
          type='button'
          onClick={() => setShowEmotionSelector((current) => !current)}
          className='rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          Current emotion: {currentEmotion ?? 'Not tagged'}
        </button>
        <span className='font-mono text-sm text-stone-600 dark:text-zinc-300'>
          {formatDuration(durationSeconds)}
        </span>
      </div>

      {showEmotionSelector ? (
        <EmotionSelector
          selectedEmotion={currentEmotion}
          onSelect={retagEmotion}
          compact
        />
      ) : null}

      <div className='flex flex-wrap gap-2'>
        {recordingState === 'idle' ? (
          <button
            type='button'
            onClick={startRecording}
            className='rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300'
          >
            Record
          </button>
        ) : null}

        {recordingState === 'recording' ? (
          <button
            type='button'
            onClick={pauseRecording}
            className='rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800'
          >
            Pause
          </button>
        ) : null}

        {recordingState === 'paused' ? (
          <button
            type='button'
            onClick={resumeRecording}
            className='rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800'
          >
            Resume
          </button>
        ) : null}

        {recordingState === 'recording' || recordingState === 'paused' ? (
          <button
            type='button'
            onClick={stopRecording}
            className='rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300'
          >
            Stop
          </button>
        ) : null}
      </div>

      {audioUrl ? (
        <audio controls src={audioUrl} className='w-full'>
          <track kind='captions' />
        </audio>
      ) : null}

      {!uploadOnStop && audioUrl && uploadState !== 'done' ? (
        <button
          type='button'
          disabled={
            uploadState === 'uploading' || pendingBlobRef.current === null
          }
          onClick={() => {
            const blob = pendingBlobRef.current

            if (!blob) {
              return
            }

            void uploadRecording(blob, Math.max(durationRef.current, 1))
          }}
          className='rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400'
        >
          {uploadState === 'uploading' ? 'Uploading...' : uploadButtonLabel}
        </button>
      ) : null}

      {uploadState === 'uploading' ? (
        <p className='text-sm text-stone-600 dark:text-zinc-300'>
          Uploading...
        </p>
      ) : null}
      {uploadState === 'done' ? (
        <p className='text-sm text-stone-600 dark:text-zinc-300'>
          {readyMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className='text-sm text-red-700 dark:text-red-300' role='alert'>
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

function getSupportedMimeType(): string | undefined {
  if (
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ) {
    return 'audio/webm;codecs=opus'
  }

  if (
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('audio/webm')
  ) {
    return 'audio/webm'
  }

  return undefined
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function isUploadResponse(value: unknown): value is UploadResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'upload_url' in value &&
    'b2_key' in value &&
    typeof value.upload_url === 'string' &&
    typeof value.b2_key === 'string'
  )
}
