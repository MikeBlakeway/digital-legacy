'use client'

import { useState } from 'react'

type MediaAttachmentProps = {
  id: string
  url: string
  caption: string
}

export default function MediaAttachment({
  id,
  url,
  caption
}: MediaAttachmentProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        onClick={() => setIsLightboxOpen(true)}
        className='w-full max-w-[320px] shrink-0 overflow-hidden rounded-md border border-stone-200 bg-white text-left dark:border-zinc-700 dark:bg-zinc-900'
      >
        <img
          src={url}
          alt={caption}
          className='h-44 w-full object-cover'
          loading='lazy'
        />
        <span className='line-clamp-2 block px-3 py-2 text-xs text-stone-600 dark:text-zinc-300'>
          {caption}
        </span>
      </button>

      {isLightboxOpen ? (
        <dialog
          open
          className='fixed inset-0 z-50 m-auto w-[min(90vw,920px)] rounded-lg border border-stone-300 bg-white p-4 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900'
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className='space-y-3'
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={url}
              alt={caption}
              className='max-h-[70vh] w-full rounded-md object-contain'
            />
            <p
              id={`media-caption-${id}`}
              className='text-sm text-stone-700 dark:text-zinc-200'
            >
              {caption}
            </p>
            <div className='flex justify-end'>
              <button
                type='button'
                onClick={() => setIsLightboxOpen(false)}
                className='rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
