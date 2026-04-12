import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readState, updateSeasonConfig, updateWeeklyPicks } from "./store.js";

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

async function serveFile(response, pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
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
      return json(response, 200, await readState());
    }

    if (request.method === "POST" && pathname === "/api/season/config") {
      const body = await readBody(request);
      return json(response, 200, await updateSeasonConfig(body));
    }

    if (request.method === "POST" && pathname === "/api/weekly-picks") {
      const body = await readBody(request);
      return json(response, 200, await updateWeeklyPicks(body));
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
