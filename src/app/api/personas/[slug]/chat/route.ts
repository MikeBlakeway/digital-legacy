import { NextResponse, type NextRequest } from 'next/server'

import { inferPersona, type InferMessage } from '@/lib/ai/infer'
import { createPresignedDownloadUrl } from '@/lib/b2/client'
import { buildPersonaSystemPrompt } from '@/lib/persona-prompt'
import { retrieveMemoriesByEmbedding } from '@/lib/rag/retrieve'
import { embedText } from '@/lib/ai/embed'
import {
  createConversation,
  getConversationById,
  insertConversationMessage,
  listConversationMessages,
  touchConversation,
  type Conversation
} from '@/lib/supabase/conversations'
import { getPersonaBySlug, type Persona } from '@/lib/supabase/personas'
import {
  createClient as createServerClient,
  createServiceRoleClient
} from '@/lib/supabase/server'
import { getCurrentTraits } from '@/lib/supabase/traits'

const MEDIA_URL_EXPIRES_IN_SECONDS = 15 * 60
const MEMORY_MATCH_LIMIT = 8

type ChatRouteContext = {
  params: Promise<{
    slug: string
  }>
}

type ChatRequest = {
  message: string
  conversation_id: string | 'new'
  mode: 'text' | 'voice'
}

type ChatResponseMediaAsset = {
  id: string
  url: string
  caption: string
}

export async function POST(request: NextRequest, context: ChatRouteContext) {
  const access = await getAccessiblePersona(context)

  if ('response' in access) {
    return access.response
  }

  const parsed = await parseRequest(request)

  if ('fields' in parsed) {
    return NextResponse.json(
      { error: 'invalid_request', fields: parsed.fields },
      { status: 400 }
    )
  }

  const serviceClient = createServiceRoleClient()
  const conversationResult = await resolveConversation({
    client: serviceClient,
    persona: access.persona,
    userId: access.userId,
    conversationId: parsed.conversation_id
  })

  if ('response' in conversationResult) {
    return conversationResult.response
  }

  const conversation = conversationResult.conversation
  const history = await listConversationMessages(serviceClient, conversation.id)

  const userEmbedding = await embedText(parsed.message)
  const memories = await retrieveMemoriesByEmbedding({
    supabase: serviceClient,
    personaId: access.persona.id,
    embedding: userEmbedding,
    limit: MEMORY_MATCH_LIMIT,
    matchThreshold: 0
  })

  const memoryIds = memories.map((memory) => memory.id)
  const mediaAssets = await loadMediaAssets(serviceClient, memories)
  const traits = await getCurrentTraits(serviceClient, access.persona.id)
  const systemPrompt = buildPersonaSystemPrompt(
    access.persona,
    traits,
    memories
  )
  const inferMessages = toInferMessages(history, parsed.message)

  let assistantText: string

  try {
    const inferOutput = await inferPersona({
      system_prompt: systemPrompt,
      messages: inferMessages,
      max_tokens: 512,
      temperature: 0.7
    })

    assistantText = inferOutput.text.trim()
  } catch (error) {
    console.error('Chat inference failed.', error)
    return NextResponse.json(
      { error: 'inference_unavailable' },
      { status: 503 }
    )
  }

  if (!assistantText) {
    return NextResponse.json(
      { error: 'inference_unavailable' },
      { status: 503 }
    )
  }

  await insertConversationMessage(serviceClient, {
    conversationId: conversation.id,
    role: 'user',
    content: parsed.message,
    retrievedMemoryIds: []
  })

  await insertConversationMessage(serviceClient, {
    conversationId: conversation.id,
    role: 'assistant',
    content: assistantText,
    retrievedMemoryIds: memoryIds
  })

  await touchConversation(serviceClient, conversation.id)

  return NextResponse.json({
    message: assistantText,
    conversation_id: conversation.id,
    ...(mediaAssets.length > 0 ? { media_assets: mediaAssets } : {})
  })
}

