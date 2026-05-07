create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text,
  display_name text not null,
  favorite_team_id text null,
  avatar_url text null,
  profile_visibility text not null default 'followers_only',
  following_ids text[] not null default '{}',
  has_completed_onboarding boolean not null default false,
  shared_games_logged integer not null default 0,
  shared_stadiums_visited integer not null default 0,
  shared_home_runs_witnessed integer not null default 0,
  shared_level_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_profile_visibility_check;

alter table public.profiles
  add constraint profiles_profile_visibility_check
  check (profile_visibility in ('public', 'followers_only', 'private'));

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  venue_id text not null,
  attended_on date not null,
  seat_section text not null,
  seat_row text null,
  seat_number text null,
  witnessed_events jsonb not null default '[]'::jsonb,
  memorable_moment text null,
  companion text null,
  giveaway text null,
  weather text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_follows_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  constraint user_follows_not_self check (follower_id <> following_id),
  constraint user_follows_unique unique (follower_id, following_id)
);

create index if not exists profiles_username_lower_unique
on public.profiles (lower(username));

create index if not exists profiles_display_name_idx
on public.profiles (display_name);

create index if not exists profiles_email_lower_idx
on public.profiles (lower(email));

create index if not exists attendance_logs_user_id_idx
on public.attendance_logs (user_id);

create index if not exists attendance_logs_user_id_attended_on_idx
on public.attendance_logs (user_id, attended_on desc);

create index if not exists user_follows_follower_status_idx
on public.user_follows (follower_id, status, created_at desc);

create index if not exists user_follows_following_status_idx
on public.user_follows (following_id, status, created_at desc);

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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists attendance_logs_set_updated_at on public.attendance_logs;
create trigger attendance_logs_set_updated_at
before update on public.attendance_logs
for each row
execute function public.set_updated_at();

drop trigger if exists user_follows_set_updated_at on public.user_follows;
create trigger user_follows_set_updated_at
before update on public.user_follows
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_assign_unique_username on public.profiles;
create trigger profiles_assign_unique_username
before insert or update of display_name, username
on public.profiles
for each row
execute function public.assign_unique_profile_username();

