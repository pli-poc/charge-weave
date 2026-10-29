import { createWorkspace } from "./workspace.js";
export function createChargeweaveHostWorkspace(options) {
  const workspace = createWorkspace(options);
  return { ...workspace, submitCorrection: workspace.submit, prepareCorrection: workspace.prepare, supplementBillingEvidence: ({ input, ...rest }) => workspace.supplyEvidence({ ...input, ...rest }), decideCorrection: ({ input, ...rest }) => workspace.decide({ ...input, ...rest }), sites: () => [], sessions: () => [] };
}
