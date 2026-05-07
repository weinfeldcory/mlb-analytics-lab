# Social Schema And RLS

Last updated: 2026-05-06

## Purpose

This document describes the current hosted social schema for Witnessed and the Row Level Security rules that protect it.

The goal is simple:

- users can find other profiles safely
- users can follow and unfollow only as themselves
- social queries expose only safe profile fields
- private attendance logs never become publicly queryable

## Tables

### `public.profiles`

User-owned profile metadata.

Important fields:

- `id` references `auth.users.id`
- `email`
- `display_name`
- `username`
- `favorite_team_id`
- `avatar_url`
- `profile_visibility`
- `shared_games_logged`
- `shared_stadiums_visited`
- `shared_home_runs_witnessed`
- `shared_level_title`

Notes:

- `username` is unique via `profiles_username_lower_unique`
- `profile_visibility` is constrained to `public | followers_only | private`
- `email` may be used for exact-match search inside a controlled function, but it is never returned to the client UI

### `public.user_follows`

Relationship table between authenticated users.

Fields:

- `follower_id`
- `following_id`
- `status`
- `created_at`
- `updated_at`

Constraints:

- `follower_id <> following_id`
- unique pair on `(follower_id, following_id)`
- `status` constrained to `pending | accepted | rejected | blocked`

Current product behavior is direct follow, so new follows are written as `accepted`.

## RLS Rules

### Profiles

Direct table access remains user-owned:

- users can read only their own profile row
- users can insert only their own profile row
- users can update only their own profile row

Cross-user discovery does not happen through raw profile table reads. It happens through security-definer RPCs that expose a safe, filtered result shape.

### Follows

`public.user_follows` RLS allows:

- `select` only for relationships involving the authenticated user
- `insert` only when `auth.uid() = follower_id`
- `delete` only for relationships involving the authenticated user
- `update` only for the followed user on rows involving them

This blocks spoofed follow creation on behalf of another user.

## Safe Search Surface

Profile search happens through `public.search_profiles(search_query text)`.

It supports:

- exact username match
- partial username match
- display-name match
- exact email match

It returns only safe fields:

- `user_id`
- `username`
- `display_name`
- `favorite_team_id`
- `avatar_url`
- `profile_visibility`
- shared summary counters
- relationship status

It does not return:

- `email`
- raw attendance logs
- seat details
- memory text
- companion/giveaway/weather notes

## Direct Follow RPCs

The hosted client now uses:

- `public.follow_user(target_user_id uuid)`
- `public.unfollow_user(target_user_id uuid)`

These functions:

- bind the acting user to `auth.uid()`
- reject self-follow
- preserve uniqueness with the table constraint
- prevent duplicate follow rows
- keep the client from depending on fragile direct table writes

## Operational Guidance

When the app ships social changes, keep these files aligned:

1. `supabase/schema.sql`
2. any new incremental migration
3. this document
4. app social-service assumptions

If those drift, search and follow flows become the first place users feel it.
