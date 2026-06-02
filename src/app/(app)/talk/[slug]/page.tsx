import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import ChatWindow from '@/components/conversation/ChatWindow'
import {
  createConversation,
  getLatestConversation,
  listConversationMessages,
  type ConversationMessage
} from '@/lib/supabase/conversations'
import { getPersonaBySlug, type Persona } from '@/lib/supabase/personas'
import {
  createClient as createServerClient,
  createServiceRoleClient
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type TalkPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function TalkPage({ params }: TalkPageProps) {
  const { slug } = await params
  const access = await getAccessiblePersona(slug)

  if ('response' in access) {
    return access.response
  }

  const serviceClient = createServiceRoleClient()
  const latestConversation = await getLatestConversation(serviceClient, {
    personaId: access.persona.id,
    userId: access.userId
  })
  const conversation =
    latestConversation ??
    (await createConversation(serviceClient, {
      personaId: access.persona.id,
      userId: access.userId
    }))
  const initialMessages = await listConversationMessages(
    serviceClient,
    conversation.id
  )

  return (
    <main className='flex flex-1 bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50'>
      <section className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-sm text-stone-500 dark:text-zinc-400'>
              Conversation
            </p>
            <h1 className='mt-2 text-3xl font-semibold tracking-normal sm:text-4xl'>
              Talk with {access.persona.name}
            </h1>
          </div>
          <Link
            href='/'
            className='text-sm text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          >
            Home
          </Link>
        </div>

        <ChatWindow
          personaSlug={access.persona.slug}
          personaName={access.persona.name}
          conversationId={conversation.id}
          initialMessages={toChatMessages(initialMessages)}
        />
      </section>
    </main>
  )
}

async function getAccessiblePersona(slug: string): Promise<
  | { persona: Persona; userId: string }
  | {
      response: never
    }
> {
  const supabase = await createServerClient()
  const claimsResult = await supabase.auth.getClaims()
  const userId = readUserId(claimsResult.data?.claims)

  if (claimsResult.error || !userId) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/talk/${slug}`)}`)
  }

  const serviceClient = createServiceRoleClient()
  const persona = await getPersonaBySlug(serviceClient, slug)

  if (!persona) {
    notFound()
  }

  if (persona.owner_user_id === userId) {
    return { persona, userId }
  }

  const accessResult = await serviceClient
    .from('persona_access')
    .select('persona_id')
    .eq('persona_id', persona.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (accessResult.error || !accessResult.data) {
    notFound()
  }

  return { persona, userId }
}

function toChatMessages(messages: ConversationMessage[]) {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    created_at: message.created_at,
    media_assets: [] as {
      id: string
      url: string
      caption: string
    }[]
  }))
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
