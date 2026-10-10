alter table public.players
  add column current_win_streak integer not null default 0,
  add constraint players_current_win_streak_check
    check (current_win_streak >= 0);

create or replace function public.recalculate_win_streaks(p_player_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  with target_players as (
    select id
    from public.players
    where id = any(p_player_ids)
  ),
  outcomes as (
    select
      mp.player_id,
      m.played_at,
      m.created_at,
      m.id,
      case
        when mp.team = 'red' then m.red_score > m.blue_score
        else m.blue_score > m.red_score
      end as won
    from public.match_players mp
    join public.matches m on m.id = mp.match_id
    where mp.player_id = any(p_player_ids)
  ),
  ordered as (
    select
      outcomes.*,
      count(*) filter (where not won) over (
        partition by player_id
        order by played_at desc, created_at desc, id desc
        rows between unbounded preceding and current row
      ) as losses_seen
    from outcomes
  ),
  streaks as (
    select
      player_id,
      count(*) filter (where won and losses_seen = 0)::integer
        as current_win_streak
    from ordered
    group by player_id
  )
  update public.players as player
  set current_win_streak = coalesce(streaks.current_win_streak, 0),
      updated_at = now()
  from target_players
  left join streaks on streaks.player_id = target_players.id
  where player.id = target_players.id;
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
  v_margin_multiplier numeric;
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
  v_elo_k numeric;
  v_margin_multiplier numeric;
begin
  update public.players
  set current_elo = 1000,
      current_win_streak = 0
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

    update public.players
    set current_win_streak = case
      when (
        id = any(v_red_players)
        and current_match.red_score > current_match.blue_score
      ) or (
        id = any(v_blue_players)
        and current_match.blue_score > current_match.red_score
      ) then current_win_streak + 1
      else 0
    end
    where id = any(v_red_players || v_blue_players);

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
    v_elo_k := case when current_match.elo_model_version = 2 then 28 else 32 end;
    v_margin_multiplier := case
      when current_match.elo_model_version = 2 then least(
        1.30::numeric,
        1 + 0.15::numeric * ln(
          (1 + abs(current_match.red_score - current_match.blue_score))::numeric
        )
      )
      else 1
    end;
    v_red_delta := round((
      v_elo_k
      * ((case when current_match.red_score > current_match.blue_score then 1 else 0 end) - v_expected_red)
      * v_margin_multiplier
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

create or replace view public.player_statistics
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.avatar_color,
  p.current_elo,
  count(m.id)::integer as games,
  count(m.id) filter (
    where (mp.team = 'red' and m.red_score > m.blue_score)
       or (mp.team = 'blue' and m.blue_score > m.red_score)
  )::integer as wins,
  count(m.id) filter (
    where (mp.team = 'red' and m.red_score < m.blue_score)
       or (mp.team = 'blue' and m.blue_score < m.red_score)
  )::integer as losses,
  coalesce(sum(
    case mp.team when 'red' then m.red_score when 'blue' then m.blue_score else 0 end
  ), 0)::integer as goals_for,
  coalesce(sum(
    case mp.team when 'red' then m.blue_score when 'blue' then m.red_score else 0 end
  ), 0)::integer as goals_against,
  coalesce(sum(
    case mp.team
      when 'red' then m.red_score - m.blue_score
      when 'blue' then m.blue_score - m.red_score
      else 0
    end
  ), 0)::integer as goal_diff,
  case
    when count(m.id) = 0 then 0
    else round(
      100.0 * count(m.id) filter (
        where (mp.team = 'red' and m.red_score > m.blue_score)
           or (mp.team = 'blue' and m.blue_score > m.red_score)
      ) / count(m.id),
      1
    )
  end as win_rate,
  p.current_win_streak
from public.players p
left join public.match_players mp on mp.player_id = p.id
left join public.matches m on m.id = mp.match_id
group by p.id;

do $$
declare
  v_player_ids uuid[];
begin
  select coalesce(array_agg(id), '{}'::uuid[])
  into v_player_ids
  from public.players;

  perform public.recalculate_win_streaks(v_player_ids);
end;
$$;

revoke all on function public.recalculate_win_streaks(uuid[])
from public, anon, authenticated;

grant select on public.player_statistics to anon, authenticated;
