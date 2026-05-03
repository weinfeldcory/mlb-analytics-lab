export function normalizeDisplayNameToUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]+/g, "")
    .replace(/[\s_-]+/g, "");

  return normalized || "fan";
}

export function buildUsernamePreview(displayName: string) {
  return `@${normalizeDisplayNameToUsername(displayName)}`;
}
