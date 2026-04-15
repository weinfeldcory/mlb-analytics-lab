import { hitterSlotDefinitions, pitcherSlotDefinitions } from "./config.js";

export const state = {
  hitters: [],
  pitchers: [],
  filteredHitters: [],
  filteredPitchers: [],
  roster: {
    hitters: hitterSlotDefinitions.map((slot) => ({ ...slot, playerId: null })),
    pitchers: pitcherSlotDefinitions.map((slot) => ({ ...slot, playerId: null })),
  },
};
