# Derived Player Metrics

Status: Active  
Date: 2026-05-01

## Decision

For beta, the app should:
- compute and store **Pitcher Game Score**
- avoid labeling any hitter or player-level value metric as **WAR**

This keeps the product defensible while still unlocking meaningful performance insights.

## Why

The MLB Stats API provides strong box-score data for:
- innings pitched
- strikeouts
- walks
- hits allowed
- runs allowed
- home runs allowed

That is enough to compute a trustworthy pitcher performance score from a single game.

By contrast, WAR is not provided as a simple per-game public feed in the app's current data pipeline. Using the WAR label now would overstate precision.

## Current Metric

### Pitcher Game Score

The current implementation uses the modern MLB/Tango-style formula:

```text
40
+ 2 * outs recorded
+ strikeouts
- 2 * walks allowed
- 2 * hits allowed
- 3 * runs allowed
- 6 * home runs allowed
```

Implementation notes:
- only applied to pitchers classified as `starter`
- relievers do not currently receive a Game Score
- if the required input data is missing, the score is left undefined

## Product Uses

This enables beta surfaces such as:
- best pitching performances you saw in person
- strongest starts by a pitcher you have seen
- best start seen for a team, season, or venue

## Current Data Model Touchpoints

- `PitcherAppearance.gameScore`
- `PlayerPitchingSummary.bestGameScoreSeen`
- `PersonalStats.topPitchingGamePerformances`

## Explicit Non-Goal For Beta

Do not present:
- `WAR in this game`
- `best WAR game attended`

until the app has either:
- a documented in-house value model with a different name, or
- a trusted richer external source that supports the claim

## Next Candidates

After pitcher Game Score:
1. add stable `playerId` grouping across seasons and teams
2. enrich the full catalog with player data nightly
3. add a documented hitter `Game Impact Score`
4. surface best batting performances seen in person
