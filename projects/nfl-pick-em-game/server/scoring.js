function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const TEAM_ALIASES = {
  ARI: ["ARI", "ARIZONA", "ARIZONA CARDINALS", "CARDINALS"],
  ATL: ["ATL", "ATLANTA", "ATLANTA FALCONS", "FALCONS"],
  BAL: ["BAL", "BALTIMORE", "BALTIMORE RAVENS", "RAVENS"],
  BUF: ["BUF", "BUFFALO", "BUFFALO BILLS", "BILLS"],
  CAR: ["CAR", "CAROLINA", "CAROLINA PANTHERS", "PANTHERS"],
  CHI: ["CHI", "CHICAGO", "CHICAGO BEARS", "BEARS"],
  CIN: ["CIN", "CINCINNATI", "CINCINNATI BENGALS", "BENGALS"],
  CLE: ["CLE", "CLEVELAND", "CLEVELAND BROWNS", "BROWNS"],
  DAL: ["DAL", "DALLAS", "DALLAS COWBOYS", "COWBOYS"],
  DEN: ["DEN", "DENVER", "DENVER BRONCOS", "BRONCOS"],
  DET: ["DET", "DETROIT", "DETROIT LIONS", "LIONS"],
  GB: ["GB", "GREEN BAY", "GREEN BAY PACKERS", "PACKERS"],
  HOU: ["HOU", "HOUSTON", "HOUSTON TEXANS", "TEXANS"],
  IND: ["IND", "INDIANAPOLIS", "INDIANAPOLIS COLTS", "COLTS"],
  JAX: ["JAX", "JAC", "JACKSONVILLE", "JACKSONVILLE JAGUARS", "JAGUARS"],
  KC: ["KC", "KANSAS CITY", "KANSAS CITY CHIEFS", "CHIEFS"],
  LAC: ["LAC", "LOS ANGELES CHARGERS", "LA CHARGERS", "CHARGERS"],
  LAR: ["LAR", "LOS ANGELES RAMS", "LA RAMS", "RAMS"],
  LV: ["LV", "LAS VEGAS", "LAS VEGAS RAIDERS", "RAIDERS"],
  MIA: ["MIA", "MIAMI", "MIAMI DOLPHINS", "DOLPHINS"],
  MIN: ["MIN", "MINNESOTA", "MINNESOTA VIKINGS", "VIKINGS"],
  NE: ["NE", "NEW ENGLAND", "NEW ENGLAND PATRIOTS", "PATRIOTS"],
  NO: ["NO", "NEW ORLEANS", "NEW ORLEANS SAINTS", "SAINTS"],
  NYG: ["NYG", "NEW YORK GIANTS", "GIANTS"],
  NYJ: ["NYJ", "NEW YORK JETS", "JETS"],
  PHI: ["PHI", "PHILADELPHIA", "PHILADELPHIA EAGLES", "EAGLES"],
  PIT: ["PIT", "PITTSBURGH", "PITTSBURGH STEELERS", "STEELERS"],
  SEA: ["SEA", "SEATTLE", "SEATTLE SEAHAWKS", "SEAHAWKS"],
  SF: ["SF", "SAN FRANCISCO", "SAN FRANCISCO 49ERS", "49ERS", "NINERS"],
  TB: ["TB", "TAMPA BAY", "TAMPA BAY BUCCANEERS", "BUCCANEERS", "BUCS"],
  TEN: ["TEN", "TENNESSEE", "TENNESSEE TITANS", "TITANS"],
  WAS: ["WAS", "WASHINGTON", "WASHINGTON COMMANDERS", "WASHINGTON FOOTBALL TEAM", "COMMANDERS"]
};

const TEAM_ALIAS_TO_ABBREVIATION = new Map(
  Object.entries(TEAM_ALIASES).flatMap(([abbreviation, aliases]) => aliases.map((alias) => [normalizeKey(alias), abbreviation]))
);

function normalizeLine(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function toTeamAbbreviation(value) {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return "";
  }

  return TEAM_ALIAS_TO_ABBREVIATION.get(normalized) || "";
}

function normalizeMatchup(value) {
  const parts = String(value || "")
    .split("/")
    .map((part) => toTeamAbbreviation(part))
    .filter(Boolean);

  if (parts.length !== 2) {
    return "";
  }

  return `${parts[0]}/${parts[1]}`;
}

function buildResultMatchup(result) {
  const away = toTeamAbbreviation(result?.away);
  const home = toTeamAbbreviation(result?.home);

  if (!away || !home) {
    return "";
  }

  return `${away}/${home}`;
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
    || (Array.isArray(outcome?.potdWinners) && outcome.potdWinners.length)
    || outcome?.overUnder?.game
    || outcome?.overUnder?.outcome
    || (Array.isArray(outcome?.overUnderResults) && outcome.overUnderResults.length)
    || (Array.isArray(outcome?.dotdWinners) && outcome.dotdWinners.length)
  );
}

