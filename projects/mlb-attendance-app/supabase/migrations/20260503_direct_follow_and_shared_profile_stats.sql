alter table public.profiles
  add column if not exists shared_home_runs_witnessed integer not null default 0,
  add column if not exists shared_level_title text;

update public.profiles
set shared_level_title = coalesce(nullif(shared_level_title, ''), 'Rookie Scorer')
where shared_level_title is null or btrim(shared_level_title) = '';

update public.user_follows
set status = 'accepted',
    updated_at = now()
where status = 'pending';

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
