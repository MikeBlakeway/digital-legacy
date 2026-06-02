import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  EMOTION_LABELS,
  isEmotionLabel,
  type EmotionLabel
} from '@/lib/capture/emotions'

const VOICE_SAMPLE_COLUMNS =
  'id, persona_id, b2_key, duration_seconds, transcript, created_at'

export type EmotionDurationMap = Record<EmotionLabel, number>

export type VoiceSample = {
  id: string
  persona_id: string
  b2_key: string
  duration_seconds: number
  transcript: string | null
  created_at: string
  emotion_label: EmotionLabel | null
}

export type CreateVoiceSampleData = {
  personaId: string
  b2Key: string
  durationSeconds: number
}

export type UpdateVoiceSampleTranscriptData = {
  sampleId: string
  transcript: string
}

export type VoiceSampleOverview = {
  samples: VoiceSample[]
  total_duration_seconds: number
  emotional_coverage: EmotionDurationMap
}

export class VoiceSampleDatabaseError extends Error {
  readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'VoiceSampleDatabaseError'
    this.details = details
  }
}

export async function createVoiceSample(
  client: SupabaseClient,
  data: CreateVoiceSampleData
): Promise<VoiceSample> {
  const result = await client
    .from('voice_samples')
    .insert({
      persona_id: normalizeRequiredText(data.personaId, 'personaId'),
      b2_key: normalizeRequiredText(data.b2Key, 'b2Key'),
      duration_seconds: normalizePositiveNumber(
        data.durationSeconds,
        'durationSeconds'
      ),
      transcript: null
    })
    .select(VOICE_SAMPLE_COLUMNS)
    .single()
  const row: unknown = result.data

  if (result.error) {
    throw new VoiceSampleDatabaseError(
      'Failed to create voice sample.',
      result.error
    )
  }

  return {
    ...normalizeVoiceSampleRow(row),
    emotion_label: null
  }
}

export async function updateVoiceSampleTranscript(
  client: SupabaseClient,
  data: UpdateVoiceSampleTranscriptData
): Promise<VoiceSample> {
  const result = await client
    .from('voice_samples')
    .update({
      transcript: normalizeRequiredText(data.transcript, 'transcript')
    })
    .eq('id', normalizeRequiredText(data.sampleId, 'sampleId'))
    .select(VOICE_SAMPLE_COLUMNS)
    .single()
  const row: unknown = result.data

  if (result.error) {
    throw new VoiceSampleDatabaseError(
      'Failed to update voice sample transcript.',
      result.error
    )
  }

  return {
    ...normalizeVoiceSampleRow(row),
    emotion_label: null
  }
}

export async function getVoiceSampleOverview(
  client: SupabaseClient,
  personaId: string
): Promise<VoiceSampleOverview> {
  const normalizedPersonaId = normalizeRequiredText(personaId, 'personaId')
  const [samplesResult, emotionalResult] = await Promise.all([
    client
      .from('voice_samples')
      .select(VOICE_SAMPLE_COLUMNS)
      .eq('persona_id', normalizedPersonaId)
      .order('created_at', { ascending: false }),
    client
      .from('emotional_voice_samples')
      .select('b2_key, emotion_label, duration_seconds')
      .eq('persona_id', normalizedPersonaId)
  ])
  const sampleRows: unknown = samplesResult.data
  const emotionalRows: unknown = emotionalResult.data

  if (samplesResult.error) {
    throw new VoiceSampleDatabaseError(
      'Failed to list voice samples.',
      samplesResult.error
    )
  }

  if (emotionalResult.error) {
    throw new VoiceSampleDatabaseError(
      'Failed to load emotional voice coverage.',
      emotionalResult.error
    )
  }

  if (!Array.isArray(sampleRows)) {
    throw new VoiceSampleDatabaseError(
      'Supabase returned invalid voice samples.',
      sampleRows
    )
  }

  if (!Array.isArray(emotionalRows)) {
    throw new VoiceSampleDatabaseError(
      'Supabase returned invalid emotional voice coverage.',
      emotionalRows
    )
  }

  const emotionalCoverage = createEmptyEmotionDurationMap()
  const emotionalLabelsByKey = new Map<string, EmotionLabel>()

  for (const row of emotionalRows) {
    if (!isRecord(row)) {
      throw new VoiceSampleDatabaseError(
        'Supabase returned invalid emotional voice coverage.',
        emotionalRows
      )
    }

    if (
      typeof row.b2_key !== 'string' ||
      typeof row.duration_seconds !== 'number' ||
      !isEmotionLabel(row.emotion_label)
    ) {
      throw new VoiceSampleDatabaseError(
        'Supabase returned invalid emotional voice coverage.',
        emotionalRows
      )
    }

    emotionalCoverage[row.emotion_label] += row.duration_seconds

    if (!emotionalLabelsByKey.has(row.b2_key)) {
      emotionalLabelsByKey.set(row.b2_key, row.emotion_label)
    }
  }

  const samples = sampleRows.map((row) => {
    const sample = normalizeVoiceSampleRow(row)

    return {
      ...sample,
      emotion_label: emotionalLabelsByKey.get(sample.b2_key) ?? null
    }
  })

  return {
    samples,
    total_duration_seconds: samples.reduce(
      (total, sample) => total + sample.duration_seconds,
      0
    ),
    emotional_coverage: emotionalCoverage
  }
}

export function createEmptyEmotionDurationMap(): EmotionDurationMap {
  return EMOTION_LABELS.reduce<EmotionDurationMap>(
    (coverage, label) => ({
      ...coverage,
      [label]: 0
    }),
    {
      warm: 0,
      sad: 0,
      frustrated: 0,
      anxious: 0,
      amused: 0,
      tender: 0,
      indignant: 0,
      reflective: 0
    }
  )
}

function normalizeVoiceSampleRow(
  value: unknown
): Omit<VoiceSample, 'emotion_label'> {
  if (!isRecord(value)) {
    throw new VoiceSampleDatabaseError(
      'Supabase returned an invalid voice sample.',
      value
    )
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.persona_id !== 'string' ||
    typeof value.b2_key !== 'string' ||
    typeof value.duration_seconds !== 'number' ||
    (typeof value.transcript !== 'string' && value.transcript !== null) ||
    typeof value.created_at !== 'string'
  ) {
    throw new VoiceSampleDatabaseError(
      'Supabase returned an invalid voice sample.',
      value
    )
  }

  return {
    id: value.id,
    persona_id: value.persona_id,
    b2_key: value.b2_key,
    duration_seconds: value.duration_seconds,
    transcript: value.transcript,
    created_at: value.created_at
  }
}

function normalizeRequiredText(value: string, name: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${name} must be non-empty.`)
  }

  return normalized
}

function normalizePositiveNumber(value: number, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
