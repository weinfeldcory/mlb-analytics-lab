# Baseball Analytics App Export Field Glossary

## Purpose

This file documents the most important viewer-facing export fields for the current baseball analytics app.

It is not intended to list every intermediate modeling column. It documents the fields that matter most for:

- ranking players
- understanding blends
- interpreting roster-fit outputs
- debugging why a player appears where they do in the viewer

## Hitter Export

### Identity And Role

- `fg_player_id`
  FanGraphs player identifier used as the stable row key in the viewer.
- `player_name`
  Display name shown in the hitter board and roster builder.
- `team_2026`
  Current-season team assignment when available from live data or roster joins.
- `team_2025`
  Prior-season team fallback when current team is missing.
- `roster_position`
  Current roster position used for slot eligibility in the roster builder.
- `roster_role`
  Viewer-facing role label for how the player is expected to fit a roster.
- `position_bucket`
  Modeling position group used for offensive and roster-fit context.
- `archetype`
  High-level hitter style grouping used for player characterization.

### Core Ranking Fields

- `team_building_value_score`
  The main composite hitter score for the roster-construction use case.
- `blended_talent_score`
  Overall offensive quality after combining preseason priors with bounded current-season signal.
- `blended_playing_time_score`
  Expected lineup access and role stability after blending prior role expectation with current usage.
- `starter_probability_score`
  Likelihood the hitter holds a regular role.
- `upside_score`
  Ceiling-oriented view of the hitter's value if the role and talent break well.
- `floor_score`
  Stability-oriented view of the hitter's lower-end usable outcome.
- `stability_score`
  Reliability proxy combining sample confidence and role durability.
- `platoon_risk_score`
  Fragility proxy for role loss or reduced usage from platoon exposure.
- `projected_value_war_proxy`
  Projected overall value proxy used in the viewer as a WAR-like output.

### Projected Performance Fields

- `projected_pa`
  Projected plate appearances.
- `projected_games`
  Projected games played.
- `projected_woba`
  Projected wOBA after applying the model blend and age adjustments.
- `projected_woba_plus`
  Projected wOBA+ style quality measure for lineup strength comparisons.
- `projected_avg`
  Projected batting average.
- `projected_obp`
  Projected on-base percentage.
- `projected_slg`
  Projected slugging percentage.
- `projected_ops`
  Projected OPS.
- `projected_hits`
  Projected hits.
- `projected_walks`
  Projected walks.
- `projected_strikeouts`
  Projected strikeouts.
- `projected_home_runs`
  Projected home runs.
- `projected_stolen_bases`
  Projected stolen bases.
- `projected_defense_runs`
  Defensive run contribution estimate used in team-building value and roster rollups.

### Current-Season Signal Fields

- `current_games`
  Current games played in the live sample.
- `current_pa`
  Current plate appearances in the live sample.
- `current_avg`
  Current batting average.
- `current_obp`
  Current on-base percentage.
- `current_slg`
  Current slugging percentage.
- `current_woba`
  Current-season wOBA from live batting lines.
- `current_bb_rate`
  Current walk rate.
- `current_k_rate`
  Current strikeout rate.
- `current_hr_rate`
  Current home-run rate.
- `current_sb_rate`
  Current stolen-base rate.
- `pace_pa_162`
  162-game pace for plate appearances based on current team game count.
- `pace_home_runs_162`
  162-game pace for home runs.
- `pace_stolen_bases_162`
  162-game pace for stolen bases.

### Prior And Blend Trace Fields

- `prior_talent_score`
  Preseason quality prior before live-season blending.
- `prior_power_score`
  Prior estimate of home-run and impact-contact ability.
- `prior_plate_discipline_score`
  Prior estimate of walk/strikeout profile quality.
- `prior_speed_score`
  Prior estimate of speed and running value.
- `prior_position_value_score`
  Prior defensive/positional value estimate.
- `prior_playing_time_score`
  Preseason role and opportunity prior.
- `playing_time_reliability`
  Confidence weight used for projected opportunity.
- `discipline_reliability`
  Confidence weight for plate-discipline inputs.
- `contact_reliability`
  Confidence weight for contact inputs.
- `power_reliability`
  Confidence weight for power inputs.
- `speed_reliability`
  Confidence weight for speed inputs.
- `defense_reliability`
  Confidence weight for defensive value inputs.
