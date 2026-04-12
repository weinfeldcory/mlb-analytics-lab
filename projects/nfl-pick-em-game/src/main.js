import { loadAppState, updateSeasonConfig, updateWeeklyPicks } from "./api.js";
import {
  renderAdmin,
  renderLinesBoard,
  renderOverview,
  renderResultsBoard,
  renderWeeklyBoard
} from "./ui/render.js";

async function initializeApp() {
  let appData = await loadAppState();
  const uiState = {
    saving: false,
    message: "",
    error: "",
    savingWeek: false,
    weekMessage: "",
    weekError: ""
  };

  const render = () => {
    const viewData = {
      ...appData,
      uiSavingWeek: uiState.savingWeek,
      uiWeekMessage: uiState.weekMessage,
      uiWeekError: uiState.weekError
    };

    window.__busyPicksUiState = uiState;
    window.__busyPicksActions = actions;

    renderOverview(viewData);
    renderWeeklyBoard(viewData);
    renderLinesBoard(appData);
    renderResultsBoard(appData);
    renderAdmin(appData, uiState, actions);

    const status = document.querySelector("#data-status");
    if (status) {
      status.textContent = `Backend live · updated ${new Date(appData.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · source snapshot ${appData.source.snapshotDate}`;
    }
  };

  const refresh = async () => {
    appData = await loadAppState();
    render();
  };

  const actions = {
    render,
    saveSeasonConfig: async (payload) => {
      await updateSeasonConfig(payload);
      await refresh();
    },
    saveWeeklyPicks: async (payload) => {
      await updateWeeklyPicks(payload);
      await refresh();
    }
  };

  render();
}

initializeApp();
