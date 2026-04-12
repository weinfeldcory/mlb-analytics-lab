import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  if (!owners.length) {
    throw new Error("At least one owner is required.");
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

export async function readState() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  return JSON.parse(raw);
}

export async function writeState(nextState) {
  const state = {
    ...nextState,
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

  state.season = Number(payload.season) || state.season;
  state.currentWeek = Number(payload.currentWeek) || state.currentWeek;
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
