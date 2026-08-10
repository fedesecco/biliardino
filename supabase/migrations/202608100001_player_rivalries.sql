create index if not exists match_players_player_match_idx
on public.match_players (player_id, match_id);

create or replace view public.player_rivalries
with (security_invoker = true)
as
with match_outcomes as (
  select
    mp.match_id,
    mp.player_id,
    mp.team,
    case
      when mp.team = 'red' then m.red_score > m.blue_score
      when mp.team = 'blue' then m.blue_score > m.red_score
    end as won
  from public.match_players as mp
  join public.matches as m on m.id = mp.match_id
),
pair_stats as (
  select
    self.player_id,
    other.player_id as counterpart_id,
    count(*) filter (where self.team = other.team)::integer as shared_games,
    count(*) filter (where self.team <> other.team)::integer as opponent_games,
    count(*) filter (
      where self.team = other.team and self.won
    )::integer as wins_with,
    count(*) filter (
      where self.team <> other.team and not self.won
    )::integer as losses_against
  from match_outcomes as self
  join match_outcomes as other
    on other.match_id = self.match_id
   and other.player_id <> self.player_id
  group by self.player_id, other.player_id
),
ranked_friends as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.wins_with
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.wins_with > 0
  order by
    stats.player_id,
    stats.wins_with desc,
    stats.shared_games desc,
    counterpart.name,
    counterpart.id
),
ranked_enemies as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.losses_against
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.losses_against > 0
  order by
    stats.player_id,
    stats.losses_against desc,
    stats.opponent_games desc,
    counterpart.name,
    counterpart.id
)
select
  players.id as player_id,
  friends.counterpart_id as best_friend_id,
  friends.counterpart_name as best_friend_name,
  friends.wins_with as best_friend_wins,
  enemies.counterpart_id as worst_enemy_id,
  enemies.counterpart_name as worst_enemy_name,
  enemies.losses_against as worst_enemy_losses
from public.players
left join ranked_friends as friends on friends.player_id = players.id
left join ranked_enemies as enemies on enemies.player_id = players.id;

grant select on public.player_rivalries to anon, authenticated;
