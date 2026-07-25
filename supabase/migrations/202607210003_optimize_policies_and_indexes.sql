alter function public.is_approved() security invoker;

alter policy "Users read own profile"
on public.profiles
using (id = (select auth.uid()));

create index matches_created_by_idx on public.matches (created_by);
create index matches_edited_by_idx on public.matches (edited_by) where edited_by is not null;
