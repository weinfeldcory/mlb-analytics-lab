import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const STORE_PATH = path.join(DATA_DIR, "season-state.json");

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
    teams: clone(teams),
    draft: createDraftState(owners)
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

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(createInitialState(), null, 2));
  }
}

export async function readState() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  const state = JSON.parse(raw);
  if (!state.draft) {
    state.draft = createDraftState(state.owners);
  }
  if (!Array.isArray(state.draft.history)) {
    state.draft.history = [];
  }
  return state;
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