export function createEmptyWeeklyOutcome(weekNumber) {
  return {
    week: weekNumber,
    potdWinner: "",
    potdWinners: [],
    overUnder: {
      game: "",
      line: "",
      outcome: ""
    },
    overUnderResults: [],
    dotdWinners: [],
    finalized: false
  };
}

function normalizeWinnerList(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeOverUnderResults(values) {
  return (values || [])
    .map((entry) => ({
      game: normalizeMatchup(entry?.game),
      line: normalizeLine(entry?.line),
      outcome: normalizeKey(entry?.outcome)
    }))
    .filter((entry) => entry.game && entry.outcome);
}

function derivePotdWinnersFromResults(weekResults) {
  return normalizeWinnerList(
    weekResults
      .map((result) => String(result?.coveredBy || "").trim())
      .filter((value) => value && !/push|no cover/i.test(value))
  );
}

function deriveOverUnderResultsFromResults(weekResults) {
  return weekResults
    .map((result) => {
      const game = buildResultMatchup(result);
      const line = normalizeLine(result?.totalLine);
      const totalPoints = Number(result?.totalPoints);
      const totalLine = Number(result?.totalLine);

      if (!game || !Number.isFinite(totalPoints) || !Number.isFinite(totalLine) || totalLine === 0 || totalPoints === totalLine) {
        return null;
      }

      return {
        game,
        line,
        outcome: totalPoints > totalLine ? "O" : "U"
      };
    })
    .filter(Boolean);
}

function deriveDotdWinnersFromResults(weekResults) {
  return normalizeWinnerList(
    weekResults
      .map((result) => toTeamAbbreviation(result?.winner))
      .filter(Boolean)
  );
}

function resolveWeekOutcomeContext(weekOutcome, weekResults) {
  const manualPotdWinners = normalizeWinnerList(weekOutcome?.potdWinners?.length ? weekOutcome.potdWinners : [weekOutcome?.potdWinner]);
  const manualOverUnderResults = normalizeOverUnderResults(
    weekOutcome?.overUnderResults?.length
      ? weekOutcome.overUnderResults
      : [weekOutcome?.overUnder]
  );
  const manualDotdWinners = normalizeWinnerList(weekOutcome?.dotdWinners);

  return {
    potdWinners: manualPotdWinners.length ? manualPotdWinners : derivePotdWinnersFromResults(weekResults),
    overUnderResults: manualOverUnderResults.length ? manualOverUnderResults : deriveOverUnderResultsFromResults(weekResults),
    dotdWinners: manualDotdWinners.length ? manualDotdWinners : deriveDotdWinnersFromResults(weekResults)
  };
}

export function calculateWeekScorecard(owners, weekPicks, weekOutcome, weekResults = []) {
  const scorecard = Object.fromEntries(owners.map((owner) => [owner, {
    potd: 0,
    overUnder: 0,
    dotd: 0,
    total: 0
  }]));

  const resolvedOutcome = resolveWeekOutcomeContext(weekOutcome, weekResults);
  const normalizedPotdWinners = new Set(resolvedOutcome.potdWinners.map(normalizeKey).filter(Boolean));
  const normalizedDotdWinners = new Set(resolvedOutcome.dotdWinners.map(normalizeKey).filter(Boolean));
  const overUnderLookup = new Map(
    resolvedOutcome.overUnderResults.map((entry) => [`${entry.game}|${entry.line}`, normalizeKey(entry.outcome)])
  );

  owners.forEach((owner) => {
    const ownerPotd = normalizeKey(weekPicks?.potd?.[owner]);
    const ownerOu = weekPicks?.overUnder?.[owner] || {};
    const ownerDotd = weekPicks?.dotd?.[owner] || {};

    if (ownerPotd && normalizedPotdWinners.has(ownerPotd)) {
      scorecard[owner].potd = 1;
    }

    const ownerOuGame = normalizeMatchup(ownerOu.game);
    const ownerOuLine = normalizeLine(ownerOu.line);
    const ownerOuPick = normalizeKey(ownerOu.pick);
    const ownerOuOutcome = overUnderLookup.get(`${ownerOuGame}|${ownerOuLine}`);
    if (ownerOuGame && ownerOuLine && ownerOuPick && ownerOuOutcome && ownerOuPick === ownerOuOutcome) {
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
    const weekResults = (state.recentResults || []).filter((entry) => entry.week === weekPicks.label);
    const ownerScores = calculateWeekScorecard(owners, weekPicks, outcome, weekResults);

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
