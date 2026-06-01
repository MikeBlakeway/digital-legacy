-- Biographical facts on persona (replaces identity_prompt concept)
alter table public.personas add column if not exists birth_year integer;
alter table public.personas add column if not exists birth_place text;
alter table public.personas add column if not exists locations_lived text[];

-- memories.source enum: add 'diary' value
alter type public.memory_source add value if not exists 'diary';

-- Diary entries
create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  content text,
  voice_b2_key text,
  transcript text,
  emotion_label text,
  emotion_updates jsonb,
  word_count integer,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Interview sessions
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  theme text not null,
  messages jsonb not null default '[]',
  turn_count integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Persona trait profiles (versioned, one current per persona)
create table if not exists public.persona_traits (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  version integer not null default 1,
  openness float,
  conscientiousness float,
  extraversion float,
  agreeableness float,
  neuroticism float,
  narrative_agency float,
  narrative_communion float,
  narrative_redemption float,
  dominant_values text[],
  summary_prose text,
  identity_block text,
  diary_entries_analysed integer not null default 0,
  interview_turns_analysed integer not null default 0,
  computed_at timestamptz not null default now(),
  is_current boolean not null default false
);

create unique index if not exists persona_traits_current_idx
  on public.persona_traits(persona_id)
  where is_current = true;

-- Emotional voice sample library
create table if not exists public.emotional_voice_samples (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  emotion_label text not null,
  b2_key text not null,
  duration_seconds float not null,
  quality_score float,
  created_at timestamptz not null default now()
);