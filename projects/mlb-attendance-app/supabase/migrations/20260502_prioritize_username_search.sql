create index if not exists profiles_email_lower_idx
on public.profiles (lower(email));

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
      when p.profile_visibility = 'public' then p.shared_games_logged
      else null
    end as shared_games_logged,
    case
      when p.profile_visibility = 'public' then p.shared_stadiums_visited
      else null
    end as shared_stadiums_visited,
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
