import { loadCurrentSeason, loadSeasonOptions, loadSeasonState } from "./seasons.js";
import { summarizeState } from "./standings.js";

export async function buildAppStateResponse(state) {
  const [seasonOptions, currentSeason] = await Promise.all([
    loadSeasonOptions(),
    loadCurrentSeason()
  ]);

  return {
    ...summarizeState(state),
    selectedSeason: Number(state.season),
    currentSeason,
    seasonOptions
  };
}

export async function loadAppStateResponse(selectedSeason) {
  const state = await loadSeasonState(selectedSeason);
  return buildAppStateResponse(state);
}
