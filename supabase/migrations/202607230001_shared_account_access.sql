create or replace function public.is_company_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'biliardino@teleniasoftware.com';
$$;

create or replace function public.hook_restrict_signup_to_company(event jsonb)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when lower(coalesce(event -> 'user' ->> 'email', '')) = 'biliardino@teleniasoftware.com'
      then '{}'::jsonb
    else jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Registrazione non consentita.'
      )
    )
  end;
$$;
