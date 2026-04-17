import { hitterSlotDefinitions, pitcherSlotDefinitions } from "./config.js";

export const state = {
  hitters: [],
  pitchers: [],
  filteredHitters: [],
  filteredPitchers: [],
  comparison: {
    hitters: [],
    pitchers: [],
  },
  roster: {
    hitters: hitterSlotDefinitions.map((slot) => ({ ...slot, playerId: null })),
    pitchers: pitcherSlotDefinitions.map((slot) => ({ ...slot, playerId: null })),
  },
};
