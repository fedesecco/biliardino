revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.recalculate_elo() from public, anon, authenticated;

revoke all on function public.is_approved() from public, anon, authenticated;
revoke all on function public.pick_teams(uuid[], uuid[], uuid[]) from public, anon, authenticated;
revoke all on function public.record_match(uuid[], uuid[], smallint, smallint, timestamptz) from public, anon, authenticated;
revoke all on function public.update_match(uuid, smallint, smallint, timestamptz) from public, anon, authenticated;

grant execute on function public.is_approved() to authenticated;
grant execute on function public.pick_teams(uuid[], uuid[], uuid[]) to authenticated;
grant execute on function public.record_match(uuid[], uuid[], smallint, smallint, timestamptz) to authenticated;
grant execute on function public.update_match(uuid, smallint, smallint, timestamptz) to authenticated;
