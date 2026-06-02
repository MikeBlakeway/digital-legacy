'use client'

import { useRef, useState } from 'react'

type VoiceModeToggleProps = {
  personaSlug: string
  disabled: boolean
  isVoiceMode: boolean
  onModeChange: (isVoiceMode: boolean) => void
  onTranscript: (transcript: string) => void
}

export default function VoiceModeToggle({
  personaSlug,
  disabled,
  isVoiceMode,
  onModeChange,
  onTranscript
}: VoiceModeToggleProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const touchRecordingRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  const isBusy = disabled || isTranscribing

  function resetTouchState() {
    touchRecordingRef.current = false
    // prevent the synthetic click after pointer events on touch devices
    suppressNextClickRef.current = true
    window.setTimeout(() => {
      suppressNextClickRef.current = false
    }, 350)
  }

  async function startRecording() {
    if (isBusy || isRecording) {
      return
    }

    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream, {
        mimeType: getSupportedMimeType() ?? undefined
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        })

        void transcribeBlob(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setErrorMessage('Microphone access is required for voice mode.')
    }
  }

  function stopRecording() {
    if (!isRecording) {
      return
    }

    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcribeBlob(blob: Blob) {
    setIsTranscribing(true)

    try {
      const audioBase64 = await blobToBase64(blob)
      const response = await fetch(`/api/personas/${personaSlug}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_base64: audioBase64
        })
      })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok || !isTranscribeResponse(payload)) {
        throw new Error('Transcription failed.')
      }

      const transcript = payload.transcript.trim()

      if (!transcript) {
        throw new Error('Transcription was empty.')
      }

      onTranscript(transcript)
    } catch {
      setErrorMessage('Voice transcription failed. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          disabled={isBusy}
          onClick={() => onModeChange(!isVoiceMode)}
          className='rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:disabled:bg-zinc-900'
        >
          {isVoiceMode ? 'Keyboard mode' : 'Voice mode'}
        </button>

        {isVoiceMode ? (
          <button
            type='button'
            disabled={isBusy}
            onClick={() => {
              if (suppressNextClickRef.current) {
                return
              }

              if (isRecording) {
                stopRecording()
              } else {
                void startRecording()
              }
            }}
            onPointerDown={(event) => {
              if (event.pointerType === 'touch') {
                touchRecordingRef.current = true
                event.preventDefault()
                void startRecording()
              }
            }}
            onPointerUp={(event) => {
              if (event.pointerType === 'touch' && touchRecordingRef.current) {
                event.preventDefault()
                resetTouchState()
                stopRecording()
              }
            }}
            onPointerCancel={(event) => {
              if (event.pointerType === 'touch' && touchRecordingRef.current) {
                event.preventDefault()
                resetTouchState()
                stopRecording()
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'touch' && touchRecordingRef.current) {
                event.preventDefault()
                resetTouchState()
                stopRecording()
              }
            }}
            className='rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500'
          >
            {isRecording ? 'Stop recording' : 'Start recording'}
          </button>
        ) : null}
      </div>

      {isVoiceMode ? (
        <p className='text-xs text-stone-500 dark:text-zinc-400'>
          Mobile: hold to record, release to transcribe. Desktop: tap to start
          and stop.
        </p>
      ) : null}

      {isTranscribing ? (
        <p className='text-sm text-stone-600 dark:text-zinc-300'>
          Transcribing...
        </p>
      ) : null}

      {errorMessage ? (
        <p className='text-sm text-red-700 dark:text-red-300'>{errorMessage}</p>
      ) : null}
    </div>
  )
}

function getSupportedMimeType(): string | null {
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

  return null
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to encode audio.'))
        return
      }

      const payload = reader.result.split(',')[1]

      if (!payload) {
        reject(new Error('Failed to encode audio.'))
        return
      }

      resolve(payload)
    }

    reader.onerror = () => reject(new Error('Failed to encode audio.'))
    reader.readAsDataURL(blob)
  })
}

function isTranscribeResponse(
  value: unknown
): value is { transcript: string; duration_seconds: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'transcript' in value &&
    'duration_seconds' in value &&
    typeof value.transcript === 'string' &&
    typeof value.duration_seconds === 'number'
  )
}