- `weighted_pa_sample`
  Weighted sample size underlying the projection prior.
- `current_woba_diff`
  Difference between current and projected offensive quality used as an easy read on over- or under-performance.

## Pitcher Export

### Identity And Role

- `fg_player_id`
  FanGraphs player identifier used as the stable row key in the viewer.
- `player_name`
  Display name shown in the pitcher board and roster builder.
- `team_2026`
  Current-season team assignment when available from live data or roster joins.
- `team_2025`
  Prior-season team fallback when current team is missing.
- `roster_role`
  Viewer-facing roster role label.
- `projected_role_bucket`
  Model bucket used for slot eligibility and role-sensitive projection logic.
  Typical values include `starter`, `closer`, `high_leverage_reliever`, `swingman`, and `reliever`.

### Core Ranking Fields

- `team_building_value_score`
  Main composite pitcher score for roster construction.
- `blended_run_prevention_score`
  Quality score centered on preventing runs after blending priors and current-season performance.
- `blended_pitch_quality_score`
  Pitch-quality score driven by prior Statcast and shape indicators.
- `blended_playing_time_score`
  Opportunity score reflecting expected innings and role access.
- `upside_score`
  Ceiling-oriented pitcher value score.
- `floor_score`
  Lower-bound usable outcome score for roster construction.
- `projected_war`
  Projected pitcher WAR used as the main all-in value output.

### Projected Performance Fields

- `projected_ip`
  Projected innings pitched after role and durability adjustments.
- `projected_era`
  Projected ERA.
- `projected_whip`
  Projected WHIP.
- `projected_fip`
  Projected FIP.
- `projected_xfip`
  Projected xFIP.
- `projected_xera`
  Projected xERA.
- `projected_strikeouts`
  Projected strikeouts.
- `projected_walks`
  Projected walks allowed.
- `projected_hits_allowed`
  Projected hits allowed.
- `projected_home_runs_allowed`
  Projected home runs allowed.
- `projected_earned_runs`
  Projected earned runs allowed.
- `projected_runs_allowed`
  Projected runs allowed, which powers the team-level season estimate.
- `projected_starts`
  Projected starts for rotation usage.
- `projected_saves`
  Projected saves for relief role output.

### Current-Season Signal Fields

- `current_games`
  Current appearances in the live sample.
- `current_starts`
  Current starts in the live sample.
- `current_saves`
  Current saves in the live sample.
- `current_ip`
  Current innings pitched.
- `current_era`
  Current ERA from live pitching lines.
- `current_whip`
  Current WHIP.
- `current_strikeouts`
  Current strikeouts.
- `current_walks`
  Current walks.
- `current_hits_allowed`
  Current hits allowed.
- `current_home_runs_allowed`
  Current home runs allowed.
- `pace_ip_162`
  162-game pace for innings pitched based on current team game count.
- `pace_runs_allowed_162`
  162-game pace for runs allowed.
- `current_era_diff`
  Difference between current ERA and projected ERA for quick over- or under-performance context.

### Prior And Blend Trace Fields

- `weighted_ip_sample`
  Weighted prior innings sample across historical seasons used to build the base projection.
- `projected_ip_base`
  Base innings projection before role-specific final shaping.
- `projected_era_base`
  Base ERA projection before final adjustments.
- `projected_whip_base`
  Base WHIP projection before final adjustments.
- `projected_k_rate_base`
  Base strikeout-rate projection.
- `projected_bb_rate_base`
  Base walk-rate projection.
- `projected_stuff_plus_base`
  Base Stuff+ prior.
- `projected_location_plus_base`
  Base Location+ prior.
- `projected_pitching_plus_base`
  Base Pitching+ prior.
- `durability_age_factor`
  Age-related adjustment for workload durability.
- `skill_age_factor`
  Age-related adjustment for pitcher skill projection.
- `projected_start_share`
  Prior expectation of starting usage.
- `projected_save_share`
  Prior expectation of closer or end-game usage.

## Viewer Contract Notes

- The viewer's current rank-and-roster workflow depends first on `team_building_value_score`.
- Hitter and pitcher tables also rely on a smaller set of secondary fields for filters, cards, and slot summaries.
- If these fields change shape or meaning, update this glossary and the viewer together rather than treating the JSON as an informal dump.
