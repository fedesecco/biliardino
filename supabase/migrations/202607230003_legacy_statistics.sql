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
  end as win_rate
from public.players p
left join public.match_players mp on mp.player_id = p.id
left join public.matches m on m.id = mp.match_id
group by p.id;
