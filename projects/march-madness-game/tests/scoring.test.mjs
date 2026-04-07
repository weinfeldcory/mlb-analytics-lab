import assert from "node:assert/strict";
import { games, teams } from "../src/data.js";
import { expectedStandings, standings, trueMaxStandings } from "../src/scoring.js";

const current = standings(teams, games);
assert.deepEqual(current, [
  { owner: "Cory", points: 83 },
  { owner: "Berkman", points: 61 },
  { owner: "Shuster", points: 32 },
  { owner: "Seiden", points: 19 }
]);

const max = trueMaxStandings(teams, games);
assert.deepEqual(max, [
  { owner: "Cory", max: 106 },
  { owner: "Berkman", max: 61 },
  { owner: "Shuster", max: 32 },
  { owner: "Seiden", max: 19 }
]);

const expected = expectedStandings(teams, games);
const cory = expected.find((row) => row.owner === "Cory");
assert.equal(Math.round(cory.expected * 10) / 10, 103.5);

console.log("scoring tests passed");
