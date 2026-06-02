'use client'

import { useEffect, useRef } from 'react'

type ChatInputProps = {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

const MAX_ROWS = 4

export default function ChatInput({
  value,
  disabled,
  onChange,
  onSubmit
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const computed = window.getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(computed.lineHeight || '24') || 24
    const maxHeight = lineHeight * MAX_ROWS
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value])

  return (
    <div className='rounded-lg border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900'>
      <div className='flex items-end gap-3'>
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder='Type a message...'
          className='min-h-10 flex-1 resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-900 outline-none focus:border-stone-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
        />
        <button
          type='button'
          disabled={disabled || value.trim().length === 0}
          onClick={onSubmit}
          className='rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500'
        >
          Send
        </button>
      </div>
      <p className='mt-2 text-xs text-stone-500 dark:text-zinc-400'>
        Enter to send, Shift+Enter for a new line.
      </p>
    </div>
  )
}
