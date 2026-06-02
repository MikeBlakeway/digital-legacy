import { after, NextResponse, type NextRequest } from 'next/server'

import { transcribeAudio } from '@/lib/ai/stt'
import { readObjectAsBase64 } from '@/lib/b2/client'
import { isEmotionLabel, type EmotionLabel } from '@/lib/capture/emotions'
import { insertEmotionalVoiceSample } from '@/lib/supabase/diary'
import { getPersonaBySlug, type Persona } from '@/lib/supabase/personas'
import {
  createClient as createServerClient,
  createServiceRoleClient
} from '@/lib/supabase/server'
import {
  createVoiceSample,
  getVoiceSampleOverview,
  updateVoiceSampleTranscript
} from '@/lib/supabase/voice-samples'

type VoiceSamplesRouteContext = {
  params: Promise<{
    slug: string
  }>
}

type CreateVoiceSampleRequest = {
  b2_key: string
  duration_seconds: number
  emotion_label: EmotionLabel
}

export async function GET(
  _request: NextRequest,
  context: VoiceSamplesRouteContext
) {
  const resolved = await getOwnedPersona(context)

  if ('response' in resolved) {
    return resolved.response
  }

  const overview = await getVoiceSampleOverview(
    createServiceRoleClient(),
    resolved.persona.id
  )

  return NextResponse.json(overview)
}

export async function POST(
  request: NextRequest,
  context: VoiceSamplesRouteContext
) {
  const resolved = await getOwnedPersona(context)

  if ('response' in resolved) {
    return resolved.response
  }

  const parsed = await parseRequest(request, resolved.persona)

  if ('fields' in parsed) {
    return NextResponse.json(
      { error: 'invalid_request', fields: parsed.fields },
      { status: 400 }
    )
  }

  const serviceClient = createServiceRoleClient()
  const voiceSample = await createVoiceSample(serviceClient, {
    personaId: resolved.persona.id,
    b2Key: parsed.b2_key,
    durationSeconds: parsed.duration_seconds
  })

  await insertEmotionalVoiceSample(serviceClient, {
    personaId: resolved.persona.id,
    emotionLabel: parsed.emotion_label,
    b2Key: parsed.b2_key,
    durationSeconds: parsed.duration_seconds
  })

  after(async () => {
    await safelyTranscribeVoiceSample({
      sampleId: voiceSample.id,
      b2Key: parsed.b2_key
    })
  })

  return NextResponse.json(
    {
      ...voiceSample,
      emotion_label: parsed.emotion_label
    },
    { status: 201 }
  )
}

async function getOwnedPersona(
  context: VoiceSamplesRouteContext
): Promise<{ persona: Persona } | { response: NextResponse }> {
  const { slug } = await context.params
  const supabase = await createServerClient()
  const claimsResult = await supabase.auth.getClaims()
  const userId = readUserId(claimsResult.data?.claims)

  if (claimsResult.error || !userId) {
    return {
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const persona = await getPersonaBySlug(createServiceRoleClient(), slug)

  if (!persona || persona.owner_user_id !== userId) {
    return {
      response: NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
  }

  return { persona }
}

async function parseRequest(
  request: NextRequest,
  persona: Persona
): Promise<CreateVoiceSampleRequest | { fields: Record<string, string> }> {
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
  const b2Key = typeof body.b2_key === 'string' ? body.b2_key.trim() : ''
  const durationSeconds = body.duration_seconds
  const emotionLabel = body.emotion_label

  if (!b2Key) {
    fields.b2_key = 'Voice sample key is required.'
  } else if (!b2Key.startsWith(`voice-samples/${persona.id}/`)) {
    fields.b2_key = 'Voice sample key is not valid for this persona.'
  }

  if (
    typeof durationSeconds !== 'number' ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    fields.duration_seconds = 'Duration must be a positive number.'
  }

  if (!isEmotionLabel(emotionLabel)) {
    fields.emotion_label = 'Emotion label is not valid.'
  }

  if (Object.keys(fields).length > 0) {
    return { fields }
  }

  const normalizedDurationSeconds = durationSeconds as number
  const normalizedEmotionLabel = emotionLabel as EmotionLabel

  return {
    b2_key: b2Key,
    duration_seconds: normalizedDurationSeconds,
    emotion_label: normalizedEmotionLabel
  }
}

async function safelyTranscribeVoiceSample({
  sampleId,
  b2Key
}: {
  sampleId: string
  b2Key: string
}) {
  try {
    const audioBase64 = await readObjectAsBase64({ key: b2Key })
    const transcript = await transcribeAudio({
      audio_base64: audioBase64,
      language: 'en'
    })

    await updateVoiceSampleTranscript(createServiceRoleClient(), {
      sampleId,
      transcript: transcript.transcript
    })
  } catch (error) {
    console.error('Voice sample transcription failed.', error)
  }
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
