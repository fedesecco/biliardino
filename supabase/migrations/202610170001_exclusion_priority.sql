create table public.player_exclusion_counts (
  player_id uuid primary key references public.players(id) on delete cascade,
  excluded_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint player_exclusion_counts_nonnegative_check
    check (excluded_count >= 0)
);

insert into public.player_exclusion_counts (player_id)
select id
from public.players;

create table public.match_pick_candidates (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id),
  primary key (match_id, player_id)
);

create index match_pick_candidates_player_idx
on public.match_pick_candidates (player_id, match_id);

alter table public.player_exclusion_counts enable row level security;
alter table public.match_pick_candidates enable row level security;

revoke all on table public.player_exclusion_counts
from public, anon, authenticated;
revoke all on table public.match_pick_candidates
from public, anon, authenticated;

create or replace function public.recalculate_excluded_counts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_selection record;
  v_participants uuid[];
begin
  perform player.id
  from public.players as player
  where player.id is not null
  order by player.id
  for update;

  insert into public.player_exclusion_counts (player_id)
  select player.id
  from public.players as player
  on conflict (player_id) do nothing;

  perform counts.player_id
  from public.player_exclusion_counts as counts
  order by counts.player_id
  for update;

  update public.player_exclusion_counts
  set excluded_count = 0,
      updated_at = now()
  where player_id is not null;

  for v_selection in
    select
      candidates.match_id,
      matches.created_at,
      array_agg(candidates.player_id order by candidates.player_id) as candidate_ids
    from public.match_pick_candidates as candidates
    join public.matches as matches on matches.id = candidates.match_id
    group by candidates.match_id, matches.created_at
    order by matches.created_at, candidates.match_id
  loop
    select array_agg(match_players.player_id order by match_players.player_id)
    into v_participants
    from public.match_players
    where match_players.match_id = v_selection.match_id;

    update public.player_exclusion_counts
    set excluded_count = case
          when player_id = any(coalesce(v_participants, '{}'::uuid[])) then 0
          else excluded_count + 1
        end,
        updated_at = now()
    where player_id = any(v_selection.candidate_ids);
  end loop;
end;
$$;

revoke all on function public.recalculate_excluded_counts()
from public, anon, authenticated;

drop function public.pick_teams(uuid[], uuid[], uuid[], boolean);

