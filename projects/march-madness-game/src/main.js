import {
  assignDraftTeam,
  loadAppState,
  makeDraftPick,
  resetDraft,
  undoDraftPick,
  unassignDraftTeam,
  updateDraftSettings,
  updateSeasonConfig
} from "./api.js";
import {
  renderMatrix,
  renderPaths,
  renderStandings,
  renderTeamTable,
  renderTeams
} from "./ui/analytics.js";
import { renderDraftRoom, renderSeasonSetup } from "./ui/draft.js";
import { createUiState } from "./ui/state.js";

async function initializeApp() {
  let appData = await loadAppState();
  const uiState = createUiState(appData);

  const render = () => {
    renderDraftRoom(appData, uiState, actions);
    renderSeasonSetup(appData, uiState, actions);
    renderStandings(appData);
    renderPaths(appData);
    renderMatrix(appData);
    renderTeams(appData);
    renderTeamTable(appData);

    const status = document.querySelector("#data-status");
    if (status) {
      status.textContent = `App backend live · updated ${new Date(appData.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
  };

  const refresh = async () => {
    appData = await loadAppState();
    if (!appData.owners.includes(uiState.manualOwner)) {
      uiState.manualOwner = appData.draft.currentOwner || appData.owners[0] || "";
    }
    render();
  };

  const actions = {
    render,
    pick: async (teamName) => {
      await makeDraftPick(teamName);
      await refresh();
    },
    manualAssign: async (teamName, owner) => {
      await assignDraftTeam(teamName, owner);
      await refresh();
    },
    unassign: async (teamName) => {
      await unassignDraftTeam(teamName);
      await refresh();
    },
    undo: async () => {
      await undoDraftPick();
      await refresh();
    },
    reset: async (mode) => {
      await resetDraft(mode);
      await refresh();
    },
    toggleLock: async (locked) => {
      await updateDraftSettings({ locked });
      await refresh();
    },
    saveDraftSettings: async (payload) => {
      await updateDraftSettings(payload);
      await refresh();
    },
    saveSeasonConfig: async (payload) => {
      await updateSeasonConfig(payload);
      await refresh();
    }
  };

  render();
}

initializeApp();
