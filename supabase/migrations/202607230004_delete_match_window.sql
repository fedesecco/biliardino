create or replace function public.delete_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created_at timestamptz;
begin
  if not public.is_company_user() then
    raise exception 'Account non autorizzato';
  end if;

  select created_at into v_created_at
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Partita non trovata';
  end if;

  if v_created_at < now() - interval '10 minutes' then
    raise exception 'La partita non è più eliminabile';
  end if;

  delete from public.matches where id = p_match_id;
  perform public.recalculate_elo();
end;
$$;

revoke all on function public.delete_match(uuid) from public, anon, authenticated;
grant execute on function public.delete_match(uuid) to authenticated;

revoke all on function public.update_match(uuid, smallint, smallint, timestamptz)
from public, anon, authenticated;
drop function if exists public.update_match(uuid, smallint, smallint, timestamptz);
