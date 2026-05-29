set check_function_bodies = off;
set search_path = public, extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

create type public.memory_source as enum (
  'interview',
  'voice_memo',
  'free_text',
  'media_caption'
);

create type public.media_type as enum (
  'photo',
  'video'
);

create type public.caption_status as enum (
  'pending',
  'complete',
  'manual'
);

create type public.message_role as enum (
  'user',
  'assistant'
);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lora_adapter_key text,
  voice_sample_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  b2_key text not null check (char_length(trim(b2_key)) > 0),
  media_type public.media_type not null,
  caption text,
  caption_status public.caption_status not null default 'pending',
  taken_at timestamptz,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  source public.memory_source not null,
  question_prompt text,
  embedding vector(768) not null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.voice_samples (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  b2_key text not null check (char_length(trim(b2_key)) > 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  transcript text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  audio_b2_key text,
  retrieved_memory_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now()
);

create table public.persona_access (
  persona_id uuid not null references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now(),
  primary key (persona_id, user_id)
);

create index personas_owner_user_id_idx on public.personas (owner_user_id);

create index media_assets_persona_id_created_at_idx
  on public.media_assets (persona_id, created_at desc);
create index media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

create index memories_persona_id_created_at_idx
  on public.memories (persona_id, created_at desc);
create index memories_media_asset_id_idx on public.memories (media_asset_id);
create index memories_embedding_hnsw_idx
  on public.memories using hnsw (embedding vector_cosine_ops);

create index voice_samples_persona_id_created_at_idx
  on public.voice_samples (persona_id, created_at desc);

create index conversations_user_id_updated_at_idx
  on public.conversations (user_id, updated_at desc);
create index conversations_persona_id_updated_at_idx
  on public.conversations (persona_id, updated_at desc);

create index messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index persona_access_user_id_idx on public.persona_access (user_id);
create index persona_access_granted_by_idx on public.persona_access (granted_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_personas_updated_at
before update on public.personas
for each row execute function public.set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin',
    false
  );
$$;

create or replace function public.is_persona_owner(check_persona_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.personas p
    where p.id = check_persona_id
      and p.owner_user_id = (select auth.uid())
  );
$$;

create or replace function public.has_persona_access(check_persona_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or public.is_persona_owner(check_persona_id)
    or exists (
      select 1
      from public.persona_access pa
      where pa.persona_id = check_persona_id
        and pa.user_id = (select auth.uid())
    );
$$;

create or replace function public.can_access_conversation(check_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = check_conversation_id
      and c.user_id = (select auth.uid())
      and public.has_persona_access(c.persona_id)
  );
$$;

alter table public.personas enable row level security;
alter table public.media_assets enable row level security;
alter table public.memories enable row level security;
alter table public.voice_samples enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.persona_access enable row level security;

create policy "Owners and granted users can read personas"
on public.personas
for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.has_persona_access(id)
);

create policy "Owners can create personas"
on public.personas
for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  or public.is_admin()
);

create policy "Owners can update personas"
on public.personas
for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.is_admin()
)
with check (
  owner_user_id = (select auth.uid())
  or public.is_admin()
);

create policy "Owners can delete personas"
on public.personas
for delete
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.is_admin()
);

create policy "Owners can read memories"
on public.memories
for select
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can create memories"
on public.memories
for insert
to authenticated
with check (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can update memories"
on public.memories
for update
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
)
with check (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can delete memories"
on public.memories
for delete
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners and granted users can read media assets"
on public.media_assets
for select
to authenticated
using (public.has_persona_access(persona_id));

create policy "Owners can create media assets"
on public.media_assets
for insert
to authenticated
with check (
  (public.is_persona_owner(persona_id) and uploaded_by = (select auth.uid()))
  or public.is_admin()
);

create policy "Owners can update media assets"
on public.media_assets
for update
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
)
with check (
  (public.is_persona_owner(persona_id) and uploaded_by = (select auth.uid()))
  or public.is_admin()
);

create policy "Owners can delete media assets"
on public.media_assets
for delete
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can read voice samples"
on public.voice_samples
for select
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can create voice samples"
on public.voice_samples
for insert
to authenticated
with check (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can update voice samples"
on public.voice_samples
for update
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
)
with check (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Owners can delete voice samples"
on public.voice_samples
for delete
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Users can read their own conversations"
on public.conversations
for select
to authenticated
using (
  user_id = (select auth.uid())
  and public.has_persona_access(persona_id)
);

create policy "Users can create their own conversations"
on public.conversations
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.has_persona_access(persona_id)
);

create policy "Users can update their own conversations"
on public.conversations
for update
to authenticated
using (
  user_id = (select auth.uid())
  and public.has_persona_access(persona_id)
)
with check (
  user_id = (select auth.uid())
  and public.has_persona_access(persona_id)
);

create policy "Users can delete their own conversations"
on public.conversations
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and public.has_persona_access(persona_id)
);

create policy "Users can read messages in their conversations"
on public.messages
for select
to authenticated
using (public.can_access_conversation(conversation_id));

create policy "Users can create messages in their conversations"
on public.messages
for insert
to authenticated
with check (public.can_access_conversation(conversation_id));

create policy "Users can update messages in their conversations"
on public.messages
for update
to authenticated
using (public.can_access_conversation(conversation_id))
with check (public.can_access_conversation(conversation_id));

create policy "Users can delete messages in their conversations"
on public.messages
for delete
to authenticated
using (public.can_access_conversation(conversation_id));

create policy "Users can read relevant persona grants"
on public.persona_access
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_persona_owner(persona_id)
  or public.is_admin()
);

create policy "Admins can create persona grants"
on public.persona_access
for insert
to authenticated
with check (
  public.is_admin()
  and granted_by = (select auth.uid())
);

create policy "Admins can delete persona grants"
on public.persona_access
for delete
to authenticated
using (public.is_admin());

revoke all on table public.personas from anon;
revoke all on table public.media_assets from anon;
revoke all on table public.memories from anon;
revoke all on table public.voice_samples from anon;
revoke all on table public.conversations from anon;
revoke all on table public.messages from anon;
revoke all on table public.persona_access from anon;

grant select, insert, update, delete on table public.personas to authenticated;
grant select, insert, update, delete on table public.media_assets to authenticated;
grant select, insert, update, delete on table public.memories to authenticated;
grant select, insert, update, delete on table public.voice_samples to authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;
grant select, insert, update, delete on table public.persona_access to authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_persona_owner(uuid) to authenticated;
grant execute on function public.has_persona_access(uuid) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
