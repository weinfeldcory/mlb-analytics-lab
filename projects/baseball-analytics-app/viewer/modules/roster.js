import {
  hitterSlotDefinitions,
  pitcherSlotDefinitions,
  pythagoreanExponent,
  rosterStorageKey,
  teamSeasonInnings,
  teamSeasonPa,
} from "./config.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { formatInteger, formatNumber, teamLabel, weightedAverage } from "./utils.js";

let onRosterChange = () => {};

function normalizeHitterPosition(position) {
  const raw = typeof position === "string" ? position.trim().toUpperCase() : "";

  if (["LF", "CF", "RF", "OF"].includes(raw)) {
    return "OF";
  }

  if (raw === "TWP") {
    return "DH";
  }

  return raw || "UTIL";
}

function eligibleHitterSlotIds(record) {
  const position = normalizeHitterPosition(record.roster_position);
  const slots = [];

  if (position === "OF") {
    slots.push("OF1", "OF2", "OF3", "UTIL1", "UTIL2", "BENCH1", "BENCH2", "DH");
  } else if (["C", "1B", "2B", "3B", "SS"].includes(position)) {
    slots.push(position, "UTIL1", "UTIL2", "BENCH1", "BENCH2");
    if (position !== "C") {
      slots.push("DH");
    }
  } else if (position === "DH") {
    slots.push("DH", "UTIL1", "UTIL2", "BENCH1", "BENCH2");
  } else {
    slots.push("UTIL1", "UTIL2", "BENCH1", "BENCH2", "DH");
  }

  return [...new Set(slots)];
}

function eligiblePitcherSlotIds(record) {
  const role = typeof record.projected_role_bucket === "string" ? record.projected_role_bucket : "";

  if (role === "starter") {
    return ["SP1", "SP2", "SP3", "SP4", "SP5", "P1", "P2", "P3"];
  }

  if (role === "closer") {
    return ["CL", "RP1", "RP2", "RP3", "RP4", "P1", "P2", "P3"];
  }

  if (role === "high_leverage_reliever") {
    return ["RP1", "RP2", "RP3", "RP4", "P1", "P2", "P3", "CL"];
  }

  if (role === "swingman") {
    return ["P1", "P2", "P3", "RP1", "RP2", "SP5"];
  }

  return ["RP1", "RP2", "RP3", "RP4", "P1", "P2", "P3"];
}

function datasetForType(type) {
  return type === "pitcher" ? state.pitchers : state.hitters;
}

function slotsForType(type) {
  return type === "pitcher" ? state.roster.pitchers : state.roster.hitters;
}

export function findRecordById(type, playerId) {
  return datasetForType(type).find((record) => String(record.fg_player_id) === String(playerId));
}

export function isSelected(type, playerId) {
  return slotsForType(type).some((slot) => String(slot.playerId) === String(playerId));
}

export function selectedRecords(type) {
  return slotsForType(type).map((slot) => findRecordById(type, slot.playerId)).filter(Boolean);
}

function saveRoster() {
  const payload = {
    hitters: state.roster.hitters.map((slot) => ({ id: slot.id, playerId: slot.playerId })),
    pitchers: state.roster.pitchers.map((slot) => ({ id: slot.id, playerId: slot.playerId })),
  };
  localStorage.setItem(rosterStorageKey, JSON.stringify(payload));
}

export function restoreRoster() {
  try {
    const stored = JSON.parse(localStorage.getItem(rosterStorageKey) || "{}");
    const hitterBySlot = new Map((stored.hitters || []).map((slot) => [slot.id, slot.playerId]));
    const pitcherBySlot = new Map((stored.pitchers || []).map((slot) => [slot.id, slot.playerId]));

    state.roster.hitters = hitterSlotDefinitions.map((slot) => ({ ...slot, playerId: hitterBySlot.get(slot.id) || null }));
    state.roster.pitchers = pitcherSlotDefinitions.map((slot) => ({ ...slot, playerId: pitcherBySlot.get(slot.id) || null }));
  } catch (_error) {
    state.roster.hitters = hitterSlotDefinitions.map((slot) => ({ ...slot, playerId: null }));
    state.roster.pitchers = pitcherSlotDefinitions.map((slot) => ({ ...slot, playerId: null }));
  }
}

