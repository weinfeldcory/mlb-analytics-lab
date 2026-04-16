import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createEmptyWeeklyOutcome, deriveComputedState } from "./scoring.js";
import { seedState } from "./seed-state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.BUSY_PICKS_DATA_DIR
  ? path.resolve(process.env.BUSY_PICKS_DATA_DIR)
  : path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "season-state.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(seedState, null, 2));
  }
}

function sanitizeOwners(nextOwners) {
  const owners = (nextOwners || [])
    .map((owner) => String(owner).trim())
    .filter(Boolean);

  if (owners.length < 2 || owners.length > 10) {
    throw new Error("Player count must be between 2 and 10.");
  }

  return [...new Set(owners)];
}

function normalizeWeeklyOwnerData(owners, record, fallbackFactory) {
  return Object.fromEntries(
    owners.map((owner) => [owner, record?.[owner] ? clone(record[owner]) : fallbackFactory()])
  );
}

function sanitizeWeekNumber(value, totalWeeks) {
  const week = Number(value);
  if (!Number.isInteger(week) || week < 1 || week > totalWeeks) {
    throw new Error(`Week must be between 1 and ${totalWeeks}.`);
  }
  return week;
}

function sanitizeSeason(value, fallback) {
  const season = Number(value);
  if (Number.isInteger(season) && season >= 2000 && season <= 3000) {
    return season;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error("Season must be a valid year.");
}

function sanitizeGames(games) {
  if (!Array.isArray(games)) {
    throw new Error("Games must be an array.");
  }

  return games
    .map((game) => ({
      day: String(game?.day || "").trim(),
      awayTeam: String(game?.awayTeam || "").trim(),
      homeTeam: String(game?.homeTeam || "").trim(),
      line: String(game?.line || "").trim(),
      total: String(game?.total || "").trim()
    }))
    .filter((game) => game.awayTeam && game.homeTeam);
}

function sanitizeRecentResults(results) {
  if (!Array.isArray(results)) {
    throw new Error("Results must be an array.");
  }

  return results
    .map((result) => ({
      week: String(result?.week || "").trim(),
      date: String(result?.date || "").trim(),
      away: String(result?.away || "").trim(),
      home: String(result?.home || "").trim(),
      score: String(result?.score || "").trim(),
      odds: String(result?.odds || "").trim(),
      coveredBy: String(result?.coveredBy || "").trim(),
      totalPoints: Number(result?.totalPoints) || 0,
      totalLine: Number(result?.totalLine) || 0,
      winner: String(result?.winner || "").trim()
    }))
    .filter((result) => result.away && result.home);
}

function createEmptyStandings(owners) {
  return owners.map((owner, index) => ({
    owner,
    points: 0,
    rank: index + 1,
    expectedPoints: 0,
    liveOdds: "—",
    breakdown: { potd: 0, overUnder: 0, dotd: 0 }
  }));
}

function createEmptyWeeklyPick(owners, weekNumber) {
  return {
    week: weekNumber,
    label: `Week ${weekNumber}`,
    status: weekNumber === 1 ? "Open" : "Upcoming",
    potd: Object.fromEntries(owners.map((owner) => [owner, ""])),
    overUnder: Object.fromEntries(owners.map((owner) => [owner, { game: "", line: "", pick: "" }])),
    dotd: Object.fromEntries(owners.map((owner) => [owner, { team: "", line: "" }]))
  };
}

function normalizeWeeklyOutcomes(state) {
  const outcomesByWeek = new Map((state.weeklyOutcomes || []).map((entry) => [entry.week, entry]));
  return state.weeklyPicks.map((week) => {
    const existing = outcomesByWeek.get(week.week) || createEmptyWeeklyOutcome(week.week);
    return {
      week: week.week,
      potdWinner: String(existing.potdWinner || "").trim(),
      overUnder: {
        game: String(existing.overUnder?.game || "").trim(),
        line: String(existing.overUnder?.line || "").trim(),
        outcome: String(existing.overUnder?.outcome || "").trim().toUpperCase()
      },
      dotdWinners: [...new Set((existing.dotdWinners || []).map((team) => String(team || "").trim()).filter(Boolean))],
      finalized: Boolean(existing.finalized)
    };
  });
}

function finalizeState(state) {
  const normalized = {
    ...state,
    weeklyOutcomes: normalizeWeeklyOutcomes(state),
    scoring: state.scoring || { mode: "imported", completedWeeks: 0, lastComputedAt: null }
  };

  return normalized.scoring.mode === "app"
    ? deriveComputedState(normalized)
    : normalized;
}

export async function readState() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  return finalizeState(JSON.parse(raw));
}

export async function writeState(nextState) {
  const state = {
    ...finalizeState(nextState),
    updatedAt: new Date().toISOString()
  };

  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(state, null, 2));
  return state;
}

export async function updateSeasonConfig(payload) {
  const state = await readState();
  const nextOwners = sanitizeOwners(payload.owners);
  const ownerSet = new Set(nextOwners);
  const totalWeeks = state.weeklyPicks.length || 18;

  state.season = sanitizeSeason(payload.season, state.season);
  state.currentWeek = payload.currentWeek === undefined
    ? state.currentWeek
    : sanitizeWeekNumber(payload.currentWeek, totalWeeks);
  state.notes = String(payload.notes || "").trim();
  state.owners = nextOwners;
  state.standings = state.standings
    .filter((row) => ownerSet.has(row.owner))
    .concat(
      nextOwners
        .filter((owner) => !state.standings.some((row) => row.owner === owner))
        .map((owner) => ({
          owner,
          points: 0,
          rank: state.standings.length + 1,
          expectedPoints: 0,
          liveOdds: "—",
          breakdown: { potd: 0, overUnder: 0, dotd: 0 }
        }))
    )
    .map((row) => ({ ...clone(row), rank: 0 }))
    .sort((a, b) => b.points - a.points || b.expectedPoints - a.expectedPoints || a.owner.localeCompare(b.owner))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  state.weeklyPicks = state.weeklyPicks.map((week) => ({
    ...week,
    potd: Object.fromEntries(nextOwners.map((owner) => [owner, week.potd[owner] || ""])),
    overUnder: Object.fromEntries(nextOwners.map((owner) => [owner, week.overUnder[owner] || { game: "", line: "", pick: "" }])),
    dotd: Object.fromEntries(nextOwners.map((owner) => [owner, week.dotd[owner] || { team: "", line: "" }]))
  }));

  return writeState(state);
}

