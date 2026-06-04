alter table public.memories
  add column if not exists visibility text;

update public.memories
set visibility = case
  when coalesce(is_private, false) then 'private'
  else 'family'
end
where visibility is null;

alter table public.memories
  alter column visibility set default 'family',
  alter column visibility set not null;

alter table public.memories
  drop constraint if exists memories_visibility_check,
  add constraint memories_visibility_check
    check (visibility in ('private', 'family', 'public'));

create or replace function public.match_persona_memories(
  query_embedding vector(768),
  match_persona_id uuid,
  match_count integer default 8,
  match_threshold double precision default 0
)
returns table (
  id uuid,
  content text,
  media_asset_id uuid,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    memories.id,
    memories.content,
    memories.media_asset_id,
    1 - (memories.embedding <=> query_embedding) as similarity
  from public.memories
  where memories.persona_id = match_persona_id
    and memories.visibility <> 'private'
    and 1 - (memories.embedding <=> query_embedding) >= coalesce(match_threshold, 0)
  order by memories.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 8), 50));
$$;

revoke all on function public.match_persona_memories(vector, uuid, integer, double precision)
  from public;

grant execute on function public.match_persona_memories(vector, uuid, integer, double precision)
  to authenticated;

grant execute on function public.match_persona_memories(vector, uuid, integer, double precision)
  to service_role;
