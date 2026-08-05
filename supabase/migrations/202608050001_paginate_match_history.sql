create index matches_played_at_id_idx
on public.matches (played_at desc, id desc);
