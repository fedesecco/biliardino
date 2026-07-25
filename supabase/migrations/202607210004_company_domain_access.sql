create or replace function public.is_company_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null
    and lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'teleniasoftware.com';
$$;

create or replace function public.hook_restrict_signup_to_company(event jsonb)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when lower(split_part(coalesce(event -> 'user' ->> 'email', ''), '@', 2)) = 'teleniasoftware.com'
      then '{}'::jsonb
    else jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Usa un indirizzo @teleniasoftware.com.'
      )
    )
  end;
$$;

drop policy "Approved users create players" on public.players;
drop policy "Approved users update players" on public.players;

create policy "Company users create players"
on public.players for insert
to authenticated
with check (public.is_company_user());

create policy "Company users update players"
on public.players for update
to authenticated
using (public.is_company_user())
with check (public.is_company_user());

alter table public.profiles drop column approved;

create or replace function public.pick_teams(
  p_candidates uuid[],
  p_red_preferences uuid[] default '{}',
  p_blue_preferences uuid[] default '{}'
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
    order by rating_gap, random()
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

create or replace function public.record_match(
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
begin
  if not public.is_company_user() then
    raise exception 'Email aziendale non autorizzata';
  end if;

  v_all_players := p_red_players || p_blue_players;
  if cardinality(p_red_players) <> 2
    or cardinality(p_blue_players) <> 2
    or (select count(distinct player_id) from unnest(v_all_players) player_id) <> 4 then
    raise exception 'La partita richiede due giocatori distinti per squadra';
  end if;

  if not (
    (p_red_score = 6 and p_blue_score between 0 and 5)
    or (p_blue_score = 6 and p_red_score between 0 and 5)
  ) then
    raise exception 'La partita termina a sei goal, senza scarto';
  end if;

  perform id
  from public.players
  where id = any(v_all_players) and active
  order by id
  for update;

  if (select count(*) from public.players where id = any(v_all_players) and active) <> 4 then
    raise exception 'Uno o più giocatori non sono attivi';
  end if;

  select avg(current_elo) into v_red_rating
  from public.players where id = any(p_red_players);
  select avg(current_elo) into v_blue_rating
  from public.players where id = any(p_blue_players);

  v_expected_red := 1 / (1 + power(10, (v_blue_rating - v_red_rating) / 400));
  v_actual_red := case when p_red_score = 6 then 1 else 0 end;
  v_red_delta := round((32 * (v_actual_red - v_expected_red))::numeric, 2);
  v_blue_delta := -v_red_delta;

  insert into public.matches (
    played_at, red_score, blue_score, created_by
  ) values (
    p_played_at, p_red_score, p_blue_score, auth.uid()
  ) returning id into v_match_id;

  insert into public.match_players (
    match_id, player_id, team, elo_before, elo_delta
  )
  select v_match_id, id, 'red'::public.team_color, current_elo, v_red_delta
  from public.players where id = any(p_red_players)
  union all
  select v_match_id, id, 'blue'::public.team_color, current_elo, v_blue_delta
  from public.players where id = any(p_blue_players);

  update public.players
  set current_elo = round(current_elo + v_red_delta, 2), updated_at = now()
  where id = any(p_red_players);

  update public.players
  set current_elo = round(current_elo + v_blue_delta, 2), updated_at = now()
  where id = any(p_blue_players);

  return v_match_id;
end;
$$;
create or replace function public.update_match(
  p_match_id uuid,
  p_red_score smallint,
  p_blue_score smallint,
  p_played_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_company_user() then
    raise exception 'Email aziendale non autorizzata';
  end if;

  if not (
    (p_red_score = 6 and p_blue_score between 0 and 5)
    or (p_blue_score = 6 and p_red_score between 0 and 5)
  ) then
    raise exception 'La partita termina a sei goal, senza scarto';
  end if;

  update public.matches
  set red_score = p_red_score,
      blue_score = p_blue_score,
      played_at = p_played_at,
      edited_at = now(),
      edited_by = auth.uid()
  where id = p_match_id;

  if not found then
    raise exception 'Partita non trovata';
  end if;

  perform public.recalculate_elo();
end;
$$;

revoke all on function public.is_company_user() from public, anon, authenticated;
grant execute on function public.is_company_user() to authenticated;

revoke all on function public.hook_restrict_signup_to_company(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_signup_to_company(jsonb) to supabase_auth_admin;

drop function public.is_approved();
