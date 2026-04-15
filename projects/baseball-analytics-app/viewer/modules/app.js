import { hitterDataUrl, pitcherDataUrl } from "./config.js";
import { dom } from "./dom.js";
import { applyHitterFilters } from "./hitters.js";
import { applyPitcherFilters } from "./pitchers.js";
import { addToRoster, isSelected, registerRosterCallbacks, removeFromRoster, removeFromSlot, renderRosterBuilder, restoreRoster } from "./roster.js";
import { state } from "./state.js";
import { teamLabel } from "./utils.js";

function populateTeamFilters() {
  const teams = [...new Set([...state.hitters, ...state.pitchers].map(teamLabel))].sort();

  for (const filter of [dom.hitterTeamFilter, dom.pitcherTeamFilter]) {
    filter.innerHTML = `<option value="ALL">All Teams</option>`;
    for (const team of teams) {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      filter.append(option);
    }
  }
}

function bindFilterEvents() {
  dom.hitterTeamFilter.addEventListener("change", applyHitterFilters);
  dom.hitterSearchFilter.addEventListener("input", applyHitterFilters);
  dom.hitterMinPaFilter.addEventListener("input", applyHitterFilters);
  dom.hitterSortKeyFilter.addEventListener("change", applyHitterFilters);

  dom.pitcherTeamFilter.addEventListener("change", applyPitcherFilters);
  dom.pitcherSearchFilter.addEventListener("input", applyPitcherFilters);
  dom.pitcherMinIpFilter.addEventListener("input", applyPitcherFilters);
  dom.pitcherSortKeyFilter.addEventListener("change", applyPitcherFilters);
}

function bindRosterEvents() {
  for (const tableBody of [dom.projectionRows, dom.pitcherRows]) {
    tableBody.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const playerId = target.dataset.playerId;
      const type = target.dataset.type;
      if (!playerId || !type) {
        return;
      }

      if (isSelected(type, playerId)) {
        removeFromRoster(type, playerId);
        return;
      }

      addToRoster(type, playerId);
    });
  }

  for (const slotContainer of [dom.rosterHitterSlots, dom.rosterPitcherSlots]) {
    slotContainer.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const slotId = target.dataset.slotId;
      const type = target.dataset.type;
      if (!slotId || !type) {
        return;
      }

      removeFromSlot(type, slotId);
    });
  }
}

function renderLoadError(error) {
  dom.summaryCards.innerHTML = "";
  dom.pitcherSummaryCards.innerHTML = "";
  dom.projectionRows.innerHTML = `<tr><td class="empty" colspan="16">Failed to load hitter data: ${error.message}</td></tr>`;
  dom.pitcherRows.innerHTML = `<tr><td class="empty" colspan="15">Failed to load pitcher data: ${error.message}</td></tr>`;
}

export async function initApp() {
  registerRosterCallbacks({
    onRosterChange: () => {
      applyHitterFilters();
      applyPitcherFilters();
    },
  });

  bindFilterEvents();
  bindRosterEvents();

  try {
    const [hittersResponse, pitchersResponse] = await Promise.all([fetch(hitterDataUrl), fetch(pitcherDataUrl)]);
    state.hitters = await hittersResponse.json();
    state.pitchers = await pitchersResponse.json();
    restoreRoster();
    populateTeamFilters();
    renderRosterBuilder();
    applyHitterFilters();
    applyPitcherFilters();
  } catch (error) {
    renderLoadError(error);
  }
}
