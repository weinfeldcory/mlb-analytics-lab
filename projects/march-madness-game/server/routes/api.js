import {
  assignTeam,
  draftPick,
  resetDraft,
  unassignTeam,
  undoDraftPick,
  updateDraftSettings
} from "../services/draft.js";
import { buildAppStateResponse, loadAppStateResponse } from "../services/app-state.js";
import { updateSeasonConfig } from "../services/seasons.js";

const API_ROUTES = new Map([
  ["GET /api/health", async () => ({ ok: true })],
  ["GET /api/state", async ({ querySeason }) => loadAppStateResponse(querySeason)],
  ["POST /api/draft/assign", async ({ body }) => {
    const state = await assignTeam(body.teamName, body.owner, body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/draft/pick", async ({ body }) => {
    const state = await draftPick(body.teamName, body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/draft/unassign", async ({ body }) => {
    const state = await unassignTeam(body.teamName, body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/draft/reset", async ({ body }) => {
    const state = await resetDraft(body.mode, body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/draft/undo", async ({ body }) => {
    const state = await undoDraftPick(body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/draft/settings", async ({ body }) => {
    const state = await updateDraftSettings(body, body.season);
    return buildAppStateResponse(state);
  }],
  ["POST /api/season/config", async ({ body }) => {
    const state = await updateSeasonConfig(body, body.season);
    return buildAppStateResponse(state);
  }]
]);

export function matchApiRoute(method, pathname) {
  return API_ROUTES.get(`${method} ${pathname}`) || null;
}

export async function handleApiRoute({ method, pathname, querySeason, body }) {
  const route = matchApiRoute(method, pathname);

  if (!route) {
    return null;
  }

  return route({ querySeason, body });
}
