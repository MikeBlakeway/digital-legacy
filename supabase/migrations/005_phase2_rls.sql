-- diary_entries: owner read/write only
alter table public.diary_entries enable row level security;
create policy "owner_all" on public.diary_entries
  using (
    persona_id in (
      select id from public.personas where owner_user_id = auth.uid()
    )
  );

-- interview_sessions: owner read/write only
alter table public.interview_sessions enable row level security;
create policy "owner_all" on public.interview_sessions
  using (
    persona_id in (
      select id from public.personas where owner_user_id = auth.uid()
    )
  );

-- persona_traits: owner read only; writes via service role only
alter table public.persona_traits enable row level security;
create policy "owner_read" on public.persona_traits for select
  using (
    persona_id in (
      select id from public.personas where owner_user_id = auth.uid()
    )
  );

-- emotional_voice_samples: owner read/write only
alter table public.emotional_voice_samples enable row level security;
create policy "owner_all" on public.emotional_voice_samples
  using (
    persona_id in (
      select id from public.personas where owner_user_id = auth.uid()
    )
  );