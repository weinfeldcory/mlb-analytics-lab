export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toFixed(digits);
}

export function formatInteger(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Math.round(Number(value)).toString();
}

export function teamLabel(record) {
  const currentTeam = typeof record.team_2026 === "string" ? record.team_2026.trim() : "";
  const priorTeam = typeof record.team_2025 === "string" ? record.team_2025.trim() : "";

  if (currentTeam && currentTeam !== "- - -") {
    return currentTeam;
  }

  if (priorTeam && priorTeam !== "- - -") {
    return priorTeam;
  }

  return "FA";
}

export function average(records, key) {
  const values = records.map((record) => Number(record[key])).filter((value) => !Number.isNaN(value));
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightedAverage(records, key, weightKey) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const record of records) {
    const value = Number(record[key]);
    const weight = Number(record[weightKey]);

    if (Number.isNaN(value) || Number.isNaN(weight) || weight <= 0) {
      continue;
    }

    weightedSum += value * weight;
    totalWeight += weight;
  }

  return totalWeight ? weightedSum / totalWeight : 0;
}
