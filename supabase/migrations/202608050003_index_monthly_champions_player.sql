create index monthly_champions_player_id_idx
on public.monthly_champions (player_id, month_start desc);
