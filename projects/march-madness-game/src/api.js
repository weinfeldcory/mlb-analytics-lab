export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload;
}

export function currentSeasonFromLocation() {
  const url = new URL(window.location.href);
  const season = url.searchParams.get("season");
  return season ? Number(season) : null;
}

export function updateSeasonRoute(season) {
  const url = new URL(window.location.href);
  if (season) {
    url.searchParams.set("season", String(season));
  } else {
    url.searchParams.delete("season");
  }
  window.location.assign(`${url.pathname}${url.search}`);
}

function withSeason(url, season) {
  if (!season) return url;
  const requestUrl = new URL(url, window.location.origin);
  requestUrl.searchParams.set("season", String(season));
  return `${requestUrl.pathname}${requestUrl.search}`;
}

function withSeasonPayload(payload = {}, season) {
  return season ? { ...payload, season } : payload;
}

export function loadAppState(season) {
  return fetchJson(withSeason("/api/state", season));
}

export function assignDraftTeam(teamName, owner, season) {
  return fetchJson("/api/draft/assign", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload({ teamName, owner }, season))
  });
}

export function makeDraftPick(teamName, season) {
  return fetchJson("/api/draft/pick", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload({ teamName }, season))
  });
}

export function unassignDraftTeam(teamName, season) {
  return fetchJson("/api/draft/unassign", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload({ teamName }, season))
  });
}

export function resetDraft(mode, season) {
  return fetchJson("/api/draft/reset", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload({ mode }, season))
  });
}

export function undoDraftPick(season) {
  return fetchJson("/api/draft/undo", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload({}, season))
  });
}

export function updateDraftSettings(payload, season) {
  return fetchJson("/api/draft/settings", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload(payload, season))
  });
}

export function updateSeasonConfig(payload, season) {
  return fetchJson("/api/season/config", {
    method: "POST",
    body: JSON.stringify(withSeasonPayload(payload, season))
  });
}
