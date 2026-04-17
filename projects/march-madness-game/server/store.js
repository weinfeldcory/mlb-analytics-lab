import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import {
  currentScoring,
  games,
  owners,
  rounds,
  teams
} from "../src/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const DEFAULT_STORE_PATH = path.join(DATA_DIR, "season-state.json");
const DB_FILENAME = "season-state.db";

let cachedDatabase;
let cachedDatabasePath;
const MIGRATIONS = [
  {
    id: "001_base_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS seasons (
        season INTEGER PRIMARY KEY,
        updated_at TEXT NOT NULL,
        state_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `
  },
  {
    id: "002_season_summary_columns"
  },
  {
    id: "003_season_owners",
    sql: `
      CREATE TABLE IF NOT EXISTS season_owners (
        season INTEGER NOT NULL,
        owner_name TEXT NOT NULL,
        draft_position INTEGER NOT NULL,
        PRIMARY KEY (season, owner_name),
        UNIQUE (season, draft_position)
      );
    `
  }
];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function sanitizeOwners(nextOwners) {
  const ownersList = nextOwners
    .map((owner) => String(owner).trim())
    .filter(Boolean);

  if (!ownersList.length) {
    throw new Error("At least one owner is required.");
  }

  return [...new Set(ownersList)];
}

export function sanitizeTeams(nextTeams) {
  const normalizedTeams = nextTeams
    .map((team) => ({
      seed: Number(team.seed),
      name: String(team.name || "").trim(),
      owner: team.owner ? String(team.owner).trim() : null
    }))
    .filter((team) => team.seed && team.name);

  if (!normalizedTeams.length) {
    throw new Error("At least one team is required.");
  }

  return normalizedTeams;
}

export function sanitizeScoring(nextScoring) {
  const scoring = {};

  for (const [seed, values] of Object.entries(nextScoring || {})) {
    const normalizedSeed = Number(seed);
    if (!normalizedSeed) continue;
    const normalizedValues = values.map((value) => Number(value || 0));
    if (normalizedValues.length !== rounds.length) {
      throw new Error(`Seed ${seed} must define ${rounds.length} round values.`);
    }
    scoring[normalizedSeed] = normalizedValues;
  }

  if (!Object.keys(scoring).length) {
    throw new Error("Scoring matrix is required.");
  }

  return scoring;
}

export function computeCurrentOwner(state) {
  const order = state.draft.order;
  if (!order.length) return null;
  return order[state.draft.currentPickIndex % order.length];
}

export function createDraftState(nextOwners = owners) {
  return {
    order: clone(nextOwners),
    snake: true,
    locked: false,
    currentPickNumber: 1,
    currentPickIndex: 0,
    history: []
  };
}

export function createInitialState() {
  return {
    season: 2026,
    updatedAt: new Date().toISOString(),
    owners: clone(owners),
    rounds: clone(rounds),
    currentScoring: clone(currentScoring),
    games: clone(games),
    baselineTeams: clone(teams),
    teams: clone(teams),
    draft: createDraftState(owners)
  };
}

export function currentStorePath() {
  return process.env.SEASON_STATE_PATH || DEFAULT_STORE_PATH;
}

function databasePath() {
  return process.env.SEASON_DB_PATH || path.join(path.dirname(currentStorePath()), DB_FILENAME);
}

function seasonsDirectory() {
  return path.join(path.dirname(currentStorePath()), "seasons");
}

export function resetStateForDraft(state, mode = "empty") {
  if (mode !== "empty" && mode !== "sheet") {
    throw new Error(`Unsupported reset mode: ${mode}`);
  }

  const baselineTeams = clone(state.baselineTeams || state.teams);
  const nextTeams = mode === "sheet"
    ? baselineTeams
    : baselineTeams.map((team) => ({
      ...team,
      owner: null
    }));

  return {
    ...state,
    baselineTeams,
    teams: nextTeams,
    draft: createDraftState(state.owners)
  };
}

export function advanceDraft(state) {
  const orderLength = state.draft.order.length;
  if (!orderLength) return;

  state.draft.currentPickNumber += 1;

  if (!state.draft.snake) {
    state.draft.currentPickIndex = (state.draft.currentPickIndex + 1) % orderLength;
    return;
  }

  const roundIndex = Math.floor((state.draft.currentPickNumber - 2) / orderLength);
  const offset = (state.draft.currentPickNumber - 2) % orderLength;
  state.draft.currentPickIndex = roundIndex % 2 === 0 ? offset + 1 : orderLength - offset - 2;

  if (state.draft.currentPickIndex < 0) {
    state.draft.currentPickIndex = 0;
  }
  if (state.draft.currentPickIndex >= orderLength) {
    state.draft.currentPickIndex = orderLength - 1;
  }
}

export function rebuildDraftPositionFromHistory(state) {
  state.draft.currentPickNumber = 1;
  state.draft.currentPickIndex = 0;

  for (let index = 0; index < state.draft.history.length; index += 1) {
    advanceDraft(state);
  }
}

function normalizeState(state) {
  if (!state.draft) {
    state.draft = createDraftState(state.owners);
  }
  if (!Array.isArray(state.draft.history)) {
    state.draft.history = [];
  }
  if (!Array.isArray(state.baselineTeams)) {
    state.baselineTeams = clone(state.teams);
  }
  if (!Array.isArray(state.rounds)) {
    state.rounds = clone(rounds);
  }
  return state;
}

async function fileExists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function readJsonState(filePath) {
  const raw = await readFile(filePath, "utf8");
  return normalizeState(JSON.parse(raw));
}

async function readLegacySeasonStates() {
  const statesBySeason = new Map();
  const legacyPath = currentStorePath();

  if (await fileExists(legacyPath)) {
    const state = await readJsonState(legacyPath);
    statesBySeason.set(Number(state.season), state);
  }

  try {
    const entries = await readdir(seasonsDirectory(), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const state = await readJsonState(path.join(seasonsDirectory(), entry.name));
      statesBySeason.set(Number(state.season), state);
    }
  } catch {
    // No legacy season directory is fine.
  }

  return [...statesBySeason.values()].sort((a, b) => b.season - a.season);
}

async function ensureDatabase() {
  const dbPath = databasePath();
  if (cachedDatabase && cachedDatabasePath === dbPath) {
    return cachedDatabase;
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  applyMigrations(db);

  const seasonCount = db.prepare("SELECT COUNT(*) AS count FROM seasons").get().count;
  if (!seasonCount) {
    const legacyStates = await readLegacySeasonStates();
    const seedStates = legacyStates.length ? legacyStates : [createInitialState()];
    const insertSeason = db.prepare(`
      INSERT OR REPLACE INTO seasons (
        season,
        updated_at,
        state_json,
        owner_count,
        total_teams,
        drafted_teams,
        completed_games,
        total_games,
        draft_locked
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const state of seedStates) {
      const normalized = normalizeState(state);
      const fields = buildStructuredSeasonFields(normalized);
      insertSeason.run(
        Number(normalized.season),
        normalized.updatedAt || new Date().toISOString(),
        JSON.stringify(normalized),
        fields.ownerCount,
        fields.totalTeams,
        fields.draftedTeams,
        fields.completedGames,
        fields.totalGames,
        fields.draftLocked
      );
      syncSeasonOwners(db, normalized);
    }

    const defaultSeason = Number(seedStates[0].season);
    db.prepare(`
      INSERT OR REPLACE INTO app_meta (key, value)
      VALUES ('current_season', ?)
    `).run(String(defaultSeason));
  }

  backfillSeasonSummaryColumns(db);

  cachedDatabase = db;
  cachedDatabasePath = dbPath;
  return db;
}