export function addToRoster(type, playerId) {
  if (isSelected(type, playerId)) {
    return;
  }

  const record = findRecordById(type, playerId);
  if (!record) {
    return;
  }

  const eligible = type === "pitcher" ? eligiblePitcherSlotIds(record) : eligibleHitterSlotIds(record);
  const openSlot = slotsForType(type).find((slot) => !slot.playerId && eligible.includes(slot.id));
  if (!openSlot) {
    return;
  }

  openSlot.playerId = playerId;
  saveRoster();
  renderRosterBuilder();
  onRosterChange();
}

export function removeFromRoster(type, playerId) {
  const slot = slotsForType(type).find((candidate) => String(candidate.playerId) === String(playerId));
  if (!slot) {
    return;
  }

  slot.playerId = null;
  saveRoster();
  renderRosterBuilder();
  onRosterChange();
}

export function removeFromSlot(type, slotId) {
  const slot = slotsForType(type).find((candidate) => candidate.id === slotId);
  if (!slot) {
    return;
  }

  slot.playerId = null;
  saveRoster();
  renderRosterBuilder();
  onRosterChange();
}

function rosterProjection(hitterRecords, pitcherRecords) {
  const hitterWar = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_value_war_proxy) || 0), 0);
  const pitcherWar = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_war) || 0), 0);
  const teamBuild =
    [...hitterRecords, ...pitcherRecords].reduce((sum, record) => sum + (Number(record.team_building_value_score) || 0), 0) /
    Math.max(hitterRecords.length + pitcherRecords.length, 1);

  const totalPa = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_pa) || 0), 0);
  const totalHits = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_hits) || 0), 0);
  const totalWalks = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_walks) || 0), 0);
  const totalHr = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_home_runs) || 0), 0);
  const totalSb = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_stolen_bases) || 0), 0);
  const totalDefense = hitterRecords.reduce((sum, record) => sum + (Number(record.projected_defense_runs) || 0), 0);
  const offenseWoba = weightedAverage(hitterRecords, "projected_woba", "projected_pa");
  const offenseWobaPlus = weightedAverage(hitterRecords, "projected_woba_plus", "projected_pa");
  const avg = weightedAverage(hitterRecords, "projected_avg", "projected_pa");
  const obp = weightedAverage(hitterRecords, "projected_obp", "projected_pa");
  const slg = weightedAverage(hitterRecords, "projected_slg", "projected_pa");
  const paScale = totalPa > 0 ? teamSeasonPa / totalPa : 0;
  const estimatedRunsScored =
    totalPa > 0 ? teamSeasonPa * (0.113 + (offenseWoba - 0.315) / 1.85) + totalSb * paScale * 0.08 : 0;

  const projectedPitchingIp = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_ip) || 0), 0);
  const projectedEarnedRuns = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_earned_runs) || 0), 0);
  const projectedRunsAllowed = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_runs_allowed) || 0), 0);
  const projectedPitchingKs = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_strikeouts) || 0), 0);
  const projectedPitchingBbs = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_walks) || 0), 0);
  const projectedPitchingHits = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_hits_allowed) || 0), 0);
  const projectedPitchingHr = pitcherRecords.reduce((sum, record) => sum + (Number(record.projected_home_runs_allowed) || 0), 0);
  const scaledRunsAllowed = projectedPitchingIp > 0 ? projectedRunsAllowed * (teamSeasonInnings / projectedPitchingIp) : 0;
  const scaledEarnedRuns = projectedPitchingIp > 0 ? projectedEarnedRuns * (teamSeasonInnings / projectedPitchingIp) : 0;
  const scaledPitchingKs = projectedPitchingIp > 0 ? projectedPitchingKs * (teamSeasonInnings / projectedPitchingIp) : 0;
  const scaledPitchingBbs = projectedPitchingIp > 0 ? projectedPitchingBbs * (teamSeasonInnings / projectedPitchingIp) : 0;
  const scaledPitchingHits = projectedPitchingIp > 0 ? projectedPitchingHits * (teamSeasonInnings / projectedPitchingIp) : 0;
  const scaledPitchingHr = projectedPitchingIp > 0 ? projectedPitchingHr * (teamSeasonInnings / projectedPitchingIp) : 0;
  const teamEra = scaledEarnedRuns > 0 ? (scaledEarnedRuns * 9) / teamSeasonInnings : 0;
  const teamWhip = projectedPitchingIp > 0 ? (scaledPitchingHits + scaledPitchingBbs) / teamSeasonInnings : 0;
  const runPrevention = weightedAverage(pitcherRecords, "blended_run_prevention_score", "projected_ip");

  const fullRosterComplete =
    hitterRecords.length === hitterSlotDefinitions.length && pitcherRecords.length === pitcherSlotDefinitions.length;

  const winPct =
    estimatedRunsScored > 0 && scaledRunsAllowed > 0
      ? Math.pow(estimatedRunsScored, pythagoreanExponent) /
        (Math.pow(estimatedRunsScored, pythagoreanExponent) + Math.pow(scaledRunsAllowed, pythagoreanExponent))
      : 0;
  const estimatedWins = fullRosterComplete ? Math.max(45, Math.min(120, Math.round(winPct * 162))) : null;
  const estimatedLosses = estimatedWins === null ? null : 162 - estimatedWins;

  return {
    hitterWar,
    pitcherWar,
    teamBuild,
    offenseWoba,
    offenseWobaPlus,
    avg,
    obp,
    slg,
    totalPa,
    totalHits,
    totalWalks,
    totalHr,
    totalSb,
    totalDefense,
    estimatedRunsScored,
    scaledRunsAllowed,
    projectedPitchingIp,
    scaledPitchingKs,
    scaledPitchingBbs,
    scaledPitchingHits,
    scaledPitchingHr,
    teamEra,
    teamWhip,
    runPrevention,
    estimatedWins,
    estimatedLosses,
  };
}

