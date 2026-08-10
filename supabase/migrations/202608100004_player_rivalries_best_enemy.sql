drop view if exists public.player_rivalries;

create or replace view public.player_rivalries
with (security_invoker = true)
as
with pair_stats as (
  select
    self.player_id,
    other.player_id as counterpart_id,
    count(*) filter (where self.team = other.team)::integer as shared_games,
    count(*) filter (where self.team <> other.team)::integer as opponent_games,
    round(
      sum(
        case
          when self.team = other.team then self.elo_delta
          else 0
        end
      ),
      2
    ) as elo_net_with,
    round(
      sum(
        case
          when self.team <> other.team then self.elo_delta
          else 0
        end
      ),
      2
    ) as elo_net_against
  from public.match_players as self
  join public.match_players as other
    on other.match_id = self.match_id
   and other.player_id <> self.player_id
  group by self.player_id, other.player_id
),
ranked_friends as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.elo_net_with
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.elo_net_with > 0
  order by
    stats.player_id,
    stats.elo_net_with desc,
    stats.shared_games desc,
    counterpart.name,
    counterpart.id
),
ranked_worst_friends as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.elo_net_with
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.elo_net_with < 0
  order by
    stats.player_id,
    stats.elo_net_with asc,
    stats.shared_games desc,
    counterpart.name,
    counterpart.id
),
ranked_best_enemies as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.elo_net_against
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.elo_net_against > 0
  order by
    stats.player_id,
    stats.elo_net_against desc,
    stats.opponent_games desc,
    counterpart.name,
    counterpart.id
),
ranked_worst_enemies as (
  select distinct on (stats.player_id)
    stats.player_id,
    stats.counterpart_id,
    counterpart.name as counterpart_name,
    stats.elo_net_against
  from pair_stats as stats
  join public.players as counterpart on counterpart.id = stats.counterpart_id
  where stats.elo_net_against < 0
  order by
    stats.player_id,
    stats.elo_net_against asc,
    stats.opponent_games desc,
    counterpart.name,
    counterpart.id
)
select
  players.id as player_id,
  friends.counterpart_id as best_friend_id,
  friends.counterpart_name as best_friend_name,
  friends.elo_net_with as best_friend_elo_net,
  worst_friends.counterpart_id as worst_friend_id,
  worst_friends.counterpart_name as worst_friend_name,
  worst_friends.elo_net_with as worst_friend_elo_net,
  best_enemies.counterpart_id as best_enemy_id,
  best_enemies.counterpart_name as best_enemy_name,
  best_enemies.elo_net_against as best_enemy_elo_net,
  worst_enemies.counterpart_id as worst_enemy_id,
  worst_enemies.counterpart_name as worst_enemy_name,
  worst_enemies.elo_net_against as worst_enemy_elo_net
from public.players
left join ranked_friends as friends on friends.player_id = players.id
left join ranked_worst_friends as worst_friends
  on worst_friends.player_id = players.id
left join ranked_best_enemies as best_enemies
  on best_enemies.player_id = players.id
left join ranked_worst_enemies as worst_enemies
  on worst_enemies.player_id = players.id;

grant select on public.player_rivalries to anon, authenticated;
