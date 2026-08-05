create extension pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table public.monthly_champions (
  month_start date not null,
  player_id uuid not null references public.players(id) on delete restrict,
  elo_gained numeric(10, 2) not null,
  awarded_at timestamptz not null default now(),
  primary key (month_start, player_id),
  constraint monthly_champions_month_start_check
    check (month_start = date_trunc('month', month_start)::date),
  constraint monthly_champions_positive_elo_check check (elo_gained > 0)
);

alter table public.monthly_champions enable row level security;

create policy "Monthly champions are publicly readable"
on public.monthly_champions
for select
to anon, authenticated
using (true);

grant select on public.monthly_champions to anon, authenticated;

create or replace view public.monthly_elo_rankings
with (security_invoker = true)
as
select
  totals.month_start,
  totals.player_id,
  totals.elo_gained,
  dense_rank() over (
    partition by totals.month_start
    order by totals.elo_gained desc
  ) as rank
from (
  select
    date_trunc(
      'month',
      matches.played_at at time zone 'Europe/Rome'
    )::date as month_start,
    match_players.player_id,
    round(sum(match_players.elo_delta), 2) as elo_gained
  from public.matches
  join public.match_players on match_players.match_id = matches.id
  group by month_start, match_players.player_id
) as totals;

grant select on public.monthly_elo_rankings to anon, authenticated;

create or replace function public.finalize_monthly_champions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_month date := date_trunc(
    'month',
    now() at time zone 'Europe/Rome'
  )::date;
  v_inserted integer;
begin
  insert into public.monthly_champions (
    month_start,
    player_id,
    elo_gained
  )
  select
    rankings.month_start,
    rankings.player_id,
    rankings.elo_gained
  from public.monthly_elo_rankings as rankings
  where rankings.month_start < v_current_month
    and rankings.rank = 1
    and rankings.elo_gained > 0
  on conflict (month_start, player_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.finalize_monthly_champions()
from public, anon, authenticated;

select public.finalize_monthly_champions();

select cron.schedule(
  'finalize-monthly-champions',
  '5 3 1 * *',
  $$select public.finalize_monthly_champions()$$
);
