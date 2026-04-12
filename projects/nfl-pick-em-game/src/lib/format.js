export function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number(value));
}

export function formatOdds(value) {
  if (!value) return "—";
  return String(value);
}

export function formatDate(value) {
  if (!value) return "—";
  return value;
}
