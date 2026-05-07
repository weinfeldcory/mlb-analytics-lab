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

export function suggestUniqueUsername(displayName: string, existingUsernames: string[]) {
  const baseUsername = normalizeDisplayNameToUsername(displayName);
  const takenUsernames = new Set(existingUsernames.map((username) => username.trim().toLowerCase()).filter(Boolean));

  if (!takenUsernames.has(baseUsername)) {
    return baseUsername;
  }

  let suffix = 1;
  while (takenUsernames.has(`${baseUsername}${suffix}`)) {
    suffix += 1;
  }

  return `${baseUsername}${suffix}`;
}

export function buildUsernamePreview(displayName: string) {
  return `@${normalizeDisplayNameToUsername(displayName)}`;
}
