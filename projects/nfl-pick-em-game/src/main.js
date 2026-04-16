import {
  launchSeason,
  loadAppState,
  updateAvailableLines,
  updateRecentResults,
  updateSeasonConfig,
  updateWeeklyOutcome,
  updateWeeklyPicks
} from "./api.js";
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
    weekError: "",
    savingOutcome: false,
    outcomeMessage: "",
    outcomeError: "",
    savingLines: false,
    linesMessage: "",
    linesError: "",
    savingResults: false,
    resultsMessage: "",
    resultsError: "",
    launchingSeason: false,
    launchMessage: "",
    launchError: "",
    selectedWeek: null
  };

  const render = () => {
    if (!uiState.selectedWeek || !appData.weeklyPicks.some((week) => week.week === uiState.selectedWeek)) {
      uiState.selectedWeek = appData.currentWeek;
    }

    const viewData = {
      ...appData,
      uiSelectedWeek: uiState.selectedWeek,
      uiSavingWeek: uiState.savingWeek,
      uiWeekMessage: uiState.weekMessage,
      uiWeekError: uiState.weekError,
      uiSavingOutcome: uiState.savingOutcome,
      uiOutcomeMessage: uiState.outcomeMessage,
      uiOutcomeError: uiState.outcomeError,
      uiSavingLines: uiState.savingLines,
      uiLinesMessage: uiState.linesMessage,
      uiLinesError: uiState.linesError,
      uiSavingResults: uiState.savingResults,
      uiResultsMessage: uiState.resultsMessage,
      uiResultsError: uiState.resultsError,
      uiLaunchingSeason: uiState.launchingSeason,
      uiLaunchMessage: uiState.launchMessage,
      uiLaunchError: uiState.launchError
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
    },
    saveWeeklyOutcome: async (payload) => {
      await updateWeeklyOutcome(payload);
      await refresh();
    },
    saveAvailableLines: async (payload) => {
      await updateAvailableLines(payload);
      await refresh();
    },
    saveRecentResults: async (payload) => {
      await updateRecentResults(payload);
      await refresh();
    },
    launchSeason: async (payload) => {
      await launchSeason(payload);
      await refresh();
    },
    selectWeek: (week) => {
      uiState.selectedWeek = week;
      render();
    }
  };

  render();
}

initializeApp();
