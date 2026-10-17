create or replace function public.pick_teams(
  p_candidates uuid[],
  p_red_preferences uuid[] default '{}',
  p_blue_preferences uuid[] default '{}',
  p_balance_by_elo boolean default true
)
returns table (player_id uuid, team public.team_color, excluded_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_selected uuid[];
  v_excluded_counts integer[];
  v_red_team uuid[];
  v_distinct_count integer;
  v_preferred uuid[];
begin
  if not public.is_company_user() then
    raise exception 'Email aziendale non autorizzata';
  end if;

  v_preferred := coalesce(p_red_preferences, '{}'::uuid[])
    || coalesce(p_blue_preferences, '{}'::uuid[]);

  select count(distinct candidate)::integer
  into v_distinct_count
  from unnest(coalesce(p_candidates, '{}'::uuid[])) candidate;

  if v_distinct_count < 4 then
    raise exception 'Seleziona almeno quattro giocatori';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_red_preferences, '{}'::uuid[])) preferred
    where not (preferred = any(p_candidates))
  ) or exists (
    select 1
    from unnest(coalesce(p_blue_preferences, '{}'::uuid[])) preferred
    where not (preferred = any(p_candidates))
  ) then
    raise exception 'Le preferenze devono appartenere ai candidati';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_red_preferences, '{}'::uuid[])) red_player
    join unnest(coalesce(p_blue_preferences, '{}'::uuid[])) blue_player
      on blue_player = red_player
  ) then
    raise exception 'Un giocatore non può appartenere a entrambe le squadre';
  end if;

  if (
    select count(distinct value)
    from unnest(coalesce(p_red_preferences, '{}'::uuid[])) value
  ) > 2 or (
    select count(distinct value)
    from unnest(coalesce(p_blue_preferences, '{}'::uuid[])) value
  ) > 2 then
    raise exception 'Ogni squadra può avere al massimo due preferenze';
  end if;

  if exists (
    select 1
    from unnest(v_preferred) preferred
    where not exists (
      select 1
      from public.players
      where players.id = preferred
        and players.active
    )
  ) then
    raise exception 'Le preferenze devono appartenere a giocatori attivi';
  end if;

  select array_agg(ranked.id order by ranked.position),
         array_agg(ranked.excluded_count order by ranked.position)
  into v_selected, v_excluded_counts
  from (
    select
      players.id,
      coalesce(counts.excluded_count, 0)::integer as excluded_count,
      row_number() over (
        order by
          case when players.id = any(v_preferred) then 0 else 1 end,
          coalesce(counts.excluded_count, 0) desc,
          random()
      ) as position
    from public.players as players
    left join public.player_exclusion_counts as counts
      on counts.player_id = players.id
    where players.active and players.id = any(p_candidates)
    order by
      case when players.id = any(v_preferred) then 0 else 1 end,
      excluded_count desc,
      random()
    limit 4
  ) ranked;

  if coalesce(cardinality(v_selected), 0) <> 4 then
    raise exception 'Servono quattro giocatori attivi';
  end if;

  if exists (
    select 1
    from unnest(v_preferred) preferred
    where not (preferred = any(v_selected))
  ) then
    raise exception 'Le preferenze non possono essere incluse nella selezione';
  end if;

  select array[pair.first_id, pair.second_id]
  into v_red_team
  from (
    select
      first_player.id as first_id,
      second_player.id as second_id
    from public.players first_player
    join public.players second_player on first_player.id < second_player.id
    where first_player.id = any(v_selected)
      and second_player.id = any(v_selected)
      and not (first_player.id = any(coalesce(p_blue_preferences, '{}'::uuid[])))
      and not (second_player.id = any(coalesce(p_blue_preferences, '{}'::uuid[])))
      and not exists (
        select 1
        from unnest(coalesce(p_red_preferences, '{}'::uuid[])) preferred
        where preferred = any(v_selected)
          and preferred <> first_player.id
          and preferred <> second_player.id
      )
    order by
      case when p_balance_by_elo then
        abs(
          (first_player.current_elo + second_player.current_elo)
          - (select sum(current_elo) from public.players where id = any(v_selected))
          + (first_player.current_elo + second_player.current_elo)
        )
      else 0 end,
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
    selected.exclusions
  from unnest(v_selected, v_excluded_counts) as selected(id, exclusions)
  order by 2, selected.id;
end;
$$;

revoke all on function public.pick_teams(uuid[], uuid[], uuid[], boolean)
from public, anon, authenticated;
grant execute on function public.pick_teams(uuid[], uuid[], uuid[], boolean)
to authenticated;