function renderSlotCards(type, container, slots) {
  container.innerHTML = slots
    .map((slot) => {
      const record = findRecordById(type, slot.playerId);

      if (!record) {
        return `
          <article class="slot-card">
            <span class="slot-label">${slot.label}</span>
            <div class="slot-empty">Open slot</div>
            <div class="slot-meta">Add a ${type} from the board.</div>
          </article>
        `;
      }

      const metaLine =
        type === "pitcher"
          ? `${teamLabel(record)} · ${record.roster_role} · ${record.projected_role_bucket}`
          : `${teamLabel(record)} · ${record.roster_position || "-"} · ${record.roster_role}`;

      const scoreLine =
        type === "pitcher"
          ? `Build ${formatNumber(record.team_building_value_score, 1)} · ERA ${formatNumber(record.projected_era, 2)} · IP ${formatNumber(record.projected_ip, 1)}`
          : `Build ${formatNumber(record.team_building_value_score, 1)} · WAR ${formatNumber(record.projected_value_war_proxy, 1)}`;

      return `
        <article class="slot-card filled">
          <span class="slot-label">${slot.label}</span>
          <div class="slot-player">${record.player_name}</div>
          <div class="slot-meta">${metaLine}</div>
          <div class="slot-meta">${scoreLine}</div>
          <button class="slot-remove" data-type="${type}" data-slot-id="${slot.id}">Remove</button>
        </article>
      `;
    })
    .join("");
}

