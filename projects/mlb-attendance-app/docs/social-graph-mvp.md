# Social Graph MVP

Last updated: 2026-05-01

This document describes the first hosted social layer for Witnessed.

## Goal

Replace mocked friends/following data with real authenticated app users, while keeping attendance logs private by default.

## What This MVP Includes

- one hosted profile row per authenticated user
- searchable profile discovery by username and display name
- direct follow and unfollow
- unfollow flow
- privacy-safe friend profile pages
- fast facts for followed profiles

## What This MVP Does Not Include

- comments
- likes
- direct messages
- public feeds
- public leaderboards
- shared seat, companion, or memory-note details

## Schema

### `profiles`

User-owned profile metadata.

Fields used by the social graph:

- `id`
- `email`
- `username`
- `display_name`
- `favorite_team_id`
- `avatar_url`
- `profile_visibility`
- `shared_games_logged`
- `shared_stadiums_visited`

### `user_follows`

Relationship table between two authenticated users.

Fields:

- `id`
- `follower_id`
- `following_id`
- `status`
- `created_at`
- `updated_at`

Constraints:

- `follower_id <> following_id`
- unique pair on `follower_id, following_id`
- status limited to `pending | accepted | rejected | blocked`

## Privacy Defaults

Default profile visibility is `followers_only`.

That means:

- a signed-in user can still be discovered by username or display name
- non-followers do not get private attendance-log details
- only safe résumé-style counts are shared

No social screen in this MVP should expose:

- seat location
- companions
- memory notes
- raw attendance log rows

## RLS Model

### Profiles

Profiles remain user-owned for direct writes. Discovery and friend-profile reads happen through controlled database functions that return only safe public fields.

### User Follows

Policies allow:

- the follower to create a `pending` request from themselves
- either side to view relationships that involve them
- the target user to update incoming requests to `accepted`, `rejected`, or `blocked`
- either side to delete a relationship involving themselves

Policies do not allow:

- creating a relationship on behalf of another user
- reading arbitrary relationships between two other users
- modifying another user’s profile row

## App Flow

1. User creates or signs into a hosted account.
2. A hosted profile row is ensured automatically.
3. User searches for people by username or display name.
4. User follows directly.
5. Accepted follows appear in the Following section immediately.
6. Friend profile pages show only privacy-safe shared stats.

## Shared Stats In MVP

Current shared stats are intentionally narrow:

- display name
- username
- favorite team
- total games logged
- stadiums visited

Future shared stats can expand later, but only if they can be exposed without leaking private log content.

## Manual Steps After Shipping

1. Apply `supabase/migrations/20260501_social_graph_mvp.sql`.
2. Apply `supabase/migrations/20260502_prioritize_username_search.sql`.
3. Apply `supabase/migrations/20260503_direct_follow_and_shared_profile_stats.sql`.
4. Apply `supabase/migrations/20260504_unique_usernames_from_display_names.sql`.
5. Apply `supabase/migrations/20260506_follow_persistence_rpc.sql`.
6. Verify new hosted signups get populated `username` and visibility defaults.
3. Test:
   - search
   - direct follow
   - unfollow
   - friend profile visibility

## Open Follow-Ups

- add explicit profile-visibility controls in Profile
- add richer safe shared stats for accepted follows
- move current follow status and shared counters into dedicated server-side views if the shape expands
