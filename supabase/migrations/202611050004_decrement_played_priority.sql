CREATE OR REPLACE FUNCTION public.recalculate_excluded_counts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          when player_id = any(coalesce(v_participants, '{}'::uuid[])) then greatest(0, excluded_count - 1)
          else excluded_count + 1
        end,
        updated_at = now()
    where player_id = any(v_selection.candidate_ids);
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_match(p_candidates uuid[], p_red_players uuid[], p_blue_players uuid[], p_red_score smallint, p_blue_score smallint, p_played_at timestamp with time zone DEFAULT now())
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
        when player_id = any(v_all_players) then greatest(0, excluded_count - 1)
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
$function$;

-- Keep existing counters consistent with new matches and history replay.
select public.recalculate_excluded_counts();
