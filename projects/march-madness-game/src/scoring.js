import {
  currentScoring,
  games as defaultGames,
  owners as defaultOwners,
  roundOrder,
  rounds,
  seedProbabilities,
  teams as defaultTeams
} from "./data.js";

export function deriveOwners(teams, ownerList = null) {
  if (Array.isArray(ownerList) && ownerList.length) {
    return ownerList.filter(Boolean);
  }

  const derived = [];
  const seen = new Set();

  for (const team of teams) {
    if (!team.owner || seen.has(team.owner)) continue;
    seen.add(team.owner);
    derived.push(team.owner);
  }

  return derived.length ? derived : defaultOwners;
}

export function teamMap(teams) {
  return new Map(teams.map((team) => [team.name, team]));
}

export function pointsFor(scoring, seed, round) {
  const roundIndex = roundOrder[round];
  if (roundIndex == null || !scoring[seed]) {
    return 0;
  }
  return scoring[seed][roundIndex] ?? 0;
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

export function standings(teams, games, scoring = currentScoring, ownerList = null) {
  const owners = deriveOwners(teams, ownerList);
  const earned = earnedPointsByTeam(teams, games, scoring);
  const ownerTotals = new Map(owners.map((owner) => [owner, 0]));

  for (const team of teams) {
    if (!ownerTotals.has(team.owner)) continue;
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

export function trueMaxStandings(teams, games, scoring = currentScoring, ownerList = null) {
  const owners = deriveOwners(teams, ownerList);
  const current = new Map(standings(teams, games, scoring, owners).map((row) => [row.owner, row.points]));
  const unresolved = unresolvedGames(games);
  const bracketProbabilities = bracketWinProbabilities(teams, games, seedProbabilities, { respectResults: true });

  for (const game of unresolved) {
    const winnerDistribution = bracketProbabilities.winnerDistributionsByGame.get(game) ?? new Map();
    const outcomes = [...winnerDistribution.keys()].map((teamName) => {
      const team = teamMap(teams).get(teamName);
      return team ? {
        team: team.name,
        owner: team.owner,
        seed: team.seed,
        round: game.round,
        points: pointsFor(scoring, team.seed, game.round)
      } : null;
    }).filter(Boolean);

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
  const bracketProbabilities = bracketWinProbabilities(teams, games, probabilities, { respectResults: true });

  for (const game of unresolved) {
    const winnerDistribution = bracketProbabilities.winnerDistributionsByGame.get(game) ?? new Map();

    for (const [teamName, probability] of winnerDistribution.entries()) {
      const team = teamMap(teams).get(teamName);
      if (!team) continue;
      remaining.set(team.name, remaining.get(team.name) + (pointsFor(scoring, team.seed, game.round) * probability));
    }
  }

  return remaining;
}

export function expectedStandings(teams, games, scoring = currentScoring, probabilities = seedProbabilities, ownerList = null) {
  const owners = deriveOwners(teams, ownerList);
  const current = new Map(standings(teams, games, scoring, owners).map((row) => [row.owner, row.points]));
  const remaining = expectedRemainingByTeam(teams, games, scoring, probabilities);

  for (const team of teams) {
    if (!current.has(team.owner)) continue;
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
  const bracketProbabilities = bracketWinProbabilities(teams, games, seedProbabilities, { respectResults: true });

  return teams.map((team) => {
    const remaining = unresolved.reduce((sum, game) => {
      const winnerDistribution = bracketProbabilities.winnerDistributionsByGame.get(game) ?? new Map();
      return winnerDistribution.has(team.name) ? sum + pointsFor(scoring, team.seed, game.round) : sum;
    }, 0);
    return { ...team, points: earned.get(team.name), remaining, expectedRemaining: expectedRemaining.get(team.name) };
  });
}

export function smoothedSeedProbabilities(probabilities = seedProbabilities, probabilityFloors = [0.01, 0.01, 0.006, 0.004, 0.0025, 0.0015]) {
  const matrix = {};

  for (let seed = 1; seed <= 16; seed += 1) {
    matrix[seed] = rounds.map((_, index) => Math.max(probabilities[seed][index] || 0, probabilityFloors[index]));
  }

  return matrix;
}

export function conditionalSeedWinProbabilities(probabilities = seedProbabilities, probabilityFloors = [0.01, 0.01, 0.006, 0.004, 0.0025, 0.0015]) {
  const smoothed = smoothedSeedProbabilities(probabilities, probabilityFloors);
  const matrix = {};

  for (let seed = 1; seed <= 16; seed += 1) {
    matrix[seed] = rounds.map((_, index) => {
      if (index === 0) {
        return Math.min(1, smoothed[seed][0]);
      }

      const previousReach = Math.max(smoothed[seed][index - 1], probabilityFloors[index - 1] || 0.000001);
      return Math.min(1, smoothed[seed][index] / previousReach);
    });
  }

  return matrix;
}

export function pairwiseSeedGameProbability(topSeed, bottomSeed, roundIndex, probabilities = seedProbabilities) {
  const conditional = conditionalSeedWinProbabilities(probabilities);
  const topStrength = conditional[topSeed]?.[roundIndex] ?? 0;
  const bottomStrength = conditional[bottomSeed]?.[roundIndex] ?? 0;
  const total = topStrength + bottomStrength;

  if (total <= 0) {
    return 0.5;
  }

  return topStrength / total;
}

export function bracketWinProbabilities(
  teams = defaultTeams,
  games = defaultGames,
  probabilities = seedProbabilities,
  options = {}
) {
  const { respectResults = false } = options;
  const teamsByName = teamMap(teams);
  const perTeamRoundWins = new Map(teams.map((team) => [team.name, Array.from({ length: rounds.length }, () => 0)]));
  const winnerDistributionsByGame = new Map();
  let previousRoundWinners = [];

  for (const [roundIndex, round] of rounds.entries()) {
    const roundGames = games.filter((game) => game.round === round);
    const nextRoundWinners = [];

    for (const [gameIndex, game] of roundGames.entries()) {
      const topDistribution = roundIndex === 0
        ? new Map([[game.topTeam, 1]])
        : previousRoundWinners[gameIndex * 2];
      const bottomDistribution = roundIndex === 0
        ? new Map([[game.bottomTeam, 1]])
        : previousRoundWinners[(gameIndex * 2) + 1];
      const winnerDistribution = new Map();

      if (respectResults && game.winner) {
        winnerDistribution.set(game.winner, 1);
        const winnerWins = perTeamRoundWins.get(game.winner);
        if (winnerWins) {
          winnerWins[roundIndex] += 1;
        }
      } else {
        for (const [topTeamName, topReachProbability] of topDistribution.entries()) {
          const topTeam = teamsByName.get(topTeamName);
          if (!topTeam) continue;

          for (const [bottomTeamName, bottomReachProbability] of bottomDistribution.entries()) {
            const bottomTeam = teamsByName.get(bottomTeamName);
            if (!bottomTeam) continue;

            const matchupProbability = topReachProbability * bottomReachProbability;
            if (!matchupProbability) continue;

            const topWinProbability = pairwiseSeedGameProbability(topTeam.seed, bottomTeam.seed, roundIndex, probabilities);
            const bottomWinProbability = 1 - topWinProbability;

            winnerDistribution.set(
              topTeamName,
              (winnerDistribution.get(topTeamName) ?? 0) + (matchupProbability * topWinProbability)
            );
            winnerDistribution.set(
              bottomTeamName,
              (winnerDistribution.get(bottomTeamName) ?? 0) + (matchupProbability * bottomWinProbability)
            );

            perTeamRoundWins.get(topTeamName)[roundIndex] += matchupProbability * topWinProbability;
            perTeamRoundWins.get(bottomTeamName)[roundIndex] += matchupProbability * bottomWinProbability;
          }
        }
      }

      winnerDistributionsByGame.set(game, winnerDistribution);
      nextRoundWinners.push(winnerDistribution);
    }

    previousRoundWinners = nextRoundWinners;
  }

  return {
    perTeamRoundWins,
    winnerDistributionsByGame
  };
}

export function averageSeedRoundWinProbabilities(
  teams = defaultTeams,
  games = defaultGames,
  probabilities = seedProbabilities
) {
  const { perTeamRoundWins } = bracketWinProbabilities(teams, games, probabilities, { respectResults: false });
  const bySeed = Object.fromEntries(Array.from({ length: 16 }, (_, offset) => [offset + 1, Array.from({ length: rounds.length }, () => 0)]));
  const seedCounts = new Map();

  for (const team of teams) {
    seedCounts.set(team.seed, (seedCounts.get(team.seed) ?? 0) + 1);
    const roundWins = perTeamRoundWins.get(team.name) ?? [];
    bySeed[team.seed] = bySeed[team.seed].map((value, index) => value + (roundWins[index] ?? 0));
  }

  for (let seed = 1; seed <= 16; seed += 1) {
    const count = seedCounts.get(seed) ?? 1;
    bySeed[seed] = bySeed[seed].map((value) => value / count);
  }

  return bySeed;
}

export function exactEqualValueScoring(
  probabilities = seedProbabilities,
  options = {}
) {
  const {
    roundExpectedValues = Array.from({ length: rounds.length }, () => 1),
    probabilityFloors = [0.01, 0.01, 0.006, 0.004, 0.0025, 0.0015],
    cap = Infinity
  } = options;

  const bracketProbabilities = averageSeedRoundWinProbabilities(defaultTeams, defaultGames, probabilities);
  const matrix = {};

  for (let seed = 1; seed <= 16; seed += 1) {
    matrix[seed] = rounds.map((_, index) => {
      const probability = Math.max(bracketProbabilities[seed]?.[index] || 0, probabilityFloors[index]);
      return Math.min(cap, roundExpectedValues[index] / probability);
    });
  }

  return matrix;
}

export function probabilityBasedScoring(probabilities = seedProbabilities, roundExpectedValues = Array.from({ length: rounds.length }, () => 1), cap = Infinity) {
  return exactEqualValueScoring(probabilities, { roundExpectedValues, cap });
}

export function inferredRoundExpectedValues() {
  return Array.from({ length: rounds.length }, () => 1);
}

export function equalValueScoring(scoring = currentScoring, probabilities = seedProbabilities, cap = Infinity) {
  return exactEqualValueScoring(probabilities, { cap });
}

export function constrainedEqualValueScoring(
  scoring = currentScoring,
  probabilities = seedProbabilities,
  options = {}
) {
  const {
    roundMaximums = [12, 24, 60, 120, 240, 500],
    roundMinimums = [1, 2, 4, 7, 12, 20]
  } = options;

  const unconstrained = equalValueScoring(scoring, probabilities, Infinity);
  const matrix = {};

  for (let seed = 1; seed <= 16; seed += 1) {
    let previous = 0;
    matrix[seed] = rounds.map((_, index) => {
      const bounded = Math.max(
        roundMinimums[index],
        Math.min(roundMaximums[index], unconstrained[seed][index])
      );
      const monotonic = Math.max(previous, bounded);
      previous = monotonic;
      return monotonic;
    });
  }

  for (let index = 0; index < rounds.length; index += 1) {
    let previous = matrix[1][index];
    for (let seed = 2; seed <= 16; seed += 1) {
      matrix[seed][index] = Math.max(previous, matrix[seed][index]);
      previous = matrix[seed][index];
    }
  }

  return matrix;
}

export function seedExpectedValueTotals(scoring = currentScoring, probabilities = seedProbabilities) {
  const bracketProbabilities = averageSeedRoundWinProbabilities(defaultTeams, defaultGames, probabilities);

  return Array.from({ length: 16 }, (_, offset) => {
    const seed = offset + 1;
    const expectedValue = rounds.reduce(
      (sum, _, index) => sum + scoring[seed][index] * (bracketProbabilities[seed]?.[index] ?? 0),
      0
    );

    return {
      seed,
      expectedValue
    };
  });
}

export function scoringFairnessSummary(scoring = currentScoring, probabilities = seedProbabilities) {
  const rows = seedExpectedValueTotals(scoring, probabilities);
  const values = rows.map((row) => row.expectedValue);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    mean,
    min,
    max,
    spread: max - min,
    coefficientOfVariation: mean === 0 ? 0 : Math.sqrt(variance) / mean
  };
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

export function equalValueDeviations(scoring = currentScoring, probabilities = seedProbabilities) {
  const rows = seedExpectedValueTotals(scoring, probabilities);
  const mean = rows.reduce((sum, row) => sum + row.expectedValue, 0) / rows.length;

  return rows.map((row) => ({
    seed: row.seed,
    expectedValue: row.expectedValue,
    deltaFromMean: row.expectedValue - mean
  }));
}

function createSeededRandom(seed = 42) {
  let value = seed >>> 0;
  return function nextRandom() {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ownerWinOdds(
  teams,
  games,
  scoring = currentScoring,
  probabilities = seedProbabilities,
  simulations = 12000,
  seed = 42,
  ownerList = null
) {
  const owners = deriveOwners(teams, ownerList);
  const currentStandings = standings(teams, games, scoring, owners);
  const unresolved = unresolvedGames(games);

  if (!unresolved.length) {
    const maxScore = Math.max(...currentStandings.map((row) => row.points));
    const leaders = currentStandings.filter((row) => row.points === maxScore);
    return currentStandings.map((row) => ({
      owner: row.owner,
      odds: leaders.some((leader) => leader.owner === row.owner) ? 1 / leaders.length : 0
    }));
  }

  const byName = teamMap(teams);
  const ownerWins = new Map(owners.map((owner) => [owner, 0]));
  const random = createSeededRandom(seed);

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    const ownerTotals = new Map(currentStandings.map((row) => [row.owner, row.points]));

    for (const game of unresolved) {
      const top = byName.get(game.topTeam);
      const bottom = byName.get(game.bottomTeam);
      if (!top || !bottom) continue;

      const roundIndex = roundOrder[game.round];
      const topWeight = probabilities[top.seed]?.[roundIndex] ?? 0;
      const bottomWeight = probabilities[bottom.seed]?.[roundIndex] ?? 0;
      const totalWeight = topWeight + bottomWeight || 2;
      const winner = random() < (topWeight || 1) / totalWeight ? top : bottom;

      if (!ownerTotals.has(winner.owner)) continue;
      ownerTotals.set(
        winner.owner,
        ownerTotals.get(winner.owner) + pointsFor(scoring, winner.seed, game.round)
      );
    }

    const bestScore = Math.max(...ownerTotals.values());
    const leaders = [...ownerTotals.entries()].filter(([, score]) => score === bestScore);
    const split = 1 / leaders.length;

    for (const [owner] of leaders) {
      ownerWins.set(owner, ownerWins.get(owner) + split);
    }
  }

  return owners
    .map((owner) => ({
      owner,
      odds: ownerWins.get(owner) / simulations
    }))
    .sort((a, b) => b.odds - a.odds);
}

export function ownerWinningPaths(
  teams,
  games,
  scoring = currentScoring,
  probabilities = seedProbabilities,
  simulations = 12000,
  seed = 42,
  ownerList = null
) {
  const owners = deriveOwners(teams, ownerList);
  const currentStandings = standings(teams, games, scoring, owners);
  const currentByOwner = new Map(currentStandings.map((row) => [row.owner, row.points]));
  const unresolved = unresolvedGames(games);

  if (!unresolved.length) {
    const maxScore = Math.max(...currentStandings.map((row) => row.points));
    return currentStandings.map((row) => ({
      owner: row.owner,
      odds: row.points === maxScore ? 1 : 0,
      currentPoints: row.points,
      pointsBehind: maxScore - row.points,
      averageWinningScore: row.points,
      mustHave: [],
      favorable: [],
      avoid: [],
      summary: row.points === maxScore ? "Already in first. No remaining games can change the result." : "Eliminated. No remaining games can create a win path."
    }));
  }

  const byName = teamMap(teams);
  const random = createSeededRandom(seed);
  const ownerWins = new Map(owners.map((owner) => [owner, 0]));
  const winningScoreTotals = new Map(owners.map((owner) => [owner, 0]));
  const gameOutcomeCounts = new Map();
  const baselineOutcomeCounts = new Map();

  for (const game of unresolved) {
    gameOutcomeCounts.set(game.id, new Map(owners.map((owner) => [owner, new Map()])));
    baselineOutcomeCounts.set(game.id, new Map());
  }

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    const ownerTotals = new Map(currentStandings.map((row) => [row.owner, row.points]));
    const simulatedOutcomes = [];

    for (const game of unresolved) {
      const top = byName.get(game.topTeam);
      const bottom = byName.get(game.bottomTeam);
      if (!top || !bottom) continue;

      const roundIndex = roundOrder[game.round];
      const topWeight = probabilities[top.seed]?.[roundIndex] ?? 0;
      const bottomWeight = probabilities[bottom.seed]?.[roundIndex] ?? 0;
      const totalWeight = topWeight + bottomWeight || 2;
      const topProbability = totalWeight === 2 ? 0.5 : (topWeight || 1) / totalWeight;
      const winner = random() < topProbability ? top : bottom;

      simulatedOutcomes.push({
        game,
        winnerName: winner.name
      });

      const baselineByWinner = baselineOutcomeCounts.get(game.id);
      baselineByWinner.set(winner.name, (baselineByWinner.get(winner.name) ?? 0) + 1);

      if (!ownerTotals.has(winner.owner)) continue;
      ownerTotals.set(
        winner.owner,
        ownerTotals.get(winner.owner) + pointsFor(scoring, winner.seed, game.round)
      );
    }

    const bestScore = Math.max(...ownerTotals.values());
    const leaders = [...ownerTotals.entries()].filter(([, score]) => score === bestScore);
    const split = 1 / leaders.length;

    for (const [owner] of leaders) {
      ownerWins.set(owner, ownerWins.get(owner) + split);
      winningScoreTotals.set(owner, winningScoreTotals.get(owner) + (bestScore * split));

      for (const outcome of simulatedOutcomes) {
        const ownerOutcomeCounts = gameOutcomeCounts.get(outcome.game.id).get(owner);
        ownerOutcomeCounts.set(
          outcome.winnerName,
          (ownerOutcomeCounts.get(outcome.winnerName) ?? 0) + split
        );
      }
    }
  }

  const leaderScore = Math.max(...currentStandings.map((row) => row.points));

  return owners.map((owner) => {
    const wins = ownerWins.get(owner);
    const odds = wins / simulations;
    const currentPoints = currentByOwner.get(owner) ?? 0;
    const averageWinningScore = wins ? winningScoreTotals.get(owner) / wins : null;
    const outcomeRows = unresolved.flatMap((game) => {
      const top = byName.get(game.topTeam);
      const bottom = byName.get(game.bottomTeam);
      if (!top || !bottom) return [];

      return [top, bottom].map((team) => {
        const baselineProbability = (baselineOutcomeCounts.get(game.id).get(team.name) ?? 0) / simulations;
        const ownerConditional = wins
          ? (gameOutcomeCounts.get(game.id).get(owner).get(team.name) ?? 0) / wins
          : 0;

        return {
          gameId: game.id,
          round: game.round,
          matchup: `${game.topTeam} vs ${game.bottomTeam}`,
          team: team.name,
          teamOwner: team.owner,
          points: pointsFor(scoring, team.seed, game.round),
          baselineProbability,
          conditionalProbability: ownerConditional,
          lift: ownerConditional - baselineProbability
        };
      });
    });

    const mustHave = outcomeRows
      .filter((row) => row.conditionalProbability >= 0.82 && row.lift > 0.12)
      .sort((a, b) => b.conditionalProbability - a.conditionalProbability || b.lift - a.lift)
      .slice(0, 3);

    const favorable = outcomeRows
      .filter((row) => row.lift > 0.08)
      .sort((a, b) => b.lift - a.lift || b.conditionalProbability - a.conditionalProbability)
      .slice(0, 3);

    const avoid = outcomeRows
      .filter((row) => row.lift < -0.08)
      .sort((a, b) => a.lift - b.lift || a.conditionalProbability - b.conditionalProbability)
      .slice(0, 2);

    let summary = "No meaningful winning path remains.";
    if (odds >= 0.999) {
      summary = "Effectively clinched. Remaining results do not materially change first place.";
    } else if (odds > 0) {
      const summaryParts = [];
      if (mustHave.length) {
        summaryParts.push(`Usually needs ${mustHave.map((row) => row.team).join(", ")}`);
      }
      if (avoid.length) {
        summaryParts.push(`usually avoids ${avoid.map((row) => row.team).join(", ")}`);
      }
      if (!summaryParts.length && favorable.length) {
        summaryParts.push(`best path runs through ${favorable.map((row) => row.team).join(", ")}`);
      }
      summary = `${summaryParts.join(" and ")}.`;
    }

    return {
      owner,
      odds,
      currentPoints,
      pointsBehind: leaderScore - currentPoints,
      averageWinningScore,
      mustHave,
      favorable,
      avoid,
      summary
    };
  }).sort((a, b) => b.odds - a.odds);
}
