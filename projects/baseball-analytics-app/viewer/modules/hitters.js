import { hitterSlotDefinitions } from "./config.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { isSelected, selectedRecords } from "./roster.js";
import { average, formatNumber, teamLabel } from "./utils.js";

export function updateHitterSummary(records) {
  const totalWar = records.reduce((sum, record) => sum + (Number(record.projected_value_war_proxy) || 0), 0);
  const bestFit = records[0];

  const cards = [
    { label: "Hitters", value: records.length, subtext: "Current filtered population" },
    { label: "Avg Team Build", value: formatNumber(average(records, "team_building_value_score"), 1), subtext: "Composite roster-construction score" },
    { label: "Avg Upside", value: formatNumber(average(records, "upside_score"), 1), subtext: "Ceiling across the active pool" },
    { label: "Avg Floor", value: formatNumber(average(records, "floor_score"), 1), subtext: "Stability plus lineup utility" },
    { label: "Projected WAR", value: formatNumber(totalWar, 1), subtext: "Sum of WAR proxy in the current slice" },
    {
      label: "Top Fit",
      value: bestFit ? bestFit.player_name : "-",
      subtext: bestFit ? `${bestFit.roster_role} · ${teamLabel(bestFit)} · ${formatNumber(bestFit.team_building_value_score, 1)}` : "No matching rows",
    },
  ];

  dom.summaryCards.innerHTML = cards
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

export function updateTeamPanel(records) {
  const selectedTeam = dom.hitterTeamFilter.value;

  if (selectedTeam === "ALL") {
    dom.teamTitle.textContent = "All Hitter Pools";
    dom.teamCopy.textContent =
      "Use the hitter board to compare talent, playing time, upside, and risk before slotting bats into the roster build.";
    dom.teamMetrics.innerHTML = `
      <article class="card">
        <span class="card-label">Teams</span>
        <div class="card-value">${new Set(state.hitters.map(teamLabel)).size}</div>
        <div class="card-subtext">Distinct clubs in the current hitter file</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Talent</span>
        <div class="card-value">${formatNumber(average(records, "blended_talent_score"), 1)}</div>
        <div class="card-subtext">Prior plus in-season offensive signal</div>
      </article>
      <article class="card">
        <span class="card-label">Avg PT</span>
        <div class="card-value">${formatNumber(average(records, "blended_playing_time_score"), 1)}</div>
        <div class="card-subtext">Expected lineup access and role stability</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Starter</span>
        <div class="card-value">${formatNumber(average(records, "starter_probability_score"), 1)}</div>
        <div class="card-subtext">Likelihood of holding a regular role</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Platoon Risk</span>
        <div class="card-value">${formatNumber(average(records, "platoon_risk_score"), 1)}</div>
        <div class="card-subtext">Higher means more role fragility</div>
      </article>
    `;
  } else {
    const teamRecords = state.hitters.filter((record) => teamLabel(record) === selectedTeam);
    const topTeamBat = [...teamRecords].sort(
      (a, b) => Number(b.team_building_value_score) - Number(a.team_building_value_score),
    )[0];

    dom.teamTitle.textContent = selectedTeam;
    dom.teamCopy.textContent = topTeamBat
      ? `${topTeamBat.player_name} is the top hitter fit on this club at ${formatNumber(topTeamBat.team_building_value_score, 1)}. Role: ${topTeamBat.roster_role}.`
      : "No rows for this team.";

    dom.teamMetrics.innerHTML = `
      <article class="card">
        <span class="card-label">Avg Team Build</span>
        <div class="card-value">${formatNumber(average(teamRecords, "team_building_value_score"), 1)}</div>
        <div class="card-subtext">Composite roster score</div>
      </article>
      <article class="card">
        <span class="card-label">Projected WAR</span>
        <div class="card-value">${formatNumber(average(teamRecords, "projected_value_war_proxy"), 2)}</div>
        <div class="card-subtext">Average player WAR proxy</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Upside</span>
        <div class="card-value">${formatNumber(average(teamRecords, "upside_score"), 1)}</div>
        <div class="card-subtext">Ceiling if roles hold</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Floor</span>
        <div class="card-value">${formatNumber(average(teamRecords, "floor_score"), 1)}</div>
        <div class="card-subtext">Safer lineup utility</div>
      </article>
      <article class="card">
        <span class="card-label">Avg Stability</span>
        <div class="card-value">${formatNumber(average(teamRecords, "stability_score"), 1)}</div>
        <div class="card-subtext">Sample and role reliability</div>
      </article>
    `;
  }

  const leaders = [...records].sort((a, b) => Number(b.team_building_value_score) - Number(a.team_building_value_score)).slice(0, 3);

  dom.teamLeadersList.innerHTML = leaders.length
    ? leaders
        .map(
          (record, index) => `
            <article class="leader-card">
              <span class="leader-rank">#${index + 1}</span>
              <strong>${record.player_name}</strong>
              <div class="leader-line">${record.roster_role} · ${teamLabel(record)} · ${record.roster_position || "-"}</div>
              <div class="leader-line">Build ${formatNumber(record.team_building_value_score, 1)} · Talent ${formatNumber(
                record.blended_talent_score,
                1,
              )} · PT ${formatNumber(record.blended_playing_time_score, 1)}</div>
            </article>
          `,
        )
        .join("")
    : `<article class="leader-card"><strong>No matching hitters</strong><div class="leader-line">Adjust the filters to populate this panel.</div></article>`;
}

export function renderHitterTable(records) {
  if (!records.length) {
    dom.projectionRows.innerHTML = `<tr><td class="empty" colspan="16">No hitters match the current filters.</td></tr>`;
    return;
  }

  dom.projectionRows.innerHTML = records
    .map((record) => {
      const selected = isSelected("hitter", record.fg_player_id);
      const rosterFull = selectedRecords("hitter").length >= hitterSlotDefinitions.length;
      const canAdd = !selected && !rosterFull;
      const buttonClass = selected ? "pick-button is-selected" : canAdd ? "pick-button" : "pick-button is-disabled";
      const buttonLabel = selected ? "Selected" : canAdd ? "Add" : "Full";

      return `
        <tr>
          <td>
            <button class="${buttonClass}" data-type="hitter" data-player-id="${record.fg_player_id}">
              ${buttonLabel}
            </button>
          </td>
          <td>
            <div class="player-cell">
              <strong>${record.player_name}</strong>
              <span class="player-meta">${record.archetype || "unknown"} · ${record.position_bucket || "unknown"} · wOBA diff ${formatNumber(
                record.current_woba_diff,
                3,
              )}</span>
            </div>
          </td>
          <td>${teamLabel(record)}</td>
          <td>${record.roster_role || "-"}</td>
          <td>${record.roster_position || "-"}</td>
          <td>${formatNumber(record.team_building_value_score, 1)}</td>
          <td>${formatNumber(record.blended_talent_score, 1)}</td>
          <td>${formatNumber(record.blended_playing_time_score, 1)}</td>
          <td>${formatNumber(record.upside_score, 1)}</td>
          <td>${formatNumber(record.floor_score, 1)}</td>
          <td>${formatNumber(record.starter_probability_score, 1)}</td>
          <td>${formatNumber(record.stability_score, 1)}</td>
          <td>${formatNumber(record.platoon_risk_score, 1)}</td>
          <td>${formatNumber(record.current_woba, 3)}</td>
          <td>${formatNumber(record.projected_woba, 3)}</td>
          <td>${formatNumber(record.pace_pa_162, 1)}</td>
        </tr>
      `;
    })
    .join("");
}

export function applyHitterFilters() {
  const selectedTeam = dom.hitterTeamFilter.value;
  const searchTerm = dom.hitterSearchFilter.value.trim().toLowerCase();
  const minPa = dom.hitterMinPaFilter.value.trim() === "" ? 0 : Number(dom.hitterMinPaFilter.value) || 0;
  const sortKey = dom.hitterSortKeyFilter.value;

  state.filteredHitters = state.hitters
    .filter((record) => selectedTeam === "ALL" || teamLabel(record) === selectedTeam)
    .filter((record) => record.player_name.toLowerCase().includes(searchTerm))
    .filter((record) => Number(record.current_pa ?? record.projected_pa ?? 0) >= minPa)
    .sort((a, b) => {
      const left = Number(a[sortKey]);
      const right = Number(b[sortKey]);
      return (Number.isNaN(right) ? -Infinity : right) - (Number.isNaN(left) ? -Infinity : left);
    });

  updateHitterSummary(state.filteredHitters);
  updateTeamPanel(state.filteredHitters);
  renderHitterTable(state.filteredHitters);
}
