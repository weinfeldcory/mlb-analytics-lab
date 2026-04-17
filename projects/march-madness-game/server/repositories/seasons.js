import { getDatabase } from "../store.js";

export async function readCurrentSeasonRecord() {
  const db = await getDatabase();
  const currentMeta = db.prepare("SELECT value FROM app_meta WHERE key = 'current_season'").get();

  if (currentMeta) {
    return {
      season: Number(currentMeta.value)
    };
  }

  const row = db.prepare(`
    SELECT season
    FROM seasons
    ORDER BY updated_at DESC, season DESC
    LIMIT 1
  `).get();

  return row
    ? {
      season: Number(row.season)
    }
    : null;
}

export async function listSeasonSummaryRecords() {
  const db = await getDatabase();
  const rows = db.prepare(`
    SELECT season, updated_at, owner_count, total_teams, drafted_teams, completed_games, total_games, draft_locked
    FROM seasons
    ORDER BY season DESC
  `).all();

  return rows.map((row) => ({
    season: Number(row.season),
    updatedAt: row.updated_at,
    ownerCount: Number(row.owner_count || 0),
    totalTeams: Number(row.total_teams || 0),
    draftedTeams: Number(row.drafted_teams || 0),
    completedGames: Number(row.completed_games || 0),
    totalGames: Number(row.total_games || 0),
    draftLocked: Boolean(row.draft_locked)
  }));
}

export async function listSeasonOwners(season) {
  const db = await getDatabase();
  const rows = db.prepare(`
    SELECT owner_name, draft_position
    FROM season_owners
    WHERE season = ?
    ORDER BY draft_position ASC, owner_name ASC
  `).all(Number(season));

  return rows.map((row) => ({
    owner: row.owner_name,
    draftPosition: Number(row.draft_position)
  }));
}
