create or replace function public.recalculate_elo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_match record;
  v_red_players uuid[];
  v_blue_players uuid[];
  v_red_rating numeric;
  v_blue_rating numeric;
  v_expected_red numeric;
  v_red_delta numeric;
begin
  update public.players
  set current_elo = 1000
  where id is not null;

  for current_match in
    select * from public.matches order by played_at, created_at, id
  loop
    select array_agg(player_id) into v_red_players
    from public.match_players
    where match_id = current_match.id and team = 'red';

    select array_agg(player_id) into v_blue_players
    from public.match_players
    where match_id = current_match.id and team = 'blue';

    if current_match.elo_locked then
      update public.match_players mp
      set elo_before = p.current_elo
      from public.players p
      where mp.match_id = current_match.id and p.id = mp.player_id;

      update public.players p
      set current_elo = round(p.current_elo + mp.elo_delta, 2)
      from public.match_players mp
      where mp.match_id = current_match.id and mp.player_id = p.id;
      continue;
    end if;

    select avg(current_elo) into v_red_rating
    from public.players where id = any(v_red_players);
    select avg(current_elo) into v_blue_rating
    from public.players where id = any(v_blue_players);

    v_expected_red := 1 / (1 + power(10, (v_blue_rating - v_red_rating) / 400));
    v_red_delta := round((
      32 * ((case when current_match.red_score > current_match.blue_score then 1 else 0 end) - v_expected_red)
    )::numeric, 2);

    update public.match_players mp
    set elo_before = p.current_elo,
        elo_delta = case when mp.team = 'red' then v_red_delta else -v_red_delta end
    from public.players p
    where mp.match_id = current_match.id and p.id = mp.player_id;

    update public.players
    set current_elo = round(
      current_elo + case when id = any(v_red_players) then v_red_delta else -v_red_delta end,
      2
    )
    where id = any(v_red_players || v_blue_players);
  end loop;

  update public.players
  set updated_at = now()
  where id is not null;
end;
$$;