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

export function loadAppState() {
  return fetchJson("/api/state");
}

export function updateSeasonConfig(payload) {
  return fetchJson("/api/season/config", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateWeeklyPicks(payload) {
  return fetchJson("/api/weekly-picks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
