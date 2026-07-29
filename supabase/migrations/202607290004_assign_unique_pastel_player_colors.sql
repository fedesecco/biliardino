with palette(position, color) as (
  values
    (1, '#a8e6cf'),
    (2, '#ffd3a5'),
    (3, '#c7ceea'),
    (4, '#ffb7ce'),
    (5, '#b5ead7'),
    (6, '#e2f0cb'),
    (7, '#ffdac1'),
    (8, '#d5aaff'),
    (9, '#bde0fe'),
    (10, '#fde2e4'),
    (11, '#fff1a8'),
    (12, '#cde7be'),
    (13, '#f1c0e8'),
    (14, '#a9def9'),
    (15, '#e4c1f9'),
    (16, '#fbc4ab'),
    (17, '#b9fbc0'),
    (18, '#cfbaf0'),
    (19, '#f6d6ad'),
    (20, '#b8e0d2')
), ranked_players as (
  select id, row_number() over (order by created_at, id)::integer as position
  from public.players
), assignments as (
  select ranked_players.id, palette.color
  from ranked_players
  join palette using (position)
)
update public.players as player
set avatar_color = assignments.color,
    updated_at = now()
from assignments
where player.id = assignments.id;