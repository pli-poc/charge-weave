import { createWorkspace } from "./workspace.js";
export function createChargeweaveHostWorkspace(options) {
  const workspace = createWorkspace(options);
  return { ...workspace, submitCorrection: workspace.submit, sites: () => [], sessions: () => [] };
}
