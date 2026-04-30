import type { AppDataStore } from "./appDataStore";
import { hostedAppDataStore } from "./hostedAppDataStore";
import { localAppDataStore } from "./localAppDataStore";
import { getHostedBackendMode } from "./supabaseClient";

export const appDataStore: AppDataStore =
  getHostedBackendMode() ? hostedAppDataStore : localAppDataStore;
