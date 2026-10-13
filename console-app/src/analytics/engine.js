import profile from "../../../model/analytics-profile.json" with { type: "json" };
import { createAnalyticsEngine } from "../../../client-runtime/src/providers/analytics.js";
export { profile };
export const { createQuery, executeAnalytics } = createAnalyticsEngine(profile);
