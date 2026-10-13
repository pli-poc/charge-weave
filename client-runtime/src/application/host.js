import { createLocalClient } from "../graphql/client.js";
// The host owns registration. Application data never resolves arbitrary imports or evals code.
export function createApplicationHost({ applicationPackage, factory, options = {} }) {
  if (typeof factory !== "function") throw Error("Registered application factory required");
  const workspace = factory({ applicationPackage, ...options });
  const services = Object.fromEntries([
    ...applicationPackage.api.operations.map(o => o.handler),
    ...applicationPackage.commands.commands.map(c => c.handler),
    "task", ...(applicationPackage.tasks ? ["tasks"] : []),
  ].map(id => {
    if (typeof workspace[id] !== "function") throw Error(`Unregistered application handler ${id}`);
    return [id, workspace[id]];
  }));
  const client = createLocalClient({ applicationPackage, services });
  return { execute: client.execute, workspace, descriptors: () => structuredClone(applicationPackage.tasks ?? [applicationPackage.task.task]), dispose: () => workspace.dispose?.() };
}
