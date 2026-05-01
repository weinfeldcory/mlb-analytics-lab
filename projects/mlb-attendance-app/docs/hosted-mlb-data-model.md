# Hosted MLB Data Model

Date: 2026-05-01  
Status: Planning only  
Scope: move canonical MLB games and player appearances from static JSON into hosted Supabase tables without changing the existing domain/stat logic unnecessarily

## Why This Exists

Today the app has two different persistence layers:

- user-owned data in Supabase:
  - `profiles`
  - `attendance_logs`
- canonical MLB reference data in local JSON:
  - `apps/mobile/src/lib/data/mlbGameCatalog.json`
  - `apps/mobile/src/lib/data/userGameLogs.json`

The domain layer already knows how to work with:

- `Game`
- `BatterAppearance`
- `PitcherAppearance`

And `calculatePersonalStats` already derives player batting and pitching summaries from:

- `game.battersUsed`
- `game.pitchersUsed`

So the hosted migration should preserve that model and replace the source of truth underneath it, rather than rebuilding player summary logic inside SQL.

## Current Shape To Build On

### Domain model

The existing `Game` model already supports:

- canonical app `id`
- scores, hits, errors, innings
- `pitchersUsed`
- `battersUsed`

The existing appearance models already support:

- `BatterAppearance`
- `PitcherAppearance`

That means the hosted schema should map cleanly into the existing app shape instead of inventing a parallel stats model.

### Current JSON shape

The raw catalog/user-game JSON already uses a useful wire format:

- `gamePk`
- `date`
- `gameDate`
- `homeTeam`
- `awayTeam`
- `homeScore`
- `awayScore`
- `homeHits`
- `awayHits`
- `homeErrors`
- `awayErrors`
- `lineScore`
- `venue`
- `pitchers`
- `batters`

That is already close to what hosted canonical tables should store.

### Current attendance link

`attendance_logs.game_id` currently points at the app-layer game identifier, which is built in `mockSportsData.ts` as:

`game_${gamePk}`

That existing mapping is useful because it means the hosted canonical table can adopt the same app-facing ID and avoid rewriting attendance history.

## Recommended Hosted Tables

### 1. `mlb_games`

Purpose:

- one canonical row per MLB game
- stable join target for attendance logs
- stores core box score / schedule fields

Recommended columns:

- `id text primary key`
  - recommended value: `game_${gamePk}`
- `source_game_pk bigint not null unique`
- `sport text not null default 'MLB'`
- `game_date date not null`
- `game_datetime timestamptz null`
- `venue_source_id bigint null`
- `venue_name text not null`
- `home_team_source_id bigint not null`
- `away_team_source_id bigint not null`
- `home_score integer not null`
- `away_score integer not null`
- `home_hits integer not null`
- `away_hits integer not null`
- `home_errors integer null`
- `away_errors integer null`
- `innings integer null`
- `status text not null`
- `line_score jsonb null`
- `walk_off boolean null`
- `source text not null default 'mlb_statsapi'`
- `ingested_at timestamptz not null`
- `source_updated_at timestamptz null`
- `updated_at timestamptz not null`

### 2. `mlb_players`

Purpose:

- one canonical row per MLB player identity
- stable cross-game and cross-season lookup

Recommended columns:

- `player_id bigint primary key`
- `full_name text not null`
- `first_name text null`
- `last_name text null`
- `bats text null`
- `throws text null`
- `primary_position text null`
- `debut_date date null`
- `active_status text null`
- `source text not null default 'mlb_statsapi'`
- `ingested_at timestamptz not null`
- `source_updated_at timestamptz null`
- `updated_at timestamptz not null`
- `source_metadata jsonb null`

### 3. `mlb_game_batters`

Purpose:

- one batting line per game/player/team
- feeds `BatterAppearance`

Recommended columns:

- `id bigserial primary key`
- `game_id text not null references public.mlb_games(id) on delete cascade`
- `source_game_pk bigint not null`
- `player_id bigint null references public.mlb_players(player_id)`
- `source_player_id bigint null`
- `team_source_id bigint not null`
- `player_name text not null`
- `position text null`
- `at_bats integer not null default 0`
- `plate_appearances integer null`
- `hits integer not null default 0`
- `doubles integer not null default 0`
- `triples integer not null default 0`
- `home_runs integer not null default 0`
- `rbis integer not null default 0`
- `runs integer not null default 0`
- `strikeouts integer not null default 0`
- `walks integer not null default 0`
- `stolen_bases integer null`
- `source text not null default 'mlb_statsapi'`
- `ingested_at timestamptz not null`
- `source_updated_at timestamptz null`
- `updated_at timestamptz not null`

Recommended uniqueness:

- unique on `(game_id, team_source_id, coalesce(player_id, source_player_id), player_name)`

If Postgres expression-based uniqueness feels too awkward for first rollout, use:

- `(game_id, team_source_id, source_player_id)`

and allow null `source_player_id` only for exceptional legacy rows.

### 4. `mlb_game_pitchers`

Purpose:

