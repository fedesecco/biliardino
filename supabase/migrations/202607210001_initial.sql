create extension if not exists pgcrypto;

create type public.team_color as enum ('red', 'blue');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 40),
  avatar_color text not null default '#7c8cff' check (avatar_color ~ '^#[0-9a-fA-F]{6}$'),
  current_elo numeric(8, 2) not null default 1000,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index players_name_unique on public.players (lower(trim(name)));

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz not null default now(),
  red_score smallint not null check (red_score between 0 and 6),
  blue_score smallint not null check (blue_score between 0 and 6),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  edited_at timestamptz,
  edited_by uuid references auth.users(id),
  constraint valid_final_score check (
    (red_score = 6 and blue_score < 6)
    or (blue_score = 6 and red_score < 6)
  )
);

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id),
  team public.team_color not null,
  elo_before numeric(8, 2) not null,
  elo_delta numeric(8, 2) not null,
  primary key (match_id, player_id)
);

create index matches_played_at_idx on public.matches (played_at desc);
create index match_players_player_idx on public.match_players (player_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select approved from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Everyone reads players"
on public.players for select
to anon, authenticated
using (true);

create policy "Approved users create players"
on public.players for insert
to authenticated
with check (public.is_approved());

create policy "Approved users update players"
on public.players for update
to authenticated
using (public.is_approved())
with check (public.is_approved());

create policy "Everyone reads matches"
on public.matches for select
to anon, authenticated
using (true);

create policy "Everyone reads match players"
on public.match_players for select
to anon, authenticated
using (true);

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
    where (mp.team = 'red' and m.red_score = 6)
       or (mp.team = 'blue' and m.blue_score = 6)
  )::integer as wins,
  count(m.id) filter (
    where (mp.team = 'red' and m.blue_score = 6)
       or (mp.team = 'blue' and m.red_score = 6)
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
        where (mp.team = 'red' and m.red_score = 6)
           or (mp.team = 'blue' and m.blue_score = 6)
      ) / count(m.id),
      1
    )
  end as win_rate
from public.players p
left join public.match_players mp on mp.player_id = p.id
left join public.matches m on m.id = mp.match_id
group by p.id;

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
  if not public.is_approved() then
    raise exception 'Account non approvato';
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
  if not public.is_approved() then
    raise exception 'Account non approvato';
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
  update public.players set current_elo = 1000;

  for current_match in
    select * from public.matches order by played_at, created_at, id
  loop
    select array_agg(player_id) into v_red_players
    from public.match_players
    where match_id = current_match.id and team = 'red';

    select array_agg(player_id) into v_blue_players
    from public.match_players
    where match_id = current_match.id and team = 'blue';

    select avg(current_elo) into v_red_rating
    from public.players where id = any(v_red_players);
    select avg(current_elo) into v_blue_rating
    from public.players where id = any(v_blue_players);

    v_expected_red := 1 / (1 + power(10, (v_blue_rating - v_red_rating) / 400));
    v_red_delta := round((
      32 * ((case when current_match.red_score = 6 then 1 else 0 end) - v_expected_red)
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

  update public.players set updated_at = now();
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
  if not public.is_approved() then
    raise exception 'Account non approvato';
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

grant usage on schema public to anon, authenticated;
grant select on public.players, public.matches, public.match_players to anon, authenticated;
grant select on public.player_statistics to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.players to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.recalculate_elo() from public;
revoke all on function public.is_approved() from public;
revoke all on function public.pick_teams(uuid[], uuid[], uuid[]) from public;
revoke all on function public.record_match(uuid[], uuid[], smallint, smallint, timestamptz) from public;
revoke all on function public.update_match(uuid, smallint, smallint, timestamptz) from public;

grant execute on function public.is_approved() to authenticated;
grant execute on function public.pick_teams(uuid[], uuid[], uuid[]) to authenticated;
grant execute on function public.record_match(uuid[], uuid[], smallint, smallint, timestamptz) to authenticated;
grant execute on function public.update_match(uuid, smallint, smallint, timestamptz) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.players, public.matches, public.match_players;
exception
  when duplicate_object then null;
end;
$$;
