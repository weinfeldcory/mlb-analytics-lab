function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeLine(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function roundPoints(value) {
  return Math.round(value * 100) / 100;
}

function americanOddsToPoints(value) {
  const odds = Number(String(value || "").trim());
  if (!Number.isFinite(odds) || odds === 0) {
    return 0;
  }

  if (odds > 0) {
    return roundPoints(odds / 100);
  }

  return roundPoints(100 / Math.abs(odds));
}

function createOwnerTotals(owner) {
  return {
    owner,
    points: 0,
    rank: 0,
    expectedPoints: 0,
    liveOdds: "—",
    breakdown: {
      potd: 0,
      overUnder: 0,
      dotd: 0
    }
  };
}

function hasOutcomeData(outcome) {
  return Boolean(
    outcome?.potdWinner
    || outcome?.overUnder?.game
    || outcome?.overUnder?.outcome
    || (Array.isArray(outcome?.dotdWinners) && outcome.dotdWinners.length)
  );
}

export function createEmptyWeeklyOutcome(weekNumber) {
  return {
    week: weekNumber,
    potdWinner: "",
    overUnder: {
      game: "",
      line: "",
      outcome: ""
    },
    dotdWinners: [],
    finalized: false
  };
}

export function calculateWeekScorecard(owners, weekPicks, weekOutcome) {
  const scorecard = Object.fromEntries(owners.map((owner) => [owner, {
    potd: 0,
    overUnder: 0,
    dotd: 0,
    total: 0
  }]));

  const normalizedPotdWinner = normalizeKey(weekOutcome?.potdWinner);
  const normalizedOuGame = normalizeKey(weekOutcome?.overUnder?.game);
  const normalizedOuLine = normalizeLine(weekOutcome?.overUnder?.line);
  const normalizedOuOutcome = normalizeKey(weekOutcome?.overUnder?.outcome);
  const normalizedDotdWinners = new Set((weekOutcome?.dotdWinners || []).map(normalizeKey).filter(Boolean));

  owners.forEach((owner) => {
    const ownerPotd = normalizeKey(weekPicks?.potd?.[owner]);
    const ownerOu = weekPicks?.overUnder?.[owner] || {};
    const ownerDotd = weekPicks?.dotd?.[owner] || {};

    if (normalizedPotdWinner && ownerPotd === normalizedPotdWinner) {
      scorecard[owner].potd = 1;
    }

    const ownerOuGame = normalizeKey(ownerOu.game);
    const ownerOuLine = normalizeLine(ownerOu.line);
    const ownerOuPick = normalizeKey(ownerOu.pick);
    const lineMatches = !normalizedOuLine || !ownerOuLine || normalizedOuLine === ownerOuLine;
    if (normalizedOuGame && normalizedOuOutcome && ownerOuGame === normalizedOuGame && ownerOuPick === normalizedOuOutcome && lineMatches) {
      scorecard[owner].overUnder = 1;
    }

    const ownerDotdTeam = normalizeKey(ownerDotd.team);
    if (ownerDotdTeam && normalizedDotdWinners.has(ownerDotdTeam)) {
      scorecard[owner].dotd = americanOddsToPoints(ownerDotd.line);
    }

    scorecard[owner].total = roundPoints(
      scorecard[owner].potd + scorecard[owner].overUnder + scorecard[owner].dotd
    );
  });

  return scorecard;
}

export function deriveComputedState(state) {
  const owners = state.owners || [];
  const weeklyOutcomes = state.weeklyOutcomes || [];
  const weeklyScorecards = [];

  if (state.scoring?.mode !== "app") {
    return {
      ...state,
      weeklyOutcomes,
      weeklyScorecards
    };
  }

  const totals = Object.fromEntries(owners.map((owner) => [owner, createOwnerTotals(owner)]));

  state.weeklyPicks.forEach((weekPicks) => {
    const outcome = weeklyOutcomes.find((entry) => entry.week === weekPicks.week) || createEmptyWeeklyOutcome(weekPicks.week);
    const ownerScores = calculateWeekScorecard(owners, weekPicks, outcome);

    weeklyScorecards.push({
      week: weekPicks.week,
      label: weekPicks.label,
      finalized: Boolean(outcome.finalized),
      hasOutcomeData: hasOutcomeData(outcome),
      outcome,
      owners: ownerScores
    });

    owners.forEach((owner) => {
      totals[owner].breakdown.potd = roundPoints(totals[owner].breakdown.potd + ownerScores[owner].potd);
      totals[owner].breakdown.overUnder = roundPoints(totals[owner].breakdown.overUnder + ownerScores[owner].overUnder);
      totals[owner].breakdown.dotd = roundPoints(totals[owner].breakdown.dotd + ownerScores[owner].dotd);
      totals[owner].points = roundPoints(
        totals[owner].breakdown.potd + totals[owner].breakdown.overUnder + totals[owner].breakdown.dotd
      );
    });
  });

  const standings = Object.values(totals)
    .sort((a, b) => b.points - a.points || b.breakdown.dotd - a.breakdown.dotd || a.owner.localeCompare(b.owner))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const completedWeeks = weeklyScorecards.filter((week) => week.finalized).length;

  return {
    ...state,
    standings,
    weeklyOutcomes,
    weeklyScorecards,
    scoring: {
      mode: "app",
      completedWeeks,
      lastComputedAt: new Date().toISOString()
    }
  };
}