- one pitching line per game/player/team
- feeds `PitcherAppearance`

Recommended columns:

- `id bigserial primary key`
- `game_id text not null references public.mlb_games(id) on delete cascade`
- `source_game_pk bigint not null`
- `player_id bigint null references public.mlb_players(player_id)`
- `source_player_id bigint null`
- `team_source_id bigint not null`
- `player_name text not null`
- `innings_pitched numeric(5,2) null`
- `hits_allowed integer not null default 0`
- `runs_allowed integer not null default 0`
- `earned_runs_allowed integer null`
- `strikeouts integer not null default 0`
- `walks_allowed integer null`
- `home_runs_allowed integer null`
- `pitches_thrown integer null`
- `strikes integer null`
- `role text null`
- `decision text null`
- `source text not null default 'mlb_statsapi'`
- `ingested_at timestamptz not null`
- `source_updated_at timestamptz null`
- `updated_at timestamptz not null`

Recommended uniqueness:

- `(game_id, team_source_id, source_player_id)`

### 5. `mlb_game_data_quality`

Purpose:

- keeps player-data completeness explicit
- prevents the app from silently treating missing arrays as real zeroes

Recommended columns:

- `game_id text primary key references public.mlb_games(id) on delete cascade`
- `source_game_pk bigint not null unique`
- `player_data_status text not null`
- `player_data_checked_at timestamptz null`
- `player_data_source text null`
- `player_data_warnings jsonb null`
- `source_payload_hash text null`
- `ingested_at timestamptz not null`
- `updated_at timestamptz not null`

## How `attendance_logs.game_id` Should Map

Recommendation:

- keep `attendance_logs.game_id` as the application-facing canonical key
- define `mlb_games.id` using the same string pattern already used in the app:
  - `game_${gamePk}`

Why:

- no immediate attendance-log rewrite
- domain objects already expect string IDs
- existing seeded and hosted attendance rows stay valid

Also store:

- `mlb_games.source_game_pk bigint unique not null`

That preserves the true MLB external identifier for imports and reingestion.

## Read Access And Policies

These canonical MLB tables are not user-owned content. They are shared reference data.

Recommended access model:

- client-facing reads should be public read-only
- no anonymous or authenticated client writes
- ingestion should happen through:
  - admin scripts
  - service-role jobs
  - future Edge Functions or backend jobs

Practical Supabase recommendation:

- enable RLS on these tables
- add `select` policies for `anon` and `authenticated`
- add no insert/update/delete policies for normal users

That gives:

- safe shared read access for the app
- no accidental client mutation

## Migration Path

### Phase 1: keep static JSON, enrich it fully

Immediate next step:

- enrich `mlbGameCatalog.json` with batter, pitcher, player ID, and player-data-status metadata

Reason:

- no app architecture rewrite required
- keeps current `mockSportsData.ts` flow working
- lets product/player-stat UI mature before a hosted catalog cutover

### Phase 2: create hosted canonical MLB tables

Once the enriched local catalog shape is stable:

1. create `mlb_games`
2. create `mlb_players`
3. create `mlb_game_batters`
4. create `mlb_game_pitchers`
5. create `mlb_game_data_quality`

### Phase 3: bulk import from enriched JSON

Import strategy:

1. load `mlb_games`
2. upsert `mlb_players`
3. upsert `mlb_game_batters`
4. upsert `mlb_game_pitchers`
5. upsert `mlb_game_data_quality`

Important:

- use `source_game_pk` and `source_player_id` as ingestion anchors
- keep imports idempotent

### Phase 4: swap app reads from local JSON to hosted reads

Replace:

- `mockSportsData.ts` static catalog read

With:

- hosted fetch for canonical games and appearances

The domain mapping should remain familiar:

- `mlb_games` -> `Game`
- `mlb_game_batters` -> `BatterAppearance`
- `mlb_game_pitchers` -> `PitcherAppearance`
- `mlb_game_data_quality` -> `Game.playerDataStatus` metadata

### Phase 5: keep player summaries in app/domain code

Do **not** duplicate `calculatePersonalStats` in SQL at first.

Reason:

- the app already has working player summary logic
- duplicating those aggregations in SQL now would create two competing truth sources

Recommended approach:

- canonical hosted tables provide raw facts
- domain code continues to calculate per-user summaries from the user’s attended games

Later, if scale requires it, precomputed hosted summary tables can be added intentionally.

## Why This Avoids Duplication

This plan reuses what already exists:

- existing app game identity
- existing appearance models
- existing stats logic
- existing attendance-log link

It changes only the source of canonical MLB facts:

- from static JSON
- to shared hosted tables

That is the right boundary. The hosted layer should store canonical game facts, not a second copy of personal-summary business logic.

## Approval Gate Before Migrations

Before implementing the actual migrations, confirm:

1. `mlb_games.id = game_${gamePk}` is the intended long-term app key
2. public read-only access is acceptable for canonical MLB tables
3. the enriched JSON wire shape is stable enough to import directly
4. player-data-quality should remain a separate table rather than being embedded entirely into `mlb_games`

