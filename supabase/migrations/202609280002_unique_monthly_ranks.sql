create or replace view public.monthly_elo_rankings
with (security_invoker = true)
as
select
  totals.month_start,
  totals.player_id,
  totals.elo_gained,
  row_number() over (
    partition by totals.month_start
    order by totals.elo_gained desc, totals.player_id
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