create function public.pick_teams(
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
         array_agg(ranked.excluded_count order by ranked.position)
  into v_selected, v_excluded_counts
  from (
    select
      players.id,
      coalesce(counts.excluded_count, 0)::integer as excluded_count,
      row_number() over (
        order by coalesce(counts.excluded_count, 0) desc, random()
      ) as position
    from public.players as players
    left join public.player_exclusion_counts as counts
      on counts.player_id = players.id
    where players.active and players.id = any(p_candidates)
    order by excluded_count desc, random()
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
      second_player.id as second_id
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

drop function public.record_match(uuid[], uuid[], smallint, smallint, timestamptz);

create function public.record_match(
  p_candidates uuid[],
  p_red_players uuid[],
  p_blue_players uuid[],
  p_red_score smallint,
  p_blue_score smallint,
  p_played_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id uuid;
  v_all_players uuid[];
  v_red_rating numeric;
  v_blue_rating numeric;
  v_expected_red numeric;
  v_actual_red numeric;
  v_red_delta numeric;
  v_blue_delta numeric;
  v_margin_multiplier numeric;
begin
  if not public.is_company_user() then
    raise exception 'Email aziendale non autorizzata';
  end if;

  if coalesce(cardinality(p_candidates), 0) < 4
    or (
      select count(distinct candidate)
      from unnest(coalesce(p_candidates, '{}'::uuid[])) candidate
    ) <> coalesce(cardinality(p_candidates), 0) then
    raise exception 'La partita richiede almeno quattro candidati distinti';
  end if;

  v_all_players := p_red_players || p_blue_players;
  if coalesce(cardinality(p_red_players), 0) <> 2
    or coalesce(cardinality(p_blue_players), 0) <> 2
    or (
      select count(distinct player_id)
      from unnest(coalesce(v_all_players, '{}'::uuid[])) player_id
    ) <> 4 then
    raise exception 'La partita richiede due giocatori distinti per squadra';
  end if;

  if exists (
    select 1
    from unnest(v_all_players) participant
    where not (participant = any(p_candidates))
  ) then
    raise exception 'I partecipanti devono appartenere ai candidati';
  end if;

  if (
    select count(*)
    from public.players
    where id = any(p_candidates)
  ) <> cardinality(p_candidates) then
    raise exception 'I candidati devono essere giocatori esistenti';
  end if;

  if not (
    (p_red_score = 6 and p_blue_score between 0 and 5)
    or (p_blue_score = 6 and p_red_score between 0 and 5)
  ) then
    raise exception 'La partita termina a sei goal, senza scarto';
  end if;

  perform player.id
  from public.players as player
  where player.id = any(p_candidates)
  order by player.id
  for update;

  if (
    select count(*)
    from public.players
    where id = any(v_all_players) and active
  ) <> 4 then
    raise exception 'Uno o più giocatori non sono attivi';
  end if;

  insert into public.player_exclusion_counts (player_id)
  select candidate
  from unnest(p_candidates) candidate
  on conflict (player_id) do nothing;

  perform counts.player_id
  from public.player_exclusion_counts as counts
  where counts.player_id = any(p_candidates)
  order by counts.player_id
  for update;

  select avg(current_elo) into v_red_rating
  from public.players where id = any(p_red_players);
  select avg(current_elo) into v_blue_rating
  from public.players where id = any(p_blue_players);

  v_expected_red := 1 / (1 + power(10, (v_blue_rating - v_red_rating) / 400));
  v_actual_red := case when p_red_score = 6 then 1 else 0 end;
  v_margin_multiplier := least(
    1.30::numeric,
    1 + 0.15::numeric * ln((1 + abs(p_red_score - p_blue_score))::numeric)
  );
  v_red_delta := round((
    28 * (v_actual_red - v_expected_red) * v_margin_multiplier
  )::numeric, 2);
  v_blue_delta := -v_red_delta;

  insert into public.matches (
    played_at,
    red_score,
    blue_score,
    created_by,
    elo_model_version
  ) values (
    p_played_at,
    p_red_score,
    p_blue_score,
    auth.uid(),
    2
  ) returning id into v_match_id;

  insert into public.match_players (
    match_id, player_id, team, elo_before, elo_delta
  )
  select v_match_id, id, 'red'::public.team_color, current_elo, v_red_delta
  from public.players where id = any(p_red_players)
  union all
  select v_match_id, id, 'blue'::public.team_color, current_elo, v_blue_delta
  from public.players where id = any(p_blue_players);

  insert into public.match_pick_candidates (match_id, player_id)
  select v_match_id, candidate
  from unnest(p_candidates) candidate;

  update public.player_exclusion_counts
  set excluded_count = case
        when player_id = any(v_all_players) then 0
        else excluded_count + 1
      end,
      updated_at = now()
  where player_id = any(p_candidates);

  update public.players
  set current_elo = round(current_elo + v_red_delta, 2), updated_at = now()
  where id = any(p_red_players);

  update public.players
  set current_elo = round(current_elo + v_blue_delta, 2), updated_at = now()
  where id = any(p_blue_players);

  perform public.recalculate_win_streaks(v_all_players);

  return v_match_id;
end;
$$;

revoke all on function public.record_match(uuid[], uuid[], uuid[], smallint, smallint, timestamptz)
from public, anon, authenticated;
grant execute on function public.record_match(uuid[], uuid[], uuid[], smallint, smallint, timestamptz)
to authenticated;

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
  perform public.recalculate_excluded_counts();
end;
$$;

revoke all on function public.delete_match(uuid)
from public, anon, authenticated;
grant execute on function public.delete_match(uuid)
to authenticated;