export function renderRosterBuilder() {
  const hitterRecords = selectedRecords("hitter");
  const pitcherRecords = selectedRecords("pitcher");
  const fullRosterComplete =
    hitterRecords.length === hitterSlotDefinitions.length && pitcherRecords.length === pitcherSlotDefinitions.length;

  dom.rosterStatus.textContent = `${hitterRecords.length} / ${hitterSlotDefinitions.length} hitters · ${pitcherRecords.length} / ${pitcherSlotDefinitions.length} pitchers`;
  renderSlotCards("hitter", dom.rosterHitterSlots, state.roster.hitters);
  renderSlotCards("pitcher", dom.rosterPitcherSlots, state.roster.pitchers);

  if (!hitterRecords.length && !pitcherRecords.length) {
    dom.rosterSummaryCards.innerHTML = `
      <article class="card">
        <span class="card-label">Roster Build</span>
        <div class="card-value">Start Drafting</div>
        <div class="card-subtext">Select hitters and pitchers from the boards to model a full season.</div>
      </article>
    `;
    dom.rosterAssumption.textContent =
      "Formula: runs scored comes from scaled hitter wOBA; runs allowed comes from scaled pitcher projected runs allowed; wins use a 1.83 Pythagorean exponent.";
    dom.rosterTeamStats.innerHTML = "";
    return;
  }

  const projection = rosterProjection(hitterRecords, pitcherRecords);
  const summaryCardsMarkup = [
    { label: "Selected Hitter WAR", value: formatNumber(projection.hitterWar, 1), subtext: "Offensive roster contribution" },
    { label: "Selected Pitcher WAR", value: formatNumber(projection.pitcherWar, 1), subtext: "Staff contribution from selected pitchers" },
    {
      label: "Projected Runs",
      value: `${formatInteger(projection.estimatedRunsScored)} / ${formatInteger(projection.scaledRunsAllowed)}`,
      subtext: "Runs scored and runs allowed over 162 games",
    },
    {
      label: "Likely Record",
      value: fullRosterComplete ? `${projection.estimatedWins}-${projection.estimatedLosses}` : "Incomplete",
      subtext: fullRosterComplete
        ? `Pythagorean estimate with exponent ${pythagoreanExponent}`
        : `Add ${hitterSlotDefinitions.length - hitterRecords.length} hitters and ${pitcherSlotDefinitions.length - pitcherRecords.length} pitchers to unlock the record`,
    },
    {
      label: "Offense Quality",
      value: `${formatNumber(projection.offenseWoba, 3)} / ${formatInteger(projection.offenseWobaPlus)}`,
      subtext: "Projected team wOBA / wOBA+",
    },
    {
      label: "Staff Quality",
      value: `${formatNumber(projection.teamEra, 2)} / ${formatNumber(projection.teamWhip, 2)}`,
      subtext: "Projected ERA / WHIP from selected staff",
    },
  ];

  dom.rosterSummaryCards.innerHTML = summaryCardsMarkup
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

  dom.rosterAssumption.textContent =
    "Formula: runs scored = 6,200 PA scaled from selected hitter wOBA; runs allowed = selected pitcher projected runs allowed scaled to 1,458 innings; wins use a 1.83 Pythagorean exponent.";

  const teamStats = [
    { label: "Projected AVG", value: formatNumber(projection.avg, 3) },
    { label: "Projected OBP", value: formatNumber(projection.obp, 3) },
    { label: "Projected SLG", value: formatNumber(projection.slg, 3) },
    { label: "Hitter PA", value: formatInteger(projection.totalPa) },
    { label: "Projected Hits", value: formatInteger(projection.totalHits) },
    { label: "Projected Walks", value: formatInteger(projection.totalWalks) },
    { label: "Projected HR", value: formatInteger(projection.totalHr) },
    { label: "Projected SB", value: formatInteger(projection.totalSb) },
    { label: "Defense Runs", value: formatNumber(projection.totalDefense, 1) },
    { label: "Pitching IP", value: formatNumber(projection.projectedPitchingIp, 1) },
    { label: "Pitching K", value: formatInteger(projection.scaledPitchingKs) },
    { label: "Pitching BB", value: formatInteger(projection.scaledPitchingBbs) },
    { label: "Hits Allowed", value: formatInteger(projection.scaledPitchingHits) },
    { label: "HR Allowed", value: formatInteger(projection.scaledPitchingHr) },
    { label: "Run Prevention", value: formatNumber(projection.runPrevention, 1) },
  ];

  dom.rosterTeamStats.innerHTML = teamStats
    .map(
      (stat) => `
        <article class="stat-chip">
          <span class="stat-chip-label">${stat.label}</span>
          <div class="stat-chip-value">${stat.value}</div>
        </article>
      `,
    )
    .join("");
}

export function registerRosterCallbacks(callbacks) {
  onRosterChange = callbacks.onRosterChange || (() => {});
}
