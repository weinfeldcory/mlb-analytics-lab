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

grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
