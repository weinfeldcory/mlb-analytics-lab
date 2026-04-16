import {
  assignDraftTeam,
  currentSeasonFromLocation,
  loadAppState,
  makeDraftPick,
  resetDraft,
  undoDraftPick,
  unassignDraftTeam,
  updateSeasonRoute,
  updateDraftSettings,
  updateSeasonConfig
} from "./api.js";
import {
  renderOverview,
  renderMatrix,
  renderPaths,
  renderStandings,
  renderTeamTable,
  renderTeams
} from "./ui/analytics.js";
import { renderDraftRoom, renderSeasonSetup } from "./ui/draft.js";
import { createUiState } from "./ui/state.js";

async function initializeApp() {
  let appData = await loadAppState(currentSeasonFromLocation());
  const uiState = createUiState(appData);

  const setWorkspace = (workspace, options = {}) => {
    uiState.activeWorkspace = workspace;
    render();

    if (options.scroll) {
      document.querySelector("#workspace-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const render = () => {
    syncUiStateWithAppData(appData, uiState);
    renderOverview(appData);
    renderDraftRoom(appData, uiState, actions);
    renderSeasonSetup(appData, uiState, actions);
    renderStandings(appData);
    renderPaths(appData);
    renderMatrix(appData);
    renderTeams(appData);
    renderTeamTable(appData);
    renderWorkspaceState(uiState);
    renderSeasonSelector(appData, uiState);
    bindShellActions(actions);

    const status = document.querySelector("#data-status");
    if (status) {
      status.textContent = `App backend live · updated ${new Date(appData.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
  };

  const refresh = async () => {
    appData = await loadAppState(uiState.selectedSeason);
    if (!appData.owners.includes(uiState.manualOwner)) {
      uiState.manualOwner = appData.draft.currentOwner || appData.owners[0] || "";
    }
    render();
  };

  const actions = {
    render,
    setWorkspace,
    selectSeason: async (season) => {
      uiState.selectedSeason = Number(season);
      updateSeasonRoute(uiState.selectedSeason);
      await refresh();
    },
    pick: async (teamName) => {
      await makeDraftPick(teamName, uiState.selectedSeason);
      await refresh();
    },
    manualAssign: async (teamName, owner) => {
      await assignDraftTeam(teamName, owner, uiState.selectedSeason);
      await refresh();
    },
    unassign: async (teamName) => {
      await unassignDraftTeam(teamName, uiState.selectedSeason);
      await refresh();
    },
    undo: async () => {
      await undoDraftPick(uiState.selectedSeason);
      await refresh();
    },
    reset: async (mode) => {
      await resetDraft(mode, uiState.selectedSeason);
      await refresh();
    },
    toggleLock: async (locked) => {
      await updateDraftSettings({ locked }, uiState.selectedSeason);
      await refresh();
    },
    saveDraftSettings: async (payload) => {
      await updateDraftSettings(payload, uiState.selectedSeason);
      await refresh();
    },
    saveSeasonConfig: async (payload) => {
      uiState.selectedSeason = Number(payload.season);
      await updateSeasonConfig(payload, uiState.selectedSeason);
      await refresh();
    }
  };

  render();

  window.onpopstate = async () => {
    uiState.selectedSeason = currentSeasonFromLocation() || appData.currentSeason || appData.season;
    await refresh();
  };
}

function renderWorkspaceState(uiState) {
  document.querySelectorAll("[data-workspace]").forEach((button) => {
    const isActive = button.dataset.workspace === uiState.activeWorkspace;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll(".workspace-panel").forEach((panel) => {
    const workspace = panel.id.replace("workspace-panel-", "");
    panel.hidden = workspace !== uiState.activeWorkspace;
  });
}

function syncUiStateWithAppData(appData, uiState) {
  uiState.selectedSeason = appData.selectedSeason || appData.season;
}

function renderSeasonSelector(appData, uiState) {
  const select = document.querySelector("#season-selector");
  if (!select) return;

  const options = appData.seasonOptions || [{ season: appData.season }];
  select.innerHTML = options
    .map((option) => `
      <option value="${option.season}" ${Number(option.season) === Number(uiState.selectedSeason) ? "selected" : ""}>
        ${option.season}
      </option>
    `)
    .join("");
}

function bindShellActions(actions) {
  document.querySelector("#season-selector").onchange = (event) => {
    actions.selectSeason(event.target.value);
  };

  document.querySelectorAll("[data-season-select]").forEach((button) => {
    button.onclick = () => {
      actions.selectSeason(button.dataset.seasonSelect);
    };
  });

  document.querySelectorAll("[data-workspace]").forEach((button) => {
    button.onclick = () => {
      actions.setWorkspace(button.dataset.workspace);
    };
  });

  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    button.onclick = () => {
      const surface = button.dataset.navSurface;
      if (surface) {
        actions.setWorkspace(surface);
      }

      document.getElementById(button.dataset.navTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

initializeApp();
