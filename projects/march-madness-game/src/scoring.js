import { currentScoring, owners, roundOrder, rounds, seedProbabilities } from "./data.js";

export function teamMap(teams) {
  return new Map(teams.map((team) => [team.name, team]));
}

export function pointsFor(scoring, seed, round) {
  return scoring[seed][roundOrder[round]];
}

export function earnedPointsByTeam(teams, games, scoring = currentScoring) {
  const byName = teamMap(teams);
  const totals = new Map(teams.map((team) => [team.name, 0]));

  for (const game of games) {
    if (!game.winner) continue;
    const winner = byName.get(game.winner);
    if (!winner) continue;
    totals.set(winner.name, totals.get(winner.name) + pointsFor(scoring, winner.seed, game.round));
  }

  return totals;
}

export function standings(teams, games, scoring = currentScoring) {
  const earned = earnedPointsByTeam(teams, games, scoring);
  const ownerTotals = new Map(owners.map((owner) => [owner, 0]));

  for (const team of teams) {
    ownerTotals.set(team.owner, ownerTotals.get(team.owner) + earned.get(team.name));
  }

  return owners
    .map((owner) => ({ owner, points: ownerTotals.get(owner) }))
    .sort((a, b) => b.points - a.points);
}

export function unresolvedGames(games) {
  return games.filter((game) => !game.winner);
}

export function remainingOutcomesForGame(game, teams, scoring = currentScoring) {
  const byName = teamMap(teams);
  return [game.topTeam, game.bottomTeam].map((teamName) => {
    const team = byName.get(teamName);
    return {
      team: team.name,
      owner: team.owner,
      seed: team.seed,
      round: game.round,
      points: pointsFor(scoring, team.seed, game.round)
    };
  });
}

export function trueMaxStandings(teams, games, scoring = currentScoring) {
  const current = new Map(standings(teams, games, scoring).map((row) => [row.owner, row.points]));
  const unresolved = unresolvedGames(games);

  for (const game of unresolved) {
    const outcomes = remainingOutcomesForGame(game, teams, scoring);
    for (const owner of owners) {
      const best = Math.max(0, ...outcomes.filter((outcome) => outcome.owner === owner).map((outcome) => outcome.points));
      current.set(owner, current.get(owner) + best);
    }
  }

  return owners
    .map((owner) => ({ owner, max: current.get(owner) }))
    .sort((a, b) => b.max - a.max);
}

export function expectedRemainingByTeam(teams, games, scoring = currentScoring, probabilities = seedProbabilities) {
  const unresolved = unresolvedGames(games);
  const remaining = new Map(teams.map((team) => [team.name, 0]));

  for (const game of unresolved) {
    const outcomes = remainingOutcomesForGame(game, teams, scoring);
    const weights = outcomes.map((outcome) => {
      const probability = probabilities[outcome.seed][roundOrder[outcome.round]] || 0;
      return { ...outcome, probability };
    });
    const totalWeight = weights.reduce((sum, outcome) => sum + outcome.probability, 0) || weights.length;

    for (const outcome of weights) {
      const normalizedProbability = totalWeight === weights.length ? 1 / weights.length : outcome.probability / totalWeight;
      remaining.set(outcome.team, remaining.get(outcome.team) + outcome.points * normalizedProbability);
    }
  }

  return remaining;
}

export function expectedStandings(teams, games, scoring = currentScoring, probabilities = seedProbabilities) {
  const current = new Map(standings(teams, games, scoring).map((row) => [row.owner, row.points]));
  const remaining = expectedRemainingByTeam(teams, games, scoring, probabilities);

  for (const team of teams) {
    current.set(team.owner, current.get(team.owner) + remaining.get(team.name));
  }

  return owners
    .map((owner) => ({ owner, expected: current.get(owner) }))
    .sort((a, b) => b.expected - a.expected);
}

export function teamRows(teams, games, scoring = currentScoring) {
  const earned = earnedPointsByTeam(teams, games, scoring);
  const expectedRemaining = expectedRemainingByTeam(teams, games, scoring);
  const unresolved = unresolvedGames(games);

  return teams.map((team) => {
    const remaining = unresolved
      .filter((game) => game.topTeam === team.name || game.bottomTeam === team.name)
      .reduce((sum, game) => sum + pointsFor(scoring, team.seed, game.round), 0);
    return { ...team, points: earned.get(team.name), remaining, expectedRemaining: expectedRemaining.get(team.name) };
  });
}

export function probabilityBasedScoring(probabilities = seedProbabilities, roundExpectedValues = [0.8, 1.25, 1.8, 2.5, 3.2, 4], cap = 250) {
  const probabilityFloors = [0.01, 0.01, 0.006, 0.004, 0.0025, 0.0015];
  const matrix = {};

  for (let seed = 1; seed <= 16; seed += 1) {
    matrix[seed] = rounds.map((round, index) => {
      const probability = Math.max(probabilities[seed][index] || 0, probabilityFloors[index]);
      return Math.min(cap, Math.max(1, Math.round(roundExpectedValues[index] / probability)));
    });
  }

  return matrix;
}

export function scoringSummary(current = currentScoring, optimized = probabilityBasedScoring()) {
  return rounds.map((round, index) => {
    const currentOneSeed = current[1][index];
    const currentCinderella = current[12][index];
    const optimizedOneSeed = optimized[1][index];
    const optimizedCinderella = optimized[12][index];

    return {
      round,
      currentOneSeed,
      currentCinderella,
      optimizedOneSeed,
      optimizedCinderella,
      currentRatio: currentOneSeed === 0 ? null : currentCinderella / currentOneSeed,
      optimizedRatio: optimizedOneSeed === 0 ? null : optimizedCinderella / optimizedOneSeed
    };
  });
}
