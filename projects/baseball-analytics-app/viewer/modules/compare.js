import { comparisonStorageKey } from "./config.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { formatInteger, formatNumber, formatPercent, recordKey, teamLabel } from "./utils.js";

let onComparisonChange = () => {};

const comparisonConfig = {
  hitter: {
    stateKey: "hitters",
    container: () => dom.hitterComparison,
    dataset: () => state.hitters,
    title: "Hitter Comparison",
    emptyCopy: "Compare two bats to see how team-build, talent, playing time, and risk diverge.",
    metrics: [
      { label: "Team Build", key: "team_building_value_score", digits: 1, higherIsBetter: true },
      { label: "Talent", key: "blended_talent_score", digits: 1, higherIsBetter: true },
      { label: "Playing Time", key: "blended_playing_time_score", digits: 1, higherIsBetter: true },
      { label: "Upside", key: "upside_score", digits: 1, higherIsBetter: true },
      { label: "Floor", key: "floor_score", digits: 1, higherIsBetter: true },
      { label: "Proj wOBA", key: "projected_woba", digits: 3, higherIsBetter: true },
      { label: "Proj PA", key: "projected_pa", format: "integer", higherIsBetter: true },
    ],
    explanationTitle: "Why This Hitter Scores Here",
  },
  pitcher: {
    stateKey: "pitchers",
    container: () => dom.pitcherComparison,
    dataset: () => state.pitchers,
    title: "Pitcher Comparison",
    emptyCopy: "Compare two arms to see role, run prevention, pitch quality, and workload tradeoffs.",
    metrics: [
      { label: "Team Build", key: "team_building_value_score", digits: 1, higherIsBetter: true },
      { label: "Run Prevention", key: "blended_run_prevention_score", digits: 1, higherIsBetter: true },
      { label: "Pitch Quality", key: "blended_pitch_quality_score", digits: 1, higherIsBetter: true },
      { label: "Playing Time", key: "blended_playing_time_score", digits: 1, higherIsBetter: true },
      { label: "Upside", key: "upside_score", digits: 1, higherIsBetter: true },
      { label: "Proj ERA", key: "projected_era", digits: 2, higherIsBetter: false },
      { label: "Proj IP", key: "projected_ip", digits: 1, higherIsBetter: true },
      { label: "Proj K", key: "projected_strikeouts", format: "integer", higherIsBetter: true },
    ],
    explanationTitle: "Why This Pitcher Scores Here",
  },
};

function valuesForType(type) {
  return state.comparison[comparisonConfig[type].stateKey];
}

function saveComparison() {
  localStorage.setItem(comparisonStorageKey, JSON.stringify(state.comparison));
}

function formatMetric(record, metric) {
  if (!record) {
    return "-";
  }

  return metric.format === "integer"
    ? formatInteger(record[metric.key])
    : formatNumber(record[metric.key], metric.digits ?? 1);
}

function metricDelta(leftRecord, rightRecord, metric) {
  if (!leftRecord || !rightRecord) {
    return "Select two players";
  }

  const left = Number(leftRecord[metric.key]);
  const right = Number(rightRecord[metric.key]);
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return "No shared read";
  }

  const delta = left - right;
  if (Math.abs(delta) < 0.0001) {
    return "Even";
  }

  const betterRecord =
    metric.higherIsBetter === false ? (left < right ? leftRecord : rightRecord) : left > right ? leftRecord : rightRecord;
  const magnitude =
    metric.format === "integer" ? formatInteger(Math.abs(delta)) : formatNumber(Math.abs(delta), metric.digits ?? 1);
  return `${betterRecord.player_name} +${magnitude}`;
}

function findRecord(type, playerId) {
  return comparisonConfig[type].dataset().find((record) => recordKey(type, record) === String(playerId));
}

function formatSignedNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  const numeric = Number(value);
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(digits)}`;
}

function formatRoleShare(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return `${Math.round(Number(value) * 100)}%`;
}

function reliabilityBand(values) {
  const numericValues = values.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
  if (!numericValues.length) {
    return "unknown";
  }

  const avg = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  if (avg >= 0.8) {
    return "high";
  }
  if (avg >= 0.65) {
    return "steady";
  }
  if (avg >= 0.5) {
    return "mixed";
  }
  return "fragile";
}

function explanationPillMarkup(label, value) {
  return `<span class="explanation-pill"><strong>${label}</strong>${value}</span>`;
}

function explanationCardMarkup(card) {
  return `
    <article class="explanation-card">
      <span class="card-label">${card.label}</span>
      <div class="explanation-card-value">${card.value}</div>
      <div class="card-subtext">${card.copy}</div>
      <div class="explanation-pill-row">
        ${card.pills.map((pill) => explanationPillMarkup(pill.label, pill.value)).join("")}
      </div>
    </article>
  `;
}

function hitterExplanationCards(record) {
  const reliabilityState = reliabilityBand([
    record.contact_reliability,
    record.discipline_reliability,
    record.power_reliability,
    record.speed_reliability,
    record.defense_reliability,
    record.playing_time_reliability,
  ]);

  return [
    {
      label: "Prior Base",
      value: formatNumber(record.prior_talent_score, 1),
      copy: `The preseason talent prior still anchors this bat. The weighted sample is ${formatNumber(record.weighted_pa_sample, 1)} PA, so the board starts from a real historical base instead of chasing three good games.`,
      pills: [
        { label: "Talent Prior", value: formatNumber(record.prior_talent_score, 1) },
        { label: "Power Prior", value: formatNumber(record.prior_power_score, 1) },
        { label: "Weighted PA", value: formatNumber(record.weighted_pa_sample, 1) },
      ],
    },
    {
      label: "Current Signal",
      value: formatNumber(record.current_talent_signal_score, 1),
      copy: `The live-season signal is ${formatSignedNumber(record.current_woba_diff, 3)} versus the projection. That read is blended in with a ${formatPercent(record.current_sample_weight, 0)} offensive sample weight, which keeps April noise from fully taking over.`,
      pills: [
        { label: "Curr Talent", value: formatNumber(record.current_talent_signal_score, 1) },
        { label: "Curr wOBA", value: formatNumber(record.current_woba, 3) },
        { label: "Blend Weight", value: formatPercent(record.current_sample_weight, 0) },
      ],
    },
    {
      label: "Playing Time",
      value: formatNumber(record.blended_playing_time_score, 1),
      copy: `${record.roster_role || "Roster role"} keeps this hitter in the lineup plan. Starter probability ${formatNumber(record.starter_probability_score, 1)} and current PT weight ${formatPercent(record.current_playing_time_weight, 0)} show how much present usage has started to shape the role.`,
      pills: [
        { label: "Prior PT", value: formatNumber(record.prior_playing_time_score, 1) },
        { label: "Curr PT", value: formatNumber(record.current_playing_time_score, 1) },
        { label: "Starter", value: formatNumber(record.starter_probability_score, 1) },
      ],
    },
    {
      label: "Role And Reliability",
      value: formatNumber(record.team_building_value_score, 1),
      copy: `This profile reads ${reliabilityState} for trust. Stability ${formatNumber(record.stability_score, 1)} supports the score, while platoon risk ${formatNumber(record.platoon_risk_score, 1)} tells you how much role leakage could pull the value back.`,
      pills: [
        { label: "Stability", value: formatNumber(record.stability_score, 1) },
        { label: "PT Reliability", value: formatPercent(record.playing_time_reliability, 0) },
        { label: "Platoon Risk", value: formatNumber(record.platoon_risk_score, 1) },
      ],
    },
  ];
}

function pitcherExplanationCards(record) {
  const reliabilityState = reliabilityBand([record.weighted_ip_sample > 100 ? 0.85 : record.weighted_ip_sample > 60 ? 0.7 : 0.55, record.durability_age_factor, record.skill_age_factor]);

  return [
    {
      label: "Prior Base",
      value: formatNumber(record.projected_era_base, 2),
      copy: `The staff view starts from a prior ERA baseline of ${formatNumber(record.projected_era_base, 2)} across ${formatNumber(record.weighted_ip_sample, 1)} weighted innings. That is why the board still trusts the historical run-prevention shape.`,
      pills: [
        { label: "ERA Base", value: formatNumber(record.projected_era_base, 2) },
        { label: "WHIP Base", value: formatNumber(record.projected_whip_base, 2) },
        { label: "Weighted IP", value: formatNumber(record.weighted_ip_sample, 1) },
      ],
    },
    {
      label: "Current Signal",
      value: formatNumber(record.blended_run_prevention_score, 1),
      copy: `Current ERA is ${formatNumber(record.current_era, 2)}, which sits ${formatSignedNumber(record.current_era_diff, 2)} versus projection. That shifts the run-prevention view, but the board still keeps the prior pitch-quality foundation in the loop.`,
      pills: [
        { label: "Curr ERA", value: formatNumber(record.current_era, 2) },
        { label: "ERA Diff", value: formatSignedNumber(record.current_era_diff, 2) },
        { label: "Run Prev", value: formatNumber(record.blended_run_prevention_score, 1) },
      ],
    },
    {
      label: "Playing Time",
      value: formatNumber(record.blended_playing_time_score, 1),
      copy: `${record.roster_role || "Role"} is driving the innings shape. A ${formatRoleShare(record.projected_start_share)} start share and ${formatNumber(record.projected_ip_base, 1)} IP base tell you whether this score is built on rotation volume, leverage innings, or a narrower relief path.`,
      pills: [
        { label: "IP Base", value: formatNumber(record.projected_ip_base, 1) },
        { label: "Start Share", value: formatRoleShare(record.projected_start_share) },
        { label: "Save Share", value: formatRoleShare(record.projected_save_share) },
      ],
    },
    {
      label: "Role And Reliability",
      value: formatNumber(record.team_building_value_score, 1),
      copy: `This role reads ${reliabilityState} for trust. Stuff+ ${formatNumber(record.projected_stuff_plus_base, 1)} and Pitching+ ${formatNumber(record.projected_pitching_plus_base, 1)} support the ceiling, while age durability ${formatNumber(record.durability_age_factor, 3)} shapes how hard the model leans into volume.`,
      pills: [
        { label: "Stuff+", value: formatNumber(record.projected_stuff_plus_base, 1) },
        { label: "Pitching+", value: formatNumber(record.projected_pitching_plus_base, 1) },
        { label: "Durability", value: formatNumber(record.durability_age_factor, 3) },
      ],
    },
  ];
}

function explanationCards(type, record) {
  return type === "pitcher" ? pitcherExplanationCards(record) : hitterExplanationCards(record);
}

function explanationMarkup(type, record, slotIndex) {
  if (!record) {
    return `
      <article class="explanation-player is-empty">
        <div class="explanation-player-header">
          <div>
            <span class="slot-label">Slot ${slotIndex + 1}</span>
            <h4>Open explanation slot</h4>
          </div>
        </div>
        <p class="card-subtext">Add a ${type} to comparison and the board will break down prior, current signal, playing time, and reliability.</p>
      </article>
    `;
  }

  return `
    <article class="explanation-player">
      <div class="explanation-player-header">
        <div>
          <span class="slot-label">Slot ${slotIndex + 1}</span>
          <h4>${record.player_name}</h4>
        </div>
        <div class="explanation-player-meta">${teamLabel(record)} · ${record.roster_role || record.projected_role_bucket || "-"}</div>
      </div>
      <div class="explanation-grid">
        ${explanationCards(type, record).map((card) => explanationCardMarkup(card)).join("")}
      </div>
    </article>
  `;
}

function comparisonDecisionMarkup(type, leftRecord, rightRecord) {
  if (!leftRecord || !rightRecord) {
    return `
      <div class="comparison-decision">
        <span class="card-label">Decision Read</span>
        <div class="comparison-decision-copy">Select two ${type === "pitcher" ? "pitchers" : "hitters"} to see which player leads on current fit, ceiling, and trust.</div>
      </div>
    `;
  }

  const scoreKey = "team_building_value_score";
  const leftScore = Number(leftRecord[scoreKey]);
  const rightScore = Number(rightRecord[scoreKey]);
  const leader = leftScore >= rightScore ? leftRecord : rightRecord;
  const trailer = leader === leftRecord ? rightRecord : leftRecord;
  const separators = comparisonConfig[type].metrics
    .map((metric) => {
      const left = Number(leftRecord[metric.key]);
      const right = Number(rightRecord[metric.key]);
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return null;
      }
      return { metric, spread: Math.abs(left - right) };
    })
    .filter(Boolean)
    .sort((a, b) => b.spread - a.spread);
  const topSeparator = separators[0]?.metric;
  const roleRead =
    type === "pitcher"
      ? `${leftRecord.player_name} is a ${leftRecord.projected_role_bucket || "pitcher"} and ${rightRecord.player_name} is a ${rightRecord.projected_role_bucket || "pitcher"}.`
      : `${leftRecord.player_name} is tagged ${leftRecord.roster_role || "hitter"} and ${rightRecord.player_name} is tagged ${rightRecord.roster_role || "hitter"}.`;

  return `
    <div class="comparison-decision">
      <span class="card-label">Decision Read</span>
      <div class="comparison-decision-copy">
        <strong>${leader.player_name}</strong> leads the current team-building score by ${formatNumber(Math.abs(leftScore - rightScore), 1)} points over ${trailer.player_name}. ${topSeparator ? `The biggest separator right now is ${topSeparator.label.toLowerCase()}.` : ""} ${roleRead}
      </div>
    </div>
  `;
}

function slotMarkup(record, type, slotIndex) {
  if (!record) {
    return `
      <article class="comparison-slot is-empty">
        <span class="slot-label">Slot ${slotIndex + 1}</span>
        <div class="slot-empty">Open comparison slot</div>
        <div class="slot-meta">Use the Compare button in the ${type} board.</div>
      </article>
    `;
  }

  const meta =
    type === "pitcher"
      ? `${teamLabel(record)} · ${record.roster_role || "-"} · ${record.projected_role_bucket || "-"}`
      : `${teamLabel(record)} · ${record.roster_position || "-"} · ${record.roster_role || "-"}`;

  return `
    <article class="comparison-slot">
      <span class="slot-label">Slot ${slotIndex + 1}</span>
      <div class="comparison-player">${record.player_name}</div>
      <div class="slot-meta">${meta}</div>
      <button type="button" class="slot-remove" data-action="remove-compare" data-type="${type}" data-player-id="${recordKey(type, record)}">
        Remove
      </button>
    </article>
  `;
}

function renderComparison(type) {
  const { title, emptyCopy, metrics, explanationTitle } = comparisonConfig[type];
  const container = comparisonConfig[type].container();
  if (!container) {
    return;
  }
  const [leftId, rightId] = valuesForType(type);
  const leftRecord = findRecord(type, leftId);
  const rightRecord = findRecord(type, rightId);
  const comparisonHeadline =
    leftRecord && rightRecord
      ? type === "pitcher"
        ? `${leftRecord.player_name} offers ${Number(leftRecord.projected_era) < Number(rightRecord.projected_era) ? "better run prevention" : "weaker run prevention"}, while ${
            Number(leftRecord.upside_score) > Number(rightRecord.upside_score) ? leftRecord.player_name : rightRecord.player_name
          } carries more ceiling.`
        : `${Number(leftRecord.team_building_value_score) > Number(rightRecord.team_building_value_score) ? leftRecord.player_name : rightRecord.player_name} is the cleaner current roster fit, while ${
            Number(leftRecord.upside_score) > Number(rightRecord.upside_score) ? leftRecord.player_name : rightRecord.player_name
          } brings the higher ceiling.`
      : emptyCopy;

  container.innerHTML = `
    <div class="comparison-header">
      <div>
        <p class="eyebrow">Compare</p>
        <h3>${title}</h3>
      </div>
      <p class="comparison-copy">${comparisonHeadline}</p>
    </div>
    <div class="comparison-layout">
      <div class="comparison-slots">
        ${slotMarkup(leftRecord, type, 0)}
        ${slotMarkup(rightRecord, type, 1)}
        ${comparisonDecisionMarkup(type, leftRecord, rightRecord)}
      </div>
      <div class="comparison-metrics">
        ${metrics
          .map(
            (metric) => `
              <article class="comparison-row">
                <div class="comparison-value">${formatMetric(leftRecord, metric)}</div>
                <div class="comparison-label">
                  <strong>${metric.label}</strong>
                  <span>${metricDelta(leftRecord, rightRecord, metric)}</span>
                </div>
                <div class="comparison-value align-right">${formatMetric(rightRecord, metric)}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
    <div class="explanation-section">
      <div class="comparison-header explanation-section-header">
        <div>
          <p class="eyebrow">Explain</p>
          <h3>${explanationTitle}</h3>
        </div>
        <p class="comparison-copy">These reads translate the existing prior, current-season, playing-time, role, and reliability fields into product language so the score is easier to defend from the board.</p>
      </div>
      <div class="explanation-players">
        ${explanationMarkup(type, leftRecord, 0)}
        ${explanationMarkup(type, rightRecord, 1)}
      </div>
    </div>
  `;
}

export function registerComparisonCallbacks({ onChange }) {
  onComparisonChange = onChange;
}

export function restoreComparison() {
  try {
    const stored = JSON.parse(localStorage.getItem(comparisonStorageKey) || "{}");
    state.comparison.hitters = Array.isArray(stored.hitters)
      ? stored.hitters.filter((playerId) => findRecord("hitter", playerId)).slice(0, 2)
      : [];
    state.comparison.pitchers = Array.isArray(stored.pitchers)
      ? stored.pitchers.filter((playerId) => findRecord("pitcher", playerId)).slice(0, 2)
      : [];
  } catch (_error) {
    state.comparison.hitters = [];
    state.comparison.pitchers = [];
  }
}

export function comparedRecords(type) {
  return valuesForType(type).map((playerId) => findRecord(type, playerId)).filter(Boolean);
}

export function isCompared(type, playerId) {
  return valuesForType(type).some((id) => String(id) === String(playerId));
}

export function canCompare(type, playerId) {
  const records = valuesForType(type);
  return isCompared(type, playerId) || records.length < 2;
}

export function toggleCompare(type, playerId) {
  const stateKey = comparisonConfig[type].stateKey;
  const current = state.comparison[stateKey];

  if (current.some((id) => String(id) === String(playerId))) {
    state.comparison[stateKey] = current.filter((id) => String(id) !== String(playerId));
  } else if (current.length < 2) {
    state.comparison[stateKey] = [...current, playerId];
  } else {
    return;
  }

  saveComparison();
  renderComparison(type);
  onComparisonChange();
}

export function renderComparisons() {
  renderComparison("hitter");
  renderComparison("pitcher");
}