alter table public.profiles enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.user_follows enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "attendance_logs_select_own" on public.attendance_logs;
create policy "attendance_logs_select_own"
on public.attendance_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "attendance_logs_insert_own" on public.attendance_logs;
create policy "attendance_logs_insert_own"
on public.attendance_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "attendance_logs_update_own" on public.attendance_logs;
create policy "attendance_logs_update_own"
on public.attendance_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "attendance_logs_delete_own" on public.attendance_logs;
create policy "attendance_logs_delete_own"
on public.attendance_logs
for delete
to authenticated
using (auth.uid() = user_id);

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
  and status = 'accepted'
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
  shared_home_runs_witnessed integer,
  shared_level_title text,
  relationship_status text
)
language sql
security definer
set search_path = public
as $$
  with normalized_query as (
    select
      nullif(btrim(search_query), '') as raw_query,
      nullif(lower(btrim(search_query)), '') as raw_query_lower,
      nullif(regexp_replace(lower(btrim(search_query)), '^@+', ''), '') as username_query
  )
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.favorite_team_id,
    p.avatar_url,
    p.profile_visibility,
    case
      when p.profile_visibility in ('public', 'followers_only')
        and exists (
          select 1
          from public.user_follows uf_access
          where uf_access.follower_id = auth.uid()
            and uf_access.following_id = p.id
            and uf_access.status = 'accepted'
        )
      then p.shared_games_logged
      when p.profile_visibility = 'public' then p.shared_games_logged
      else null
    end as shared_games_logged,
    case
      when p.profile_visibility in ('public', 'followers_only')
        and exists (
          select 1
          from public.user_follows uf_access
          where uf_access.follower_id = auth.uid()
            and uf_access.following_id = p.id
            and uf_access.status = 'accepted'
        )
      then p.shared_stadiums_visited
      when p.profile_visibility = 'public' then p.shared_stadiums_visited
      else null
    end as shared_stadiums_visited,
    case
      when p.profile_visibility in ('public', 'followers_only')
        and exists (
          select 1
          from public.user_follows uf_access
          where uf_access.follower_id = auth.uid()
            and uf_access.following_id = p.id
            and uf_access.status = 'accepted'
        )
      then p.shared_home_runs_witnessed
      when p.profile_visibility = 'public' then p.shared_home_runs_witnessed
      else null
    end as shared_home_runs_witnessed,
    case
      when p.profile_visibility in ('public', 'followers_only')
        and exists (
          select 1
          from public.user_follows uf_access
          where uf_access.follower_id = auth.uid()
            and uf_access.following_id = p.id
            and uf_access.status = 'accepted'
        )
      then p.shared_level_title
      when p.profile_visibility = 'public' then p.shared_level_title
      else null
    end as shared_level_title,
    coalesce(uf.status, 'not_following') as relationship_status
  from public.profiles p
  cross join normalized_query q
  left join public.user_follows uf
    on uf.follower_id = auth.uid()
   and uf.following_id = p.id
  where auth.uid() is not null
    and p.id <> auth.uid()
    and (
      q.raw_query is null
      or lower(coalesce(p.username, '')) = q.username_query
      or lower(coalesce(p.username, '')) like '%' || q.username_query || '%'
      or p.display_name ilike '%' || q.raw_query || '%'
      or lower(p.email) = q.raw_query_lower
    )
  order by
    case
      when q.raw_query is null then 5
      when lower(coalesce(p.username, '')) = q.username_query then 0
      when lower(coalesce(p.username, '')) like q.username_query || '%' then 1
      when lower(coalesce(p.username, '')) like '%' || q.username_query || '%' then 2
      when p.display_name ilike '%' || q.raw_query || '%' then 3
      when lower(p.email) = q.raw_query_lower then 4
      else 5
    end,
    case
      when q.raw_query is not null and lower(coalesce(p.username, '')) = q.username_query then lower(coalesce(p.username, ''))
      when q.raw_query is not null and lower(coalesce(p.username, '')) like q.username_query || '%' then lower(coalesce(p.username, ''))
      else lower(p.display_name)
    end asc,
    p.display_name asc
  limit 15;
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
  shared_home_runs_witnessed integer,
  shared_level_title text,
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
    p.shared_home_runs_witnessed,
    p.shared_level_title,
    'accepted'::text as relationship_status
  from public.user_follows uf
  join public.profiles p
    on p.id = uf.following_id
  where uf.follower_id = auth.uid()
    and uf.status = 'accepted'
  order by uf.created_at desc;
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
  shared_home_runs_witnessed integer,
  shared_level_title text,
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
    p.shared_home_runs_witnessed,
    p.shared_level_title,
    'accepted'::text as relationship_status
  from public.user_follows uf
  join public.profiles p
    on p.id = uf.follower_id
  where uf.following_id = auth.uid()
    and uf.status = 'accepted'
  order by uf.created_at desc;
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
  shared_stadiums_visited integer,
  shared_home_runs_witnessed integer,
  shared_level_title text
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
    p.shared_stadiums_visited,
    p.shared_home_runs_witnessed,
    p.shared_level_title
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
  shared_home_runs_witnessed integer,
  shared_level_title text,
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
  followed_connection as (
    select exists (
      select 1
      from public.user_follows
      where status = 'accepted'
        and follower_id = auth.uid()
        and following_id = target_user_id
    ) as is_following
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
        or (select is_following from followed_connection)
      then p.shared_games_logged
      else null
    end as shared_games_logged,
    case
      when p.id = auth.uid()
        or p.profile_visibility = 'public'
        or (select is_following from followed_connection)
      then p.shared_stadiums_visited
      else null
    end as shared_stadiums_visited,
    case
      when p.id = auth.uid()
        or p.profile_visibility = 'public'
        or (select is_following from followed_connection)
      then p.shared_home_runs_witnessed
      else null
    end as shared_home_runs_witnessed,
    case
      when p.id = auth.uid()
        or p.profile_visibility = 'public'
        or (select is_following from followed_connection)
      then p.shared_level_title
      else null
    end as shared_level_title,
    coalesce((select status from relationship), 'not_following') as relationship_status
  from public.profiles p
  where p.id = target_user_id
  limit 1;
$$;

create or replace function public.get_following_activity_feed()
returns table (
  activity_id text,
  actor_user_id uuid,
  actor_display_name text,
  actor_username text,
  game_id text,
  venue_id text,
  attended_on date,
  activity_at timestamptz,
  activity_type text,
  memory_preview text,
  milestone_label text
)
language sql
security definer
set search_path = public
as $$
  with visible_users as (
    select auth.uid() as user_id
    union
    select uf.following_id as user_id
    from public.user_follows uf
    where uf.follower_id = auth.uid()
      and uf.status = 'accepted'
  ),
  visible_logs as (
    select
      l.id,
      l.user_id,
      l.game_id,
      l.venue_id,
      l.attended_on,
      l.memorable_moment,
      l.created_at,
      l.updated_at,
      p.display_name,
      p.username,
      row_number() over (
        partition by l.user_id
        order by l.attended_on asc, l.created_at asc, l.id asc
      ) as log_number
    from public.attendance_logs l
    join visible_users vu
      on vu.user_id = l.user_id
    join public.profiles p
      on p.id = l.user_id
  ),
  log_events as (
    select
      (id::text || ':log') as activity_id,
      user_id as actor_user_id,
      display_name as actor_display_name,
      username as actor_username,
      game_id,
      venue_id,
      attended_on,
      created_at as activity_at,
      'logged_game'::text as activity_type,
      null::text as memory_preview,
      null::text as milestone_label
    from visible_logs
  ),
  memory_events as (
    select
      (id::text || ':memory') as activity_id,
      user_id as actor_user_id,
      display_name as actor_display_name,
      username as actor_username,
      game_id,
      venue_id,
      attended_on,
      updated_at as activity_at,
      'added_memory'::text as activity_type,
      left(nullif(btrim(memorable_moment), ''), 240) as memory_preview,
      null::text as milestone_label
    from visible_logs
    where nullif(btrim(memorable_moment), '') is not null
  ),
  milestone_events as (
    select
      (id::text || ':milestone:' || log_number::text) as activity_id,
      user_id as actor_user_id,
      display_name as actor_display_name,
      username as actor_username,
      game_id,
      venue_id,
      attended_on,
      created_at as activity_at,
      'milestone_reached'::text as activity_type,
      null::text as memory_preview,
      case
        when log_number = 1 then 'Reached 1 logged game'
        when log_number = 5 then 'Reached 5 logged games'
        when log_number = 10 then 'Reached 10 logged games'
        when log_number = 25 then 'Reached 25 logged games'
        when log_number = 50 then 'Reached 50 logged games'
        else null
      end as milestone_label
    from visible_logs
    where log_number in (1, 5, 10, 25, 50)
  )
  select *
  from (
    select * from log_events
    union all
    select * from memory_events
    union all
    select * from milestone_events
  ) feed
  order by activity_at desc, activity_id desc
  limit 20;
$$;

create or replace function public.follow_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_row public.user_follows%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in again to manage follow relationships.';
  end if;

  if target_user_id is null then
    raise exception 'A target user is required.';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'You cannot follow yourself.';
  end if;

  select *
  into existing_row
  from public.user_follows
  where follower_id = auth.uid()
    and following_id = target_user_id
  limit 1;

  if found then
    if existing_row.status = 'accepted' then
      return;
    end if;

    if existing_row.status = 'blocked' then
      raise exception 'That profile is not available for new follow requests right now.';
    end if;

    update public.user_follows
    set status = 'accepted',
        updated_at = now()
    where id = existing_row.id;

    return;
  end if;

  insert into public.user_follows (
    follower_id,
    following_id,
    status
  )
  values (
    auth.uid(),
    target_user_id,
    'accepted'
  )
  on conflict (follower_id, following_id) do update
  set status = 'accepted',
      updated_at = now();
end;
$$;

create or replace function public.unfollow_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in again to manage follow relationships.';
  end if;

  if target_user_id is null then
    raise exception 'A target user is required.';
  end if;

  delete from public.user_follows
  where follower_id = auth.uid()
    and following_id = target_user_id;
end;
$$;

grant execute on function public.normalize_username(text) to authenticated;
grant execute on function public.generate_unique_username(text, uuid) to authenticated;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.get_following_profiles() to authenticated;
grant execute on function public.get_follower_profiles() to authenticated;
grant execute on function public.get_pending_follow_requests() to authenticated;
grant execute on function public.get_friend_profile(uuid) to authenticated;
grant execute on function public.get_following_activity_feed() to authenticated;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
