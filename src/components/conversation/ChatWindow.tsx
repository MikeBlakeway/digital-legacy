'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import ChatInput from '@/components/conversation/ChatInput'
import ChatMessage, {
  type ChatMessageRecord
} from '@/components/conversation/ChatMessage'

type ChatWindowProps = {
  personaSlug: string
  personaName: string
  conversationId: string
  initialMessages: ChatMessageRecord[]
}

type ChatResponse = {
  message: string
  conversation_id: string
  media_assets?: {
    id: string
    url: string
    caption: string
  }[]
}

export default function ChatWindow({
  personaSlug,
  personaName,
  conversationId,
  initialMessages
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSubmitting])

  async function submitMessage() {
    const trimmed = inputValue.trim()

    if (!trimmed || isSubmitting) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    setInputValue('')

    const optimisticMessage: ChatMessageRecord = {
      id: `temp-user-${crypto.randomUUID()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
      media_assets: []
    }

    setMessages((current) => [...current, optimisticMessage])

    try {
      const response = await fetch(`/api/personas/${personaSlug}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: currentConversationId,
          mode: 'text'
        })
      })
      const payload: unknown = await response.json().catch(() => null)

      if (response.status === 503) {
        setErrorMessage(
          'This persona is unavailable right now — please try again in a moment.'
        )
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticMessage.id)
        )
        return
      }

      if (!response.ok || !isChatResponse(payload)) {
        setErrorMessage('The message could not be sent.')
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticMessage.id)
        )
        return
      }

      setCurrentConversationId(payload.conversation_id)
      setMessages((current) => [
        ...current,
        {
          id: `temp-assistant-${crypto.randomUUID()}`,
          role: 'assistant',
          content: payload.message,
          created_at: new Date().toISOString(),
          media_assets: payload.media_assets ?? []
        }
      ])
    } catch {
      setErrorMessage('The message could not be sent.')
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.content.trim().length > 0),
    [messages]
  )

  return (
    <section className='flex min-h-[70vh] flex-col rounded-lg border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
      <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
        {visibleMessages.length === 0 ? (
          <p className='text-sm text-stone-500 dark:text-zinc-400'>
            Say hello.
          </p>
        ) : (
          <div className='space-y-5'>
            {visibleMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                personaName={personaName}
              />
            ))}
          </div>
        )}

        {isSubmitting ? (
          <div className='mt-5 flex justify-start'>
            <div className='rounded-lg bg-stone-100 px-4 py-3 dark:bg-zinc-800'>
              <TypingIndicator />
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className='border-t border-stone-200 p-3 dark:border-zinc-800'>
        {errorMessage ? (
          <p className='mb-2 text-sm text-red-700 dark:text-red-300'>
            {errorMessage}
          </p>
        ) : null}
        <ChatInput
          value={inputValue}
          disabled={isSubmitting}
          onChange={setInputValue}
          onSubmit={submitMessage}
        />
      </div>
    </section>
  )
}

function TypingIndicator() {
  return (
    <div className='flex items-center gap-1.5' aria-label='Typing indicator'>
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
  )
}

function isChatResponse(value: unknown): value is ChatResponse {
  return (
    isRecord(value) &&
    typeof value.message === 'string' &&
    typeof value.conversation_id === 'string' &&
    (value.media_assets === undefined ||
      (Array.isArray(value.media_assets) &&
        value.media_assets.every(
          (asset) =>
            isRecord(asset) &&
            typeof asset.id === 'string' &&
            typeof asset.url === 'string' &&
            typeof asset.caption === 'string'
        )))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
