create table public.active_play (
  id boolean primary key default true check (id),
  round_id uuid,
  revision bigint not null default 0 check (revision >= 0),
  phase text not null default 'selection'
    check (phase in ('selection', 'playing', 'confirming', 'correcting')),
  candidates uuid[] not null default '{}',
  red_preferences uuid[] not null default '{}',
  blue_preferences uuid[] not null default '{}',
  balance_by_elo boolean not null default true,
  red_players uuid[] not null default '{}',
  blue_players uuid[] not null default '{}',
  red_score integer not null default 0 check (red_score between 0 and 6),
  blue_score integer not null default 0 check (blue_score between 0 and 6),
  updated_at timestamptz not null default now(),
  constraint active_play_no_draw_at_six check (red_score <> 6 or blue_score <> 6),
  constraint active_play_round_phase check (
    (phase = 'selection' and round_id is null
      and cardinality(red_players) = 0 and cardinality(blue_players) = 0
      and red_score = 0 and blue_score = 0)
    or (phase <> 'selection' and round_id is not null
      and cardinality(red_players) = 2 and cardinality(blue_players) = 2)
  ),
  constraint active_play_confirming_final check (
    phase <> 'confirming' or red_score = 6 or blue_score = 6
  )
);

insert into public.active_play (id) values (true);
alter table public.active_play enable row level security;
revoke all on public.active_play from public, anon, authenticated;
grant select on public.active_play to anon, authenticated;
create policy "Everyone reads active play"
on public.active_play for select to anon, authenticated using (true);
alter publication supabase_realtime add table public.active_play;

alter table public.matches add column source_round_id uuid;
alter table public.matches add constraint matches_source_round_id_key unique (source_round_id);

create function public.start_play(
  p_candidates uuid[],
  p_red_preferences uuid[],
  p_blue_preferences uuid[],
  p_balance_by_elo boolean,
  p_expected_revision bigint
)
returns public.active_play
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_play public.active_play;
  v_red uuid[];
  v_blue uuid[];
begin
  if not public.is_company_user() then
    raise exception 'Account condiviso richiesto' using errcode = '42501';
  end if;

  select * into strict v_play from public.active_play where id = true for update;
  if p_expected_revision is distinct from v_play.revision then
    raise exception 'La partita è cambiata. Riprova con lo stato aggiornato.' using errcode = '40001';
  end if;
  if v_play.phase <> 'selection' then
    raise exception 'Una partita è già in corso' using errcode = '22023';
  end if;

  if p_candidates is null or coalesce(array_ndims(p_candidates), 0) <> 1
    or cardinality(p_candidates) < 4
    or (select count(distinct candidate) from unnest(p_candidates) candidate) <> cardinality(p_candidates) then
    raise exception 'Seleziona almeno quattro candidati distinti e non nulli' using errcode = '22023';
  end if;
  if p_red_preferences is null or p_blue_preferences is null or p_balance_by_elo is null
    or coalesce(array_ndims(p_red_preferences), 1) <> 1
    or coalesce(array_ndims(p_blue_preferences), 1) <> 1
    or (select count(distinct preferred) from unnest(p_red_preferences) preferred) <> cardinality(p_red_preferences)
    or (select count(distinct preferred) from unnest(p_blue_preferences) preferred) <> cardinality(p_blue_preferences) then
    raise exception 'Preferenze o modalità di selezione non valide' using errcode = '22023';
  end if;

  -- Keep candidate status stable until the selected teams have been persisted.
  perform player.id from public.players player
  where player.id = any(p_candidates) order by player.id for update;
  if (select count(*) from public.players where id = any(p_candidates) and active) <> cardinality(p_candidates) then
    raise exception 'I candidati devono essere giocatori esistenti e attivi' using errcode = '22023';
  end if;

  select array_agg(picked.player_id order by picked.player_id) filter (where picked.team = 'red'),
    array_agg(picked.player_id order by picked.player_id) filter (where picked.team = 'blue')
  into v_red, v_blue
  from public.pick_teams(p_candidates, p_red_preferences, p_blue_preferences, p_balance_by_elo) picked;

  update public.active_play
  set round_id = gen_random_uuid(), revision = revision + 1, phase = 'playing',
    candidates = p_candidates, red_preferences = p_red_preferences,
    blue_preferences = p_blue_preferences, balance_by_elo = p_balance_by_elo,
    red_players = v_red, blue_players = v_blue, red_score = 0, blue_score = 0,
    updated_at = now()
  where id = true
  returning * into v_play;
  return v_play;
end;
$$;

create function public.mutate_play(
  p_round_id uuid,
  p_expected_revision bigint,
  p_action text,
  p_team public.team_color default null
)
returns public.active_play
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_play public.active_play;
  v_red uuid[];
  v_blue uuid[];
  v_match_id uuid;
