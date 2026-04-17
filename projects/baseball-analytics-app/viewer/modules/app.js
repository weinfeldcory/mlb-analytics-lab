import { canCompare, registerComparisonCallbacks, renderComparisons, restoreComparison, toggleCompare } from "./compare.js";
import { hitterDataUrl, pitcherDataUrl } from "./config.js";
import { dom } from "./dom.js";
import { renderGlossary } from "./glossary.js";
import { applyHitterFilters } from "./hitters.js";
import { applyPitcherFilters } from "./pitchers.js";
import { addToRoster, isSelected, registerRosterCallbacks, removeFromRoster, removeFromSlot, renderRosterBuilder, restoreRoster } from "./roster.js";
import { state } from "./state.js";
import { teamLabel } from "./utils.js";

function populateTeamFilters() {
  const teams = [...new Set([...state.hitters, ...state.pitchers].map(teamLabel))].sort();

  for (const filter of [dom.hitterTeamFilter, dom.pitcherTeamFilter].filter(Boolean)) {
    filter.innerHTML = `<option value="ALL">All Teams</option>`;
    for (const team of teams) {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      filter.append(option);
    }
  }
}

function populateBoardFilters() {
  const hitterPositions = [...new Set(state.hitters.map((record) => String(record.roster_position || "").trim()).filter(Boolean))].sort();
  if (dom.hitterPositionFilter) {
    dom.hitterPositionFilter.innerHTML = `<option value="ALL">All Positions</option>`;
    for (const position of hitterPositions) {
      const option = document.createElement("option");
      option.value = position;
      option.textContent = position;
      dom.hitterPositionFilter.append(option);
    }
  }

  const pitcherRoles = [
    ...new Set(
      state.pitchers
        .map((record) => String(record.roster_role || record.projected_role_bucket || "").trim())
        .filter(Boolean),
    ),
  ].sort();
  if (dom.pitcherRoleFilter) {
    dom.pitcherRoleFilter.innerHTML = `<option value="ALL">All Roles</option>`;
    for (const role of pitcherRoles) {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      dom.pitcherRoleFilter.append(option);
    }
  }
}

function bindFilterEvents() {
  dom.hitterTeamFilter?.addEventListener("change", applyHitterFilters);
  dom.hitterPositionFilter?.addEventListener("change", applyHitterFilters);
  dom.hitterSearchFilter?.addEventListener("input", applyHitterFilters);
  dom.hitterMinPaFilter?.addEventListener("input", applyHitterFilters);
  dom.hitterSortKeyFilter?.addEventListener("change", applyHitterFilters);
  dom.hitterStatView?.addEventListener("change", applyHitterFilters);
  dom.hitterRowLimit?.addEventListener("change", applyHitterFilters);
  dom.resetHitterFilters?.addEventListener("click", () => {
    dom.hitterTeamFilter.value = "ALL";
    if (dom.hitterPositionFilter) dom.hitterPositionFilter.value = "ALL";
    dom.hitterSearchFilter.value = "";
    dom.hitterMinPaFilter.value = "0";
    dom.hitterSortKeyFilter.value = "team_building_value_score";
    if (dom.hitterStatView) dom.hitterStatView.value = "decision";
    if (dom.hitterRowLimit) dom.hitterRowLimit.value = "25";
    applyHitterFilters();
  });

  dom.pitcherTeamFilter?.addEventListener("change", applyPitcherFilters);
  dom.pitcherRoleFilter?.addEventListener("change", applyPitcherFilters);
  dom.pitcherSearchFilter?.addEventListener("input", applyPitcherFilters);
  dom.pitcherMinIpFilter?.addEventListener("input", applyPitcherFilters);
  dom.pitcherSortKeyFilter?.addEventListener("change", applyPitcherFilters);
  dom.pitcherStatView?.addEventListener("change", applyPitcherFilters);
  dom.pitcherRowLimit?.addEventListener("change", applyPitcherFilters);
  dom.resetPitcherFilters?.addEventListener("click", () => {
    dom.pitcherTeamFilter.value = "ALL";
    if (dom.pitcherRoleFilter) dom.pitcherRoleFilter.value = "ALL";
    dom.pitcherSearchFilter.value = "";
    dom.pitcherMinIpFilter.value = "0";
    dom.pitcherSortKeyFilter.value = "team_building_value_score";
    if (dom.pitcherStatView) dom.pitcherStatView.value = "decision";
    if (dom.pitcherRowLimit) dom.pitcherRowLimit.value = "25";
    applyPitcherFilters();
  });
}

function bindRosterEvents() {
  for (const tableBody of [dom.projectionRows, dom.pitcherRows].filter(Boolean)) {
    tableBody.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("button[data-action][data-type][data-player-id]") : null;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const playerId = target.dataset.playerId;
      const type = target.dataset.type;
      const action = target.dataset.action;
      if (!playerId || !type || !action) {
        return;
      }

      if (action === "toggle-roster") {
        if (isSelected(type, playerId)) {
          removeFromRoster(type, playerId);
          return;
        }

        addToRoster(type, playerId);
        return;
      }

      if (action === "toggle-compare" && canCompare(type, playerId)) {
        toggleCompare(type, playerId);
      }
    });
  }

  for (const slotContainer of [dom.rosterHitterSlots, dom.rosterPitcherSlots, dom.hitterComparison, dom.pitcherComparison].filter(Boolean)) {
    slotContainer.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      if (target.dataset.action === "remove-compare") {
        const playerId = target.dataset.playerId;
        const type = target.dataset.type;
        if (!playerId || !type) {
          return;
        }

        toggleCompare(type, playerId);
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
  if (dom.summaryCards) dom.summaryCards.innerHTML = "";
  if (dom.pitcherSummaryCards) dom.pitcherSummaryCards.innerHTML = "";
  if (dom.hitterComparison) dom.hitterComparison.innerHTML = "";
  if (dom.pitcherComparison) dom.pitcherComparison.innerHTML = "";
  if (dom.projectionRows) dom.projectionRows.innerHTML = `<tr><td class="empty" colspan="17">Failed to load hitter data: ${error.message}</td></tr>`;
  if (dom.pitcherRows) dom.pitcherRows.innerHTML = `<tr><td class="empty" colspan="16">Failed to load pitcher data: ${error.message}</td></tr>`;
}

export async function initApp() {
  registerComparisonCallbacks({
    onChange: () => {
      applyHitterFilters();
      applyPitcherFilters();
    },
  });

  registerRosterCallbacks({
    onRosterChange: () => {
      applyHitterFilters();
      applyPitcherFilters();
    },
  });

  bindFilterEvents();
  bindRosterEvents();
  renderGlossary();

  try {
    const [hittersResponse, pitchersResponse] = await Promise.all([fetch(hitterDataUrl), fetch(pitcherDataUrl)]);
    state.hitters = await hittersResponse.json();
    state.pitchers = await pitchersResponse.json();
    restoreRoster();
    restoreComparison();
    populateTeamFilters();
    populateBoardFilters();
    renderRosterBuilder();
    renderComparisons();
    applyHitterFilters();
    applyPitcherFilters();
  } catch (error) {
    renderLoadError(error);
  }
}
