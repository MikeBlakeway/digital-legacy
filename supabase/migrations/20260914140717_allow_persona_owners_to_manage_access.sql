drop policy if exists "Admins can create persona grants"
on public.persona_access;

drop policy if exists "Admins can delete persona grants"
on public.persona_access;

create policy "Owners and admins can create persona grants"
on public.persona_access
for insert
to authenticated
with check (
  granted_by = (select auth.uid())
  and (
    public.is_persona_owner(persona_id)
    or public.is_admin()
  )
);

create policy "Owners and admins can delete persona grants"
on public.persona_access
for delete
to authenticated
using (
  public.is_persona_owner(persona_id)
  or public.is_admin()
);