begin
  if not public.is_company_user() then
    raise exception 'Account condiviso richiesto' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('goal', 'undo', 'correct', 'cancel', 'finish') then
    raise exception 'Azione non valida' using errcode = '22023';
  end if;
  if (p_action in ('goal', 'undo') and p_team is null)
    or (p_action not in ('goal', 'undo') and p_team is not null) then
    raise exception 'Squadra non valida per questa azione' using errcode = '22023';
  end if;

  select * into strict v_play from public.active_play where id = true for update;

  -- A retried finish observes the current slot, even after another round has begun.
  -- This check must precede round/revision checks and runs under the same slot lock.
  if p_action = 'finish' and exists (
    select 1 from public.matches where source_round_id = p_round_id
  ) then
    return v_play;
  end if;
  if p_round_id is null or p_round_id is distinct from v_play.round_id
    or p_expected_revision is distinct from v_play.revision then
    raise exception 'La partita è cambiata. Riprova con lo stato aggiornato.' using errcode = '40001';
  end if;
  if v_play.phase = 'selection' then
    raise exception 'Non è in corso alcuna partita' using errcode = '22023';
  end if;

  case p_action
    when 'goal' then
      if v_play.phase not in ('playing', 'correcting') then
        raise exception 'Conferma il risultato o correggi il punteggio' using errcode = '22023';
      end if;
      if p_team = 'red' then
        v_play.red_score := v_play.red_score + 1;
      else
        v_play.blue_score := v_play.blue_score + 1;
      end if;
      if v_play.red_score > 6 or v_play.blue_score > 6
        or (v_play.red_score = 6 and v_play.blue_score = 6) then
        raise exception 'La partita termina a sei goal, senza scarto' using errcode = '22023';
      end if;
      if v_play.red_score = 6 or v_play.blue_score = 6 then
        v_play.phase := 'confirming';
      end if;
    when 'undo' then
      if (p_team = 'red' and v_play.red_score = 0)
        or (p_team = 'blue' and v_play.blue_score = 0) then
        raise exception 'Il punteggio non può essere negativo' using errcode = '22023';
      end if;
      if p_team = 'red' then
        v_play.red_score := v_play.red_score - 1;
      else
        v_play.blue_score := v_play.blue_score - 1;
      end if;
      if v_play.phase = 'confirming' and v_play.red_score < 6 and v_play.blue_score < 6 then
        v_play.phase := 'correcting';
      end if;
    when 'correct' then
      if v_play.phase <> 'confirming' then
        raise exception 'Il risultato non è in attesa di conferma' using errcode = '22023';
      end if;
      v_play.phase := 'correcting';
    when 'cancel' then
      v_play.phase := 'selection';
      v_play.round_id := null;
      v_play.red_players := '{}';
      v_play.blue_players := '{}';
      v_play.red_score := 0;
      v_play.blue_score := 0;
    when 'finish' then
      if v_play.phase <> 'confirming'
        or not ((v_play.red_score = 6 and v_play.blue_score between 0 and 5)
          or (v_play.blue_score = 6 and v_play.red_score between 0 and 5)) then
        raise exception 'Conferma un risultato finale valido' using errcode = '22023';
      end if;

      -- Reuse the authoritative ELO, exclusion and win-streak implementation.
      v_match_id := public.record_match(v_play.candidates, v_play.red_players,
        v_play.blue_players, v_play.red_score::smallint, v_play.blue_score::smallint);
      update public.matches set source_round_id = v_play.round_id where id = v_match_id;

      -- record_match holds candidate locks and has already updated exclusion counts.
      select array_agg(picked.player_id order by picked.player_id) filter (where picked.team = 'red'),
        array_agg(picked.player_id order by picked.player_id) filter (where picked.team = 'blue')
      into v_red, v_blue
      from public.pick_teams(v_play.candidates, v_play.red_preferences,
        v_play.blue_preferences, v_play.balance_by_elo) picked;
      v_play.round_id := gen_random_uuid();
      v_play.phase := 'playing';
      v_play.red_players := v_red;
      v_play.blue_players := v_blue;
      v_play.red_score := 0;
      v_play.blue_score := 0;
  end case;

  update public.active_play
  set round_id = v_play.round_id, revision = revision + 1, phase = v_play.phase,
    red_players = v_play.red_players, blue_players = v_play.blue_players,
    red_score = v_play.red_score, blue_score = v_play.blue_score, updated_at = now()
  where id = true
  returning * into v_play;
  return v_play;
end;
$$;

revoke all on function public.start_play(uuid[], uuid[], uuid[], boolean, bigint) from public, anon, authenticated;
revoke all on function public.mutate_play(uuid, bigint, text, public.team_color) from public, anon, authenticated;
grant execute on function public.start_play(uuid[], uuid[], uuid[], boolean, bigint) to authenticated;
grant execute on function public.mutate_play(uuid, bigint, text, public.team_color) to authenticated;

-- These remain internal helpers; browser callers must use the shared slot RPCs.
revoke all on function public.pick_teams(uuid[], uuid[], uuid[], boolean) from public, anon, authenticated;
revoke all on function public.record_match(uuid[], uuid[], uuid[], smallint, smallint, timestamptz) from public, anon, authenticated;