function readStateRow(db, season) {
  if (season == null) {
    const currentMeta = db.prepare("SELECT value FROM app_meta WHERE key = 'current_season'").get();
    if (currentMeta) {
      return db.prepare("SELECT season, updated_at, state_json FROM seasons WHERE season = ?").get(Number(currentMeta.value));
    }

    return db.prepare(`
      SELECT season, updated_at, state_json
      FROM seasons
      ORDER BY updated_at DESC, season DESC
      LIMIT 1
    `).get();
  }

  return db.prepare("SELECT season, updated_at, state_json FROM seasons WHERE season = ?").get(Number(season));
}

function buildSeasonSummary(state) {
  const draftedTeams = state.teams.filter((team) => team.owner).length;
  return {
    season: Number(state.season),
    updatedAt: state.updatedAt,
    ownerCount: state.owners.length,
    totalTeams: state.teams.length,
    draftedTeams,
    draftLocked: Boolean(state.draft.locked),
    completedGames: state.games.filter((game) => game.winner).length,
    totalGames: state.games.length
  };
}

function buildStructuredSeasonFields(state) {
  const summary = buildSeasonSummary(state);
  return {
    ownerCount: summary.ownerCount,
    totalTeams: summary.totalTeams,
    draftedTeams: summary.draftedTeams,
    completedGames: summary.completedGames,
    totalGames: summary.totalGames,
    draftLocked: summary.draftLocked ? 1 : 0
  };
}

