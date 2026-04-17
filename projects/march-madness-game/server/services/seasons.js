import {
  createInitialState,
  createDraftState,
  readState,
  sanitizeOwners,
  sanitizeScoring,
  sanitizeTeams,
  writeState
} from "../store.js";
import { listSeasonOwners, listSeasonSummaryRecords, readCurrentSeasonRecord } from "../repositories/seasons.js";

export async function loadSeasonState(selectedSeason) {
  return readState(selectedSeason);
}

export async function loadSeasonOptions() {
  return listSeasonSummaryRecords();
}

export async function loadCurrentSeason() {
  const record = await readCurrentSeasonRecord();
  return record?.season ?? null;
}

export async function loadSeasonOwners(selectedSeason) {
  return listSeasonOwners(selectedSeason);
}

export async function updateSeasonConfig({ season, owners: nextOwners, teams: nextTeams, currentScoring: nextScoring }, selectedSeason) {
  let state;
  try {
    state = await readState(selectedSeason);
  } catch {
    state = createInitialState();
  }

  if (!Number.isInteger(Number(season))) {
    throw new Error("Season must be a year.");
  }

  const ownersList = sanitizeOwners(nextOwners);
  const teamsList = sanitizeTeams(nextTeams);
  const scoring = sanitizeScoring(nextScoring);
  const ownerSet = new Set(ownersList);

  for (const team of teamsList) {
    if (team.owner && !ownerSet.has(team.owner)) {
      throw new Error(`Unknown owner on team ${team.name}: ${team.owner}`);
    }
  }

  state.season = Number(season);
  state.owners = ownersList;
  state.baselineTeams = teamsList.map((team) => ({ ...team }));
  state.teams = teamsList;
  state.currentScoring = scoring;
  state.games = [];
  state.draft = createDraftState(ownersList);

  return writeState(state, selectedSeason);
}
