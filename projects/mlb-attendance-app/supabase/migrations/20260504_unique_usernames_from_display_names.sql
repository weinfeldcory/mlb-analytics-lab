alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_unique
on public.profiles (lower(username));

create or replace function public.normalize_username(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(
    nullif(
      regexp_replace(
        regexp_replace(
          lower(btrim(coalesce(input, ''))),
          '[^a-z0-9\s_-]+',
          '',
          'g'
        ),
        '[\s_-]+',
        '',
        'g'
      ),
      ''
    ),
    'fan'
  );
$$;

create or replace function public.generate_unique_username(desired_display_name text, target_user_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text := public.normalize_username(desired_display_name);
  candidate_username text := base_username;
  suffix integer := 1;
begin
  loop
    exit when not exists (
      select 1
      from public.profiles p
      where lower(p.username) = lower(candidate_username)
        and (target_user_id is null or p.id <> target_user_id)
    );

    candidate_username := base_username || suffix::text;
    suffix := suffix + 1;
  end loop;

  return candidate_username;
end;
$$;

create or replace function public.assign_unique_profile_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := public.generate_unique_username(new.display_name, new.id);
  return new;
end;
$$;

drop trigger if exists profiles_assign_unique_username on public.profiles;
create trigger profiles_assign_unique_username
before insert or update of display_name, username
on public.profiles
for each row
execute function public.assign_unique_profile_username();

do $$
declare
  profile_row record;
begin
  for profile_row in
    select id, display_name
    from public.profiles
    order by created_at asc, id asc
  loop
    update public.profiles
    set username = public.generate_unique_username(profile_row.display_name, profile_row.id)
    where id = profile_row.id;
  end loop;
end;
$$;

grant execute on function public.normalize_username(text) to authenticated;
grant execute on function public.generate_unique_username(text, uuid) to authenticated;
