import { pitcherSlotDefinitions } from "./config.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { isSelected, selectedRecords } from "./roster.js";
import { average, formatInteger, formatNumber, teamLabel } from "./utils.js";

export function updatePitcherSummary(records) {
  const totalWar = records.reduce((sum, record) => sum + (Number(record.projected_war) || 0), 0);
  const topArm = records[0];

  const cards = [
    { label: "Pitchers", value: records.length, subtext: "Current filtered staff pool" },
    { label: "Avg Team Build", value: formatNumber(average(records, "team_building_value_score"), 1), subtext: "Counting stats plus pitch-quality signal" },
    { label: "Avg Run Prevention", value: formatNumber(average(records, "blended_run_prevention_score"), 1), subtext: "Prior plus current performance blend" },
    { label: "Avg Pitch Quality", value: formatNumber(average(records, "blended_pitch_quality_score"), 1), subtext: "Historical Statcast-driven pitch quality" },
    { label: "Projected WAR", value: formatNumber(totalWar, 1), subtext: "Sum of projected pitcher WAR" },
    {
      label: "Top Arm",
      value: topArm ? topArm.player_name : "-",
      subtext: topArm ? `${topArm.roster_role} · ${teamLabel(topArm)} · ${formatNumber(topArm.team_building_value_score, 1)}` : "No matching rows",
    },
  ];

  dom.pitcherSummaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="card">
          <span class="card-label">${card.label}</span>
          <div class="card-value">${card.value}</div>
          <div class="card-subtext">${card.subtext}</div>
        </article>
      `,
    )
    .join("");
}

export function renderPitcherTable(records) {
  if (!records.length) {
    dom.pitcherRows.innerHTML = `<tr><td class="empty" colspan="15">No pitchers match the current filters.</td></tr>`;
    return;
  }

  dom.pitcherRows.innerHTML = records
    .map((record) => {
      const selected = isSelected("pitcher", record.fg_player_id);
      const rosterFull = selectedRecords("pitcher").length >= pitcherSlotDefinitions.length;
      const canAdd = !selected && !rosterFull;
      const buttonClass = selected ? "pick-button is-selected" : canAdd ? "pick-button" : "pick-button is-disabled";
      const buttonLabel = selected ? "Selected" : canAdd ? "Add" : "Full";

      return `
        <tr>
          <td>
            <button class="${buttonClass}" data-type="pitcher" data-player-id="${record.fg_player_id}">
              ${buttonLabel}
            </button>
          </td>
          <td>
            <div class="player-cell">
              <strong>${record.player_name}</strong>
              <span class="player-meta">${record.projected_role_bucket} · ERA diff ${formatNumber(
                record.current_era_diff,
                2,
              )} · Stuff+ ${formatNumber(record.projected_stuff_plus_base, 1)}</span>
            </div>
          </td>
          <td>${teamLabel(record)}</td>
          <td>${record.roster_role || "-"}</td>
          <td>${formatNumber(record.team_building_value_score, 1)}</td>
          <td>${formatNumber(record.blended_run_prevention_score, 1)}</td>
          <td>${formatNumber(record.blended_pitch_quality_score, 1)}</td>
          <td>${formatNumber(record.blended_playing_time_score, 1)}</td>
          <td>${formatNumber(record.upside_score, 1)}</td>
          <td>${formatNumber(record.floor_score, 1)}</td>
          <td>${formatNumber(record.projected_era, 2)}</td>
          <td>${formatNumber(record.projected_ip, 1)}</td>
          <td>${formatInteger(record.projected_strikeouts)}</td>
          <td>${formatNumber(record.current_era, 2)}</td>
          <td>${formatNumber(record.pace_ip_162, 1)}</td>
        </tr>
      `;
    })
    .join("");
}

export function applyPitcherFilters() {
  const selectedTeam = dom.pitcherTeamFilter.value;
  const searchTerm = dom.pitcherSearchFilter.value.trim().toLowerCase();
  const minIp = dom.pitcherMinIpFilter.value.trim() === "" ? 0 : Number(dom.pitcherMinIpFilter.value) || 0;
  const sortKey = dom.pitcherSortKeyFilter.value;

  state.filteredPitchers = state.pitchers
    .filter((record) => selectedTeam === "ALL" || teamLabel(record) === selectedTeam)
    .filter((record) => record.player_name.toLowerCase().includes(searchTerm))
    .filter((record) => Number(record.current_ip ?? record.projected_ip ?? 0) >= minIp)
    .sort((a, b) => {
      const left = Number(a[sortKey]);
      const right = Number(b[sortKey]);
      return (Number.isNaN(right) ? -Infinity : right) - (Number.isNaN(left) ? -Infinity : left);
    });

  updatePitcherSummary(state.filteredPitchers);
  renderPitcherTable(state.filteredPitchers);
}
