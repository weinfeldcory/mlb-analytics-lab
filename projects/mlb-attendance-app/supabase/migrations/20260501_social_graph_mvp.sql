create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists profile_visibility text not null default 'followers_only',
  add column if not exists shared_games_logged integer not null default 0,
  add column if not exists shared_stadiums_visited integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_profile_visibility_check;

alter table public.profiles
  add constraint profiles_profile_visibility_check
  check (profile_visibility in ('public', 'followers_only', 'private'));

update public.profiles
set username = lower(
  regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]+', '-', 'g')
) || '-' || left(replace(id::text, '-', ''), 6)
where username is null or btrim(username) = '';

create unique index if not exists profiles_username_lower_unique
on public.profiles (lower(username));

create index if not exists profiles_display_name_idx
on public.profiles (display_name);

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_follows_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  constraint user_follows_not_self check (follower_id <> following_id),
  constraint user_follows_unique unique (follower_id, following_id)
);

create index if not exists user_follows_follower_status_idx
on public.user_follows (follower_id, status, created_at desc);

create index if not exists user_follows_following_status_idx
on public.user_follows (following_id, status, created_at desc);

drop trigger if exists user_follows_set_updated_at on public.user_follows;
create trigger user_follows_set_updated_at
before update on public.user_follows
for each row
execute function public.set_updated_at();

alter table public.user_follows enable row level security;

drop policy if exists "user_follows_select_involving_self" on public.user_follows;
create policy "user_follows_select_involving_self"
on public.user_follows
for select
to authenticated
using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "user_follows_insert_as_self" on public.user_follows;
create policy "user_follows_insert_as_self"
on public.user_follows
for insert
to authenticated
with check (
  auth.uid() = follower_id
  and follower_id <> following_id
  and status = 'pending'
);

drop policy if exists "user_follows_update_target_only" on public.user_follows;
create policy "user_follows_update_target_only"
on public.user_follows
for update
to authenticated
using (auth.uid() = following_id)
with check (
  auth.uid() = following_id
  and follower_id <> following_id
  and status in ('accepted', 'rejected', 'blocked')
);

drop policy if exists "user_follows_delete_involving_self" on public.user_follows;
create policy "user_follows_delete_involving_self"
on public.user_follows
for delete
to authenticated
using (auth.uid() = follower_id or auth.uid() = following_id);

create or replace function public.search_profiles(search_query text default null)
returns table (
  user_id uuid,
  username text,
  display_name text,
  favorite_team_id text,
  avatar_url text,
  profile_visibility text,
  shared_games_logged integer,
  shared_stadiums_visited integer,
  relationship_status text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    case
      when p.profile_visibility = 'public' then p.shared_games_logged
      else null
    end as shared_games_logged,
    case
      when p.profile_visibility = 'public' then p.shared_stadiums_visited
      else null
    end as shared_stadiums_visited,
    coalesce(uf.status, 'not_following') as relationship_status
  from public.profiles p
  left join public.user_follows uf
    on uf.follower_id = auth.uid()
   and uf.following_id = p.id
  where auth.uid() is not null
    and p.id <> auth.uid()
    and (
      search_query is null
      or search_query = ''
      or p.username ilike '%' || search_query || '%'
      or p.display_name ilike '%' || search_query || '%'
    )
  order by
    case
      when search_query is not null and p.username ilike search_query || '%' then 0
      when search_query is not null and p.display_name ilike search_query || '%' then 1
      else 2
    end,
    p.display_name asc
  limit 25;
$$;

create or replace function public.get_following_profiles()
returns table (
  user_id uuid,
  username text,
  display_name text,
  favorite_team_id text,
  avatar_url text,
  profile_visibility text,
  shared_games_logged integer,
  shared_stadiums_visited integer,
  relationship_status text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    p.shared_games_logged,
    p.shared_stadiums_visited,
    'accepted'::text as relationship_status
  from public.user_follows uf
  join public.profiles p
    on p.id = uf.following_id
  where uf.follower_id = auth.uid()
    and uf.status = 'accepted'
  order by p.display_name asc;
$$;

create or replace function public.get_follower_profiles()
returns table (
  user_id uuid,
  username text,
  display_name text,
  favorite_team_id text,
  avatar_url text,
  profile_visibility text,
  shared_games_logged integer,
  shared_stadiums_visited integer,
  relationship_status text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    p.shared_games_logged,
    p.shared_stadiums_visited,
    'accepted'::text as relationship_status
  from public.user_follows uf
  join public.profiles p
    on p.id = uf.follower_id
  where uf.following_id = auth.uid()
    and uf.status = 'accepted'
  order by p.display_name asc;
$$;

create or replace function public.get_pending_follow_requests()
returns table (
  id uuid,
  follower_id uuid,
  following_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  username text,
  display_name text,
  favorite_team_id text,
  avatar_url text,
  profile_visibility text,
  shared_games_logged integer,
  shared_stadiums_visited integer
)
language sql
security definer
set search_path = public
as $$
  select
    uf.id,
    uf.follower_id,
    uf.following_id,
    uf.status,
    uf.created_at,
    uf.updated_at,
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    p.shared_games_logged,
    p.shared_stadiums_visited
  from public.user_follows uf
  join public.profiles p
    on p.id = case
      when uf.following_id = auth.uid() then uf.follower_id
      else uf.following_id
    end
  where uf.status = 'pending'
    and (uf.following_id = auth.uid() or uf.follower_id = auth.uid())
  order by uf.created_at desc;
$$;

create or replace function public.get_friend_profile(target_user_id uuid)
returns table (
  user_id uuid,
  username text,
  display_name text,
  favorite_team_id text,
  avatar_url text,
  profile_visibility text,
  shared_games_logged integer,
  shared_stadiums_visited integer,
  relationship_status text
)
language sql
security definer
set search_path = public
as $$
  with relationship as (
    select status
    from public.user_follows
    where follower_id = auth.uid()
      and following_id = target_user_id
    limit 1
  ),
  accepted_connection as (
    select exists (
      select 1
      from public.user_follows
      where status = 'accepted'
        and (
          (follower_id = auth.uid() and following_id = target_user_id)
          or (follower_id = target_user_id and following_id = auth.uid())
        )
    ) as is_connected
  )
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    case
      when p.id = auth.uid()
        or p.profile_visibility = 'public'
        or (select is_connected from accepted_connection)
      then p.shared_games_logged
      else null
    end as shared_games_logged,
    case
      when p.id = auth.uid()
        or p.profile_visibility = 'public'
        or (select is_connected from accepted_connection)
      then p.shared_stadiums_visited
      else null
    end as shared_stadiums_visited,
    coalesce((select status from relationship), 'not_following') as relationship_status
  from public.profiles p
  where p.id = target_user_id
  limit 1;
$$;

grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.get_following_profiles() to authenticated;
grant execute on function public.get_follower_profiles() to authenticated;
grant execute on function public.get_pending_follow_requests() to authenticated;
grant execute on function public.get_friend_profile(uuid) to authenticated;
