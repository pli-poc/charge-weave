import {
  DEMO_SOURCE,
  dataEntities,
  financialLines,
  liveSessions,
  ownSites,
  recentActivity,
  roamingSessions,
} from "./data.js";

/**
 * Application-facing data boundary. The UI consumes this contract, not a
 * protocol client or storage implementation. A real adapter can be registered
 * here later without changing the independent console package or its views.
 */
export function createPlatformProvider({ mode = "synthetic" } = {}) {
  if (mode !== "synthetic") {
    throw new Error(`No ${mode} provider is registered in this prototype.`);
  }

  return Object.freeze({
    source: DEMO_SOURCE,
    getSites: () => ownSites,
    getLiveSessions: () => liveSessions,
    getRoamingSessions: () => roamingSessions,
    getActivity: () => recentActivity,
    getEntities: () => dataEntities,
    getFinanceLines: () => financialLines,
  });
}
