drop function public.pick_teams(uuid[], uuid[], uuid[]);

create function public.pick_teams(
  p_candidates uuid[],
  p_red_preferences uuid[] default '{}',
  p_blue_preferences uuid[] default '{}',
  p_balance_by_elo boolean default true
)
returns table (player_id uuid, team public.team_color, daily_games integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_selected uuid[];
  v_daily_games integer[];
  v_red_team uuid[];
  v_distinct_count integer;
begin
  if not public.is_company_user() then
    raise exception 'Email aziendale non autorizzata';
  end if;

  select count(distinct candidate)::integer
  into v_distinct_count
  from unnest(p_candidates) candidate;

  if v_distinct_count < 4 then
    raise exception 'Seleziona almeno quattro giocatori';
  end if;

  if exists (
    select 1 from unnest(p_red_preferences) preferred
    where not (preferred = any(p_candidates))
  ) or exists (
    select 1 from unnest(p_blue_preferences) preferred
    where not (preferred = any(p_candidates))
  ) then
    raise exception 'Le preferenze devono appartenere ai candidati';
  end if;

  if exists (
    select 1 from unnest(p_red_preferences) red_player
    join unnest(p_blue_preferences) blue_player on blue_player = red_player
  ) then
    raise exception 'Un giocatore non può appartenere a entrambe le squadre';
  end if;

  if (select count(distinct value) from unnest(p_red_preferences) value) > 2
    or (select count(distinct value) from unnest(p_blue_preferences) value) > 2 then
    raise exception 'Ogni squadra può avere al massimo due preferenze';
  end if;

  select array_agg(ranked.id order by ranked.position),
         array_agg(ranked.daily_games order by ranked.position)
  into v_selected, v_daily_games
  from (
    select
      p.id,
      count(today_match.id)::integer as daily_games,
      row_number() over (
        order by count(today_match.id), random()
      ) as position
    from public.players p
    left join public.match_players mp on mp.player_id = p.id
    left join public.matches today_match
      on today_match.id = mp.match_id
     and (today_match.played_at at time zone 'Europe/Rome')::date =
         (now() at time zone 'Europe/Rome')::date
    where p.active and p.id = any(p_candidates)
    group by p.id
    order by daily_games, random()
    limit 4
  ) ranked;

  if coalesce(cardinality(v_selected), 0) <> 4 then
    raise exception 'Servono quattro giocatori attivi';
  end if;

  select array[pair.first_id, pair.second_id]
  into v_red_team
  from (
    select
      first_player.id as first_id,
      second_player.id as second_id,
      abs(
        (first_player.current_elo + second_player.current_elo)
        - (select sum(current_elo) from public.players where id = any(v_selected))
        + (first_player.current_elo + second_player.current_elo)
      ) as rating_gap
    from public.players first_player
    join public.players second_player on first_player.id < second_player.id
    where first_player.id = any(v_selected)
      and second_player.id = any(v_selected)
      and not (first_player.id = any(p_blue_preferences))
      and not (second_player.id = any(p_blue_preferences))
      and not exists (
        select 1
        from unnest(p_red_preferences) preferred
        where preferred = any(v_selected)
          and preferred <> first_player.id
          and preferred <> second_player.id
      )
    order by
      case when p_balance_by_elo then rating_gap else 0 end,
      random()
    limit 1
  ) pair;

  if v_red_team is null then
    raise exception 'Le preferenze non permettono di creare due squadre';
  end if;

  return query
  select
    selected.id,
    case when selected.id = any(v_red_team) then 'red'::public.team_color
         else 'blue'::public.team_color end,
    selected.games
  from unnest(v_selected, v_daily_games) as selected(id, games)
  order by 2, selected.id;
end;
$$;

revoke all on function public.pick_teams(uuid[], uuid[], uuid[], boolean)
from public, anon, authenticated;
grant execute on function public.pick_teams(uuid[], uuid[], uuid[], boolean)
to authenticated;