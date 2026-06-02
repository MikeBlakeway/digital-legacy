import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

const CONVERSATION_COLUMNS = 'id, persona_id, user_id, created_at, updated_at'
const MESSAGE_COLUMNS =
  'id, conversation_id, role, content, audio_b2_key, retrieved_memory_ids, created_at'

export type Conversation = {
  id: string
  persona_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type ConversationMessageRole = 'user' | 'assistant'

export type ConversationMessage = {
  id: string
  conversation_id: string
  role: ConversationMessageRole
  content: string
  audio_b2_key: string | null
  retrieved_memory_ids: string[]
  created_at: string
}

export type CreateConversationData = {
  personaId: string
  userId: string
}

export type InsertConversationMessageData = {
  conversationId: string
  role: ConversationMessageRole
  content: string
  audioB2Key?: string | null
  retrievedMemoryIds?: string[]
}

export class ConversationDatabaseError extends Error {
  readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'ConversationDatabaseError'
    this.details = details
  }
}

export async function createConversation(
  client: SupabaseClient,
  data: CreateConversationData
): Promise<Conversation> {
  const result = await client
    .from('conversations')
    .insert({
      persona_id: normalizeRequiredText(data.personaId, 'personaId'),
      user_id: normalizeRequiredText(data.userId, 'userId')
    })
    .select(CONVERSATION_COLUMNS)
    .single()
  const row: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to create conversation.',
      result.error
    )
  }

  return normalizeConversation(row)
}

export async function getConversationById(
  client: SupabaseClient,
  conversationId: string
): Promise<Conversation | null> {
  const result = await client
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', normalizeRequiredText(conversationId, 'conversationId'))
    .maybeSingle()
  const row: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to load conversation.',
      result.error
    )
  }

  return row === null ? null : normalizeConversation(row)
}

export async function getLatestConversation(
  client: SupabaseClient,
  params: { personaId: string; userId: string }
): Promise<Conversation | null> {
  const result = await client
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('persona_id', normalizeRequiredText(params.personaId, 'personaId'))
    .eq('user_id', normalizeRequiredText(params.userId, 'userId'))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const row: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to load latest conversation.',
      result.error
    )
  }

  return row === null ? null : normalizeConversation(row)
}

export async function listConversationMessages(
  client: SupabaseClient,
  conversationId: string
): Promise<ConversationMessage[]> {
  const result = await client
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq(
      'conversation_id',
      normalizeRequiredText(conversationId, 'conversationId')
    )
    .order('created_at', { ascending: true })
  const rows: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to list conversation messages.',
      result.error
    )
  }

  if (!Array.isArray(rows)) {
    throw new ConversationDatabaseError(
      'Supabase returned invalid conversation messages.',
      rows
    )
  }

  return rows.map(normalizeConversationMessage)
}

export async function insertConversationMessage(
  client: SupabaseClient,
  data: InsertConversationMessageData
): Promise<ConversationMessage> {
  const result = await client
    .from('messages')
    .insert({
      conversation_id: normalizeRequiredText(
        data.conversationId,
        'conversationId'
      ),
      role: data.role,
      content: normalizeRequiredText(data.content, 'content'),
      audio_b2_key: normalizeOptionalText(data.audioB2Key),
      retrieved_memory_ids: normalizeUuidArray(data.retrievedMemoryIds)
    })
    .select(MESSAGE_COLUMNS)
    .single()
  const row: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to insert conversation message.',
      result.error
    )
  }

  return normalizeConversationMessage(row)
}

export async function updateConversationMessageAudioKey(
  client: SupabaseClient,
  params: {
    messageId: string
    audioB2Key: string
  }
): Promise<ConversationMessage> {
  const result = await client
    .from('messages')
    .update({
      audio_b2_key: normalizeRequiredText(params.audioB2Key, 'audioB2Key')
    })
    .eq('id', normalizeRequiredText(params.messageId, 'messageId'))
    .select(MESSAGE_COLUMNS)
    .single()
  const row: unknown = result.data

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to update message audio key.',
      result.error
    )
  }

  return normalizeConversationMessage(row)
}

export async function touchConversation(
  client: SupabaseClient,
  conversationId: string
): Promise<void> {
  const result = await client
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', normalizeRequiredText(conversationId, 'conversationId'))

  if (result.error) {
    throw new ConversationDatabaseError(
      'Failed to update conversation timestamp.',
      result.error
    )
  }
}

function normalizeConversation(value: unknown): Conversation {
  if (!isConversation(value)) {
    throw new ConversationDatabaseError(
      'Supabase returned an invalid conversation.',
      value
    )
  }

  return value
}

function normalizeConversationMessage(value: unknown): ConversationMessage {
  if (!isConversationMessage(value)) {
    throw new ConversationDatabaseError(
      'Supabase returned an invalid conversation message.',
      value
    )
  }

  return value
}

function isConversation(value: unknown): value is Conversation {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.persona_id === 'string' &&
    typeof value.user_id === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.conversation_id === 'string' &&
    isConversationMessageRole(value.role) &&
    typeof value.content === 'string' &&
    (typeof value.audio_b2_key === 'string' || value.audio_b2_key === null) &&
    isStringArray(value.retrieved_memory_ids) &&
    typeof value.created_at === 'string'
  )
}

function isConversationMessageRole(
  value: unknown
): value is ConversationMessageRole {
  return value === 'user' || value === 'assistant'
}

function normalizeUuidArray(value: string[] | undefined): string[] {
  if (!value) {
    return []
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0)
}

function normalizeRequiredText(value: string, name: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${name} must be non-empty.`)
  }

  return normalized
}

function normalizeOptionalText(
  value: string | null | undefined
): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