export async function launchSeason(payload) {
  const state = await readState();
  const owners = sanitizeOwners(payload.owners);
  const totalWeeks = Number(payload.totalWeeks);
  if (!Number.isInteger(totalWeeks) || totalWeeks < 1 || totalWeeks > 25) {
    throw new Error("Total weeks must be between 1 and 25.");
  }

  const currentWeek = sanitizeWeekNumber(payload.currentWeek ?? 1, totalWeeks);
  const season = sanitizeSeason(payload.season);
  const title = String(payload.title || state.title || "Busy Picks").trim() || "Busy Picks";
  const notes = String(payload.notes || "").trim();

  return writeState({
    title,
    season,
    currentWeek,
    notes,
    source: {
      sheetTitle: "App-launched season",
      spreadsheetUrl: state.source?.spreadsheetUrl || "",
      snapshotDate: new Date().toISOString().slice(0, 10)
    },
    owners,
    standings: createEmptyStandings(owners),
    weeklyPicks: Array.from({ length: totalWeeks }, (_, index) => createEmptyWeeklyPick(owners, index + 1)),
    weeklyOutcomes: Array.from({ length: totalWeeks }, (_, index) => createEmptyWeeklyOutcome(index + 1)),
    availableLines: {
      week: currentWeek,
      games: []
    },
    recentResults: [],
    scoring: {
      mode: "app",
      completedWeeks: 0,
      lastComputedAt: null
    }
  });
}

export async function updateAvailableLines(payload) {
  const state = await readState();
  const week = sanitizeWeekNumber(payload.week, state.weeklyPicks.length);

  state.availableLines = {
    week,
    games: sanitizeGames(payload.games)
  };

  return writeState(state);
}

export async function updateRecentResults(payload) {
  const state = await readState();
  const weekNumber = sanitizeWeekNumber(payload.week, state.weeklyPicks.length);
  const weekLabel = `Week ${weekNumber}`;
  const nextResults = sanitizeRecentResults(payload.results).map((result) => ({
    ...result,
    week: weekLabel
  }));

  state.recentResults = state.recentResults
    .filter((result) => result.week !== weekLabel)
    .concat(nextResults)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.home.localeCompare(b.home));

  return writeState(state);
}

export async function updateWeeklyPicks(payload) {
  const state = await readState();
  const weekNumber = sanitizeWeekNumber(payload.week, state.weeklyPicks.length);
  const week = state.weeklyPicks.find((entry) => entry.week === weekNumber);

  if (!week) {
    throw new Error(`Unknown week: ${weekNumber}`);
  }

  const owners = state.owners;
  week.status = String(payload.status || week.status || "In Progress").trim() || "In Progress";
  week.potd = Object.fromEntries(
    owners.map((owner) => [owner, String(payload.potd?.[owner] || "").trim()])
  );
  week.overUnder = Object.fromEntries(
    owners.map((owner) => {
      const next = payload.overUnder?.[owner] || {};
      return [owner, {
        game: String(next.game || "").trim(),
        line: String(next.line || "").trim(),
        pick: String(next.pick || "").trim().toUpperCase()
      }];
    })
  );
  week.dotd = Object.fromEntries(
    owners.map((owner) => {
      const next = payload.dotd?.[owner] || {};
      return [owner, {
        team: String(next.team || "").trim(),
        line: String(next.line || "").trim()
      }];
    })
  );

  state.currentWeek = weekNumber;
  state.weeklyPicks = state.weeklyPicks.map((entry) => (
    entry.week === weekNumber
      ? week
      : {
        ...entry,
        potd: normalizeWeeklyOwnerData(owners, entry.potd, () => ""),
        overUnder: normalizeWeeklyOwnerData(owners, entry.overUnder, () => ({ game: "", line: "", pick: "" })),
        dotd: normalizeWeeklyOwnerData(owners, entry.dotd, () => ({ team: "", line: "" }))
      }
  ));

  return writeState(state);
}

export async function updateWeeklyOutcome(payload) {
  const state = await readState();
  const weekNumber = sanitizeWeekNumber(payload.week, state.weeklyPicks.length);
  const outcome = state.weeklyOutcomes.find((entry) => entry.week === weekNumber);

  if (!outcome) {
    throw new Error(`Unknown week: ${weekNumber}`);
  }

  outcome.potdWinner = String(payload.potdWinner || "").trim();
  outcome.overUnder = {
    game: String(payload.overUnder?.game || "").trim(),
    line: String(payload.overUnder?.line || "").trim(),
    outcome: String(payload.overUnder?.outcome || "").trim().toUpperCase()
  };
  outcome.dotdWinners = [...new Set((payload.dotdWinners || [])
    .map((team) => String(team || "").trim())
    .filter(Boolean))];
  outcome.finalized = Boolean(payload.finalized);

  state.scoring = {
    ...(state.scoring || {}),
    mode: "app"
  };

  state.weeklyOutcomes = state.weeklyOutcomes.map((entry) => (
    entry.week === weekNumber ? outcome : entry
  ));

  return writeState(state);
}