function hasColumn(db, tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function applyMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(db.prepare("SELECT id FROM schema_migrations").all().map((row) => row.id));
  const recordMigration = db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;

    if (migration.id === "002_season_summary_columns") {
      const additions = [
        ["owner_count", "INTEGER NOT NULL DEFAULT 0"],
        ["total_teams", "INTEGER NOT NULL DEFAULT 0"],
        ["drafted_teams", "INTEGER NOT NULL DEFAULT 0"],
        ["completed_games", "INTEGER NOT NULL DEFAULT 0"],
        ["total_games", "INTEGER NOT NULL DEFAULT 0"],
        ["draft_locked", "INTEGER NOT NULL DEFAULT 0"]
      ];
      for (const [columnName, definition] of additions) {
        if (!hasColumn(db, "seasons", columnName)) {
          db.exec(`ALTER TABLE seasons ADD COLUMN ${columnName} ${definition}`);
        }
      }
    } else {
      db.exec(migration.sql);
    }

    recordMigration.run(migration.id, new Date().toISOString());
  }
}

function backfillSeasonSummaryColumns(db) {
  const rows = db.prepare("SELECT season, state_json FROM seasons").all();
  const update = db.prepare(`
    UPDATE seasons
    SET owner_count = ?,
        total_teams = ?,
        drafted_teams = ?,
        completed_games = ?,
        total_games = ?,
        draft_locked = ?
    WHERE season = ?
  `);

  for (const row of rows) {
    const state = normalizeState(JSON.parse(row.state_json));
    const fields = buildStructuredSeasonFields(state);
    update.run(
      fields.ownerCount,
      fields.totalTeams,
      fields.draftedTeams,
      fields.completedGames,
      fields.totalGames,
      fields.draftLocked,
      Number(row.season)
    );
    syncSeasonOwners(db, state);
  }
}

function syncSeasonOwners(db, state) {
  db.prepare("DELETE FROM season_owners WHERE season = ?").run(Number(state.season));

  const insertOwner = db.prepare(`
    INSERT INTO season_owners (season, owner_name, draft_position)
    VALUES (?, ?, ?)
  `);

  state.owners.forEach((owner, index) => {
    insertOwner.run(Number(state.season), String(owner), index);
  });
}

export async function getDatabase() {
  return ensureDatabase();
}

export async function readCurrentSeason() {
  const db = await ensureDatabase();
  const currentMeta = db.prepare("SELECT value FROM app_meta WHERE key = 'current_season'").get();
  if (currentMeta) {
    return Number(currentMeta.value);
  }

  const row = db.prepare(`
    SELECT season
    FROM seasons
    ORDER BY updated_at DESC, season DESC
    LIMIT 1
  `).get();
  return row ? Number(row.season) : null;
}

export async function listSeasonSummaries() {
  const db = await ensureDatabase();
  const rows = db.prepare(`
    SELECT season, updated_at, owner_count, total_teams, drafted_teams, completed_games, total_games, draft_locked
    FROM seasons
    ORDER BY season DESC
  `).all();

  return rows.map((row) => ({
    season: Number(row.season),
    updatedAt: row.updated_at,
    ownerCount: Number(row.owner_count || 0),
    totalTeams: Number(row.total_teams || 0),
    draftedTeams: Number(row.drafted_teams || 0),
    completedGames: Number(row.completed_games || 0),
    totalGames: Number(row.total_games || 0),
    draftLocked: Boolean(row.draft_locked)
  }));
}

export async function readState(selectedSeason) {
  const db = await ensureDatabase();
  const row = readStateRow(db, selectedSeason);

  if (!row) {
    throw new Error(`Unknown season: ${selectedSeason}`);
  }

  const state = normalizeState(JSON.parse(row.state_json));
  state.updatedAt = row.updated_at;
  return state;
}

export async function writeState(nextState, selectedSeason) {
  const db = await ensureDatabase();
  const state = normalizeState({
    ...nextState,
    updatedAt: new Date().toISOString()
  });
  const targetSeason = Number(selectedSeason ?? state.season);

  if (!Number.isInteger(targetSeason)) {
    throw new Error("Season must be a year.");
  }

  state.season = targetSeason;
  const fields = buildStructuredSeasonFields(state);
  db.prepare(`
    INSERT INTO seasons (
      season,
      updated_at,
      state_json,
      owner_count,
      total_teams,
      drafted_teams,
      completed_games,
      total_games,
      draft_locked
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(season) DO UPDATE SET
      updated_at = excluded.updated_at,
      state_json = excluded.state_json,
      owner_count = excluded.owner_count,
      total_teams = excluded.total_teams,
      drafted_teams = excluded.drafted_teams,
      completed_games = excluded.completed_games,
      total_games = excluded.total_games,
      draft_locked = excluded.draft_locked
  `).run(
    targetSeason,
    state.updatedAt,
    JSON.stringify(state),
    fields.ownerCount,
    fields.totalTeams,
    fields.draftedTeams,
    fields.completedGames,
    fields.totalGames,
    fields.draftLocked
  );

  db.prepare(`
    INSERT INTO app_meta (key, value)
    VALUES ('current_season', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(targetSeason));

  syncSeasonOwners(db, state);

  return state;
}
