'use client'

import AudioPlayer from '@/components/conversation/AudioPlayer'
import MediaAttachment from '@/components/conversation/MediaAttachment'

export type ChatMediaAsset = {
  id: string
  url: string
  caption: string
}

export type ChatMessageRecord = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  media_assets: ChatMediaAsset[]
  audio_url?: string
}

type ChatMessageProps = {
  message: ChatMessageRecord
  personaName: string
}

export default function ChatMessage({
  message,
  personaName
}: ChatMessageProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <article
      className={isAssistant ? 'flex justify-start' : 'flex justify-end'}
    >
      <div className='max-w-[min(42rem,92%)] space-y-2'>
        {isAssistant ? (
          <p className='text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400'>
            {personaName}
          </p>
        ) : null}

        <div
          className={[
            'rounded-lg px-4 py-3 text-sm leading-6',
            isAssistant
              ? 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-zinc-100'
              : 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
          ].join(' ')}
        >
          {message.content}
        </div>

        {message.media_assets.length > 0 ? (
          <div className='flex gap-3 overflow-x-auto pb-1'>
            {message.media_assets.map((asset) => (
              <MediaAttachment
                key={asset.id}
                id={asset.id}
                url={asset.url}
                caption={asset.caption}
              />
            ))}
          </div>
        ) : null}

        {isAssistant && message.audio_url ? (
          <AudioPlayer src={message.audio_url} />
        ) : null}

        <div className='flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400'>
          <span>
            {new Intl.DateTimeFormat('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(message.created_at))}
          </span>

          {isAssistant && message.audio_url ? (
            <span className='inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200'>
              <span aria-hidden='true'>🔊</span>
              <span>Voice</span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}
