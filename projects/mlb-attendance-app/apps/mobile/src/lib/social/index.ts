import { appDataStore } from "../persistence";
import { hostedSocialGraphService } from "./hostedSocialGraphService";
import { localSocialGraphService } from "./localSocialGraphService";

export const socialGraphService = appDataStore.kind === "hosted"
  ? hostedSocialGraphService
  : localSocialGraphService;
