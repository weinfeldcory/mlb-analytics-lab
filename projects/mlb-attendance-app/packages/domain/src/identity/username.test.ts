import assert from "node:assert/strict";
import test from "node:test";
import { buildUsernamePreview, normalizeDisplayNameToUsername, suggestUniqueUsername } from "./username";

test("normalizeDisplayNameToUsername trims, lowercases, strips punctuation, and removes spaces", () => {
  assert.equal(normalizeDisplayNameToUsername("  Cory Weinfeld  "), "coryweinfeld");
});

test("normalizeDisplayNameToUsername removes accents and falls back to fan when nothing remains", () => {
  assert.equal(normalizeDisplayNameToUsername("Élodie Núñez"), "elodienunez");
  assert.equal(normalizeDisplayNameToUsername("!!!"), "fan");
});

test("suggestUniqueUsername appends the next numeric suffix when duplicates exist", () => {
  assert.equal(
    suggestUniqueUsername("Cory Weinfeld", ["coryweinfeld", "coryweinfeld1", "coryweinfeld2"]),
    "coryweinfeld3"
  );
});

test("suggestUniqueUsername is case-insensitive when checking taken usernames", () => {
  assert.equal(
    suggestUniqueUsername("Cory Weinfeld", ["CORYWEINFELD", "coryweinfeld1"]),
    "coryweinfeld2"
  );
});

test("buildUsernamePreview prefixes the normalized username", () => {
  assert.equal(buildUsernamePreview("Cory Weinfeld"), "@coryweinfeld");
});