async function resolveConversation({
  client,
  persona,
  userId,
  conversationId
}: {
  client: ReturnType<typeof createServiceRoleClient>
  persona: Persona
  userId: string
  conversationId: string | 'new'
}): Promise<{ conversation: Conversation } | { response: NextResponse }> {
  if (conversationId === 'new') {
    const conversation = await createConversation(client, {
      personaId: persona.id,
      userId
    })

    return { conversation }
  }

  const conversation = await getConversationById(client, conversationId)

  if (
    !conversation ||
    conversation.persona_id !== persona.id ||
    conversation.user_id !== userId
  ) {
    return {
      response: NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
  }

  return { conversation }
}

async function loadMediaAssets(
  client: ReturnType<typeof createServiceRoleClient>,
  memories: Array<{ media_asset_id: string | null }>
): Promise<ChatResponseMediaAsset[]> {
  const mediaAssetIds = Array.from(
    new Set(
      memories.flatMap((memory) =>
        memory.media_asset_id ? [memory.media_asset_id] : []
      )
    )
  )

  if (mediaAssetIds.length === 0) {
    return []
  }

  const result = await client
    .from('media_assets')
    .select('id, b2_key, caption')
    .in('id', mediaAssetIds)
    .not('caption', 'is', null)

  if (result.error) {
    console.error(
      'Failed to load media assets for chat response.',
      result.error
    )
    return []
  }

  const rows: unknown = result.data

  if (!Array.isArray(rows)) {
    return []
  }

  const assets = rows.filter(isMediaAssetRow).map(async (row) => ({
    id: row.id,
    url: await createPresignedDownloadUrl({
      key: row.b2_key,
      expiresInSeconds: MEDIA_URL_EXPIRES_IN_SECONDS
    }),
    caption: row.caption
  }))

  return Promise.all(assets)
}

async function getAccessiblePersona(
  context: ChatRouteContext
): Promise<{ persona: Persona; userId: string } | { response: NextResponse }> {
  const { slug } = await context.params
  const supabase = await createServerClient()
  const claimsResult = await supabase.auth.getClaims()
  const userId = readUserId(claimsResult.data?.claims)

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const serviceClient = createServiceRoleClient()
  const persona = await getPersonaBySlug(serviceClient, slug)

  if (!persona) {
    return {
      response: NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
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
    return {
      response: NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
  }

  return { persona, userId }
}

function toInferMessages(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  nextUserMessage: string
): InferMessage[] {
  const previousMessages = history
    .filter((message) => message.content.trim().length > 0)
    .map<InferMessage>((message) => ({
      role: message.role,
      content: message.content
    }))

  return [
    ...previousMessages,
    {
      role: 'user',
      content: nextUserMessage
    }
  ]
}

async function parseRequest(
  request: NextRequest
): Promise<ChatRequest | { fields: Record<string, string> }> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return { fields: { body: 'Request body must be valid JSON.' } }
  }

  if (!isRecord(body)) {
    return { fields: { body: 'Request body must be an object.' } }
  }

  const fields: Record<string, string> = {}
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const conversationIdRaw = body.conversation_id
  const mode = body.mode

  if (!message) {
    fields.message = 'Message is required.'
  }

  if (conversationIdRaw !== 'new' && typeof conversationIdRaw !== 'string') {
    fields.conversation_id = "Conversation id must be a string or 'new'."
  }

  if (mode !== 'text' && mode !== 'voice') {
    fields.mode = 'Mode must be text or voice.'
  }

  if (Object.keys(fields).length > 0) {
    return { fields }
  }

  const conversationId =
    conversationIdRaw === 'new'
      ? 'new'
      : normalizeConversationId(conversationIdRaw as string)

  if (!conversationId) {
    return {
      fields: {
        conversation_id: "Conversation id must be non-empty or 'new'."
      }
    }
  }

  const normalizedMode = mode as 'text' | 'voice'

  return {
    message,
    conversation_id: conversationId,
    mode: normalizedMode
  }
}

function normalizeConversationId(value: string): string | null {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function readUserId(claims: unknown): string | null {
  if (!isRecord(claims) || typeof claims.sub !== 'string') {
    return null
  }

  return claims.sub
}

function isMediaAssetRow(
  value: unknown
): value is { id: string; b2_key: string; caption: string } {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.b2_key === 'string' &&
    typeof value.caption === 'string'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
