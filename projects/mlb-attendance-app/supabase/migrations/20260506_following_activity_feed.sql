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

grant execute on function public.get_following_activity_feed() to authenticated;
