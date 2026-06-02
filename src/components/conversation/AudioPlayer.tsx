'use client'

import { useEffect, useRef, useState } from 'react'

type AudioPlayerProps = {
  src: string | null
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  useEffect(() => {
    if (!src || !audioRef.current) {
      return
    }

    const audio = audioRef.current
    setIsLoading(true)
    setAutoplayBlocked(false)
    audio.src = src

    void audio
      .play()
      .then(() => {
        setAutoplayBlocked(false)
      })
      .catch(() => {
        setAutoplayBlocked(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [src])

  if (!src) {
    return null
  }

  return (
    <div className='space-y-3 rounded-lg border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900'>
      <audio ref={audioRef} controls className='w-full' preload='auto' />

      {isLoading ? (
        <div className='flex items-center gap-1.5' aria-label='Audio loading'>
          <span className='h-2 w-2 animate-pulse rounded-full bg-stone-500 dark:bg-zinc-300' />
          <span
            className='h-2 w-2 animate-pulse rounded-full bg-stone-500 dark:bg-zinc-300'
            style={{ animationDelay: '120ms' }}
          />
          <span
            className='h-2 w-2 animate-pulse rounded-full bg-stone-500 dark:bg-zinc-300'
            style={{ animationDelay: '240ms' }}
          />
        </div>
      ) : null}

      {autoplayBlocked ? (
        <button
          type='button'
          onClick={() => {
            if (!audioRef.current) {
              return
            }

            void audioRef.current.play().then(() => setAutoplayBlocked(false))
          }}
          className='rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          Play audio
        </button>
      ) : null}
    </div>
  )
}
