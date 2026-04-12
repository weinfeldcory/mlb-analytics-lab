import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "busy-picks-test-"));
process.env.BUSY_PICKS_DATA_DIR = path.join(tempDir, "data");

const { readState, updateSeasonConfig, updateWeeklyPicks } = await import("../server/store.js");

const initial = await readState();
assert.equal(initial.title, "Busy Picks");
assert.equal(initial.standings.length, 5);
assert.equal(initial.availableLines.week, 18);
assert.equal(initial.weeklyPicks.length, 17);

const updated = await updateSeasonConfig({
  season: 2026,
  currentWeek: 1,
  owners: ["Cory", "Jeremy", "Taylor"],
  notes: "Testing"
});

assert.equal(updated.season, 2026);
assert.equal(updated.currentWeek, 1);
assert.deepEqual(updated.owners, ["Cory", "Jeremy", "Taylor"]);
assert.ok(updated.standings.some((row) => row.owner === "Taylor"));

const picksUpdated = await updateWeeklyPicks({
  week: 1,
  status: "In Progress",
  potd: {
    Cory: "BUF -2.5",
    Jeremy: "PHI -3",
    Taylor: "DET -4.5"
  },
  overUnder: {
    Cory: { game: "BUF/NYJ", line: "44.5", pick: "O" },
    Jeremy: { game: "DAL/PHI", line: "48.5", pick: "U" },
    Taylor: { game: "DET/GB", line: "51.5", pick: "O" }
  },
  dotd: {
    Cory: { team: "BUF", line: "145" },
    Jeremy: { team: "PHI", line: "120" },
    Taylor: { team: "DET", line: "160" }
  }
});

assert.equal(picksUpdated.currentWeek, 1);
assert.equal(picksUpdated.weeklyPicks[0].status, "In Progress");
assert.equal(picksUpdated.weeklyPicks[0].potd.Taylor, "DET -4.5");
assert.equal(picksUpdated.weeklyPicks[0].overUnder.Taylor.pick, "O");

const storePath = path.join(process.env.BUSY_PICKS_DATA_DIR, "season-state.json");
const persisted = JSON.parse(await readFile(storePath, "utf8"));
assert.equal(persisted.notes, "Testing");
assert.equal(persisted.weeklyPicks[0].dotd.Taylor.team, "DET");

await rm(tempDir, { recursive: true, force: true });
console.log("state tests passed");
