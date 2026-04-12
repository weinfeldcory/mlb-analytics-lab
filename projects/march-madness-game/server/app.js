import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assignTeam,
  draftPick,
  resetDraft,
  unassignTeam,
  undoDraftPick,
  updateDraftSettings
} from "./services/draft.js";
import { loadSeasonState, updateSeasonConfig } from "./services/seasons.js";
import { summarizeState } from "./services/standings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  json(response, 404, { error: "Not found" });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveFile(response, urlPathname) {
  const normalizedPath = urlPathname === "/" ? "/index.html" : urlPathname;
  const filePath = path.join(ROOT_DIR, normalizedPath);
  const extension = path.extname(filePath);

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });
    response.end(file);
  } catch {
    notFound(response);
  }
}

async function handleApi(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/health") {
      return json(response, 200, { ok: true });
    }

    if (request.method === "GET" && pathname === "/api/state") {
      const state = await loadSeasonState();
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/assign") {
      const body = await readBody(request);
      const state = await assignTeam(body.teamName, body.owner);
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/pick") {
      const body = await readBody(request);
      const state = await draftPick(body.teamName);
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/unassign") {
      const body = await readBody(request);
      const state = await unassignTeam(body.teamName);
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/reset") {
      const body = await readBody(request);
      const state = await resetDraft(body.mode);
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/undo") {
      const state = await undoDraftPick();
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/draft/settings") {
      const body = await readBody(request);
      const state = await updateDraftSettings(body);
      return json(response, 200, summarizeState(state));
    }

    if (request.method === "POST" && pathname === "/api/season/config") {
      const body = await readBody(request);
      const state = await updateSeasonConfig(body);
      return json(response, 200, summarizeState(state));
    }

    return notFound(response);
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
}

export function createAppServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, response, url.pathname);
    }

    return serveFile(response, url.pathname);
  });
}
