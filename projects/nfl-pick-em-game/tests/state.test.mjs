import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "busy-picks-test-"));
process.env.BUSY_PICKS_DATA_DIR = path.join(tempDir, "data");

const {
  launchSeason,
  readState,
  updateAvailableLines,
  updateRecentResults,
  updateSeasonConfig,
  updateWeeklyOutcome,
  updateWeeklyPicks
} = await import("../server/store.js");

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

await assert.rejects(
  () => updateSeasonConfig({
    season: 2026,
    currentWeek: 1,
    owners: ["Solo"],
    notes: ""
  }),
  /between 2 and 10/
);

await assert.rejects(
  () => launchSeason({
    title: "Too Many",
    season: 2027,
    currentWeek: 1,
    totalWeeks: 5,
    owners: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
    notes: ""
  }),
  /between 2 and 10/
);

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

const linesUpdated = await updateAvailableLines({
  week: 2,
  games: [
    { day: "Sunday", awayTeam: "Bills", homeTeam: "Jets", line: "BUF -3.5", total: "45.5" },
    { day: "Monday", awayTeam: "Lions", homeTeam: "Packers", line: "DET -1.5", total: "49.5" }
  ]
});

assert.equal(linesUpdated.availableLines.week, 2);
assert.equal(linesUpdated.availableLines.games.length, 2);
assert.equal(linesUpdated.availableLines.games[1].homeTeam, "Packers");

const resultsUpdated = await updateRecentResults({
  week: 2,
  results: [
    {
      date: "Sun 9/14/2027",
      away: "Bills",
      home: "Jets",
      score: "BUF 27 NYJ 20",
      odds: "BUF -3.5",
      coveredBy: "BUF -3.5",
      totalPoints: 47,
      totalLine: 45.5,
      winner: "Bills"
    }
  ]
});

assert.ok(resultsUpdated.recentResults.some((result) => result.week === "Week 2" && result.winner === "Bills"));

const launched = await launchSeason({
  title: "Busy Picks Reloaded",
  season: 2027,
  currentWeek: 1,
  totalWeeks: 5,
  owners: ["Cory", "Jeremy", "Taylor", "Alex"],
  notes: "Fresh season"
});

assert.equal(launched.title, "Busy Picks Reloaded");
assert.equal(launched.season, 2027);
assert.equal(launched.currentWeek, 1);
assert.equal(launched.weeklyPicks.length, 5);
assert.equal(launched.weeklyPicks[0].status, "Open");
assert.equal(launched.weeklyPicks[4].status, "Upcoming");
assert.equal(launched.availableLines.games.length, 0);
assert.ok(launched.standings.some((row) => row.owner === "Alex"));

const seasonPicks = await updateWeeklyPicks({
  week: 1,
  status: "In Progress",
  potd: {
    Cory: "BUF -2.5",
    Jeremy: "PHI -3",
    Taylor: "DET -4.5",
    Alex: "BUF -2.5"
  },
  overUnder: {
    Cory: { game: "BUF/NYJ", line: "44.5", pick: "O" },
    Jeremy: { game: "DAL/PHI", line: "48.5", pick: "U" },
    Taylor: { game: "DET/GB", line: "51.5", pick: "O" },
    Alex: { game: "BUF/NYJ", line: "44.5", pick: "O" }
  },
  dotd: {
    Cory: { team: "BUF", line: "145" },
    Jeremy: { team: "PHI", line: "-120" },
    Taylor: { team: "DET", line: "160" },
    Alex: { team: "BUF", line: "110" }
  }
});

assert.equal(seasonPicks.standings[0].points, 0);

const autoScored = await updateRecentResults({
  week: 1,
  results: [
    {
      date: "Sun 9/7/2027",
      away: "Bills",
      home: "Jets",
      score: "BUF 31 NYJ 20",
      odds: "BUF -2.5",
      coveredBy: "BUF -2.5",
      totalPoints: 51,
      totalLine: 44.5,
      winner: "Bills"
    },
    {
      date: "Sun 9/7/2027",
      away: "Cowboys",
      home: "Eagles",
      score: "PHI 27 DAL 20",
      odds: "PHI -3",
      coveredBy: "PHI -3",
      totalPoints: 47,
      totalLine: 48.5,
      winner: "Eagles"
    },
    {
      date: "Sun 9/7/2027",
      away: "Lions",
      home: "Packers",
      score: "DET 34 GB 24",
      odds: "DET -4.5",
      coveredBy: "DET -4.5",
      totalPoints: 58,
      totalLine: 51.5,
      winner: "Lions"
    }
  ]
});

assert.equal(autoScored.weeklyScorecards[0].owners.Cory.total, 3.45);
assert.equal(autoScored.weeklyScorecards[0].owners.Jeremy.total, 2.83);
assert.equal(autoScored.weeklyScorecards[0].owners.Taylor.total, 3.6);
assert.equal(autoScored.weeklyScorecards[0].owners.Alex.total, 3.1);
assert.equal(autoScored.standings[0].owner, "Taylor");
assert.equal(autoScored.standings[1].owner, "Cory");
assert.equal(autoScored.standings[2].owner, "Alex");
assert.equal(autoScored.standings[3].owner, "Jeremy");

const scored = await updateWeeklyOutcome({
  week: 1,
  potdWinners: ["BUF -2.5"],
  overUnderResults: [
    {
      game: "BUF/NYJ",
      line: "44.5",
      outcome: "O"
    }
  ],
  dotdWinners: ["BUF", "DET"],
  finalized: true
});

assert.equal(scored.scoring.mode, "app");
assert.equal(scored.scoring.completedWeeks, 1);
assert.equal(scored.weeklyScorecards[0].owners.Cory.total, 3.45);
assert.equal(scored.weeklyScorecards[0].owners.Alex.total, 3.1);
assert.equal(scored.weeklyScorecards[0].owners.Taylor.total, 1.6);
assert.equal(scored.weeklyScorecards[0].owners.Jeremy.total, 0);
assert.equal(scored.standings[0].owner, "Cory");
assert.equal(scored.standings[0].breakdown.dotd, 1.45);
assert.equal(scored.standings[1].owner, "Alex");
assert.equal(scored.standings[2].owner, "Taylor");
assert.equal(scored.standings[3].owner, "Jeremy");

const storePath = path.join(process.env.BUSY_PICKS_DATA_DIR, "season-state.json");
const persisted = JSON.parse(await readFile(storePath, "utf8"));
assert.equal(persisted.notes, "Fresh season");
assert.equal(persisted.owners[3], "Alex");
assert.equal(persisted.weeklyPicks[0].dotd.Alex.team, "BUF");
assert.equal(persisted.weeklyOutcomes[0].potdWinner, "BUF -2.5");
assert.deepEqual(persisted.weeklyOutcomes[0].potdWinners, ["BUF -2.5"]);
assert.equal(persisted.weeklyOutcomes[0].overUnderResults[0].game, "BUF/NYJ");
assert.equal(persisted.recentResults.length, 3);

await rm(tempDir, { recursive: true, force: true });
console.log("state tests passed");
