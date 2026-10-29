import applicationPackage from "../../client-runtime/generated/application.json" with { type: "json" };
import temporalExample from "../../model/temporal-example.json" with { type: "json" };
import { createLocalClient } from "../../client-runtime/src/graphql/client.js";
import { createWorkspace } from "../../client-runtime/src/profiles/chargeweave/workspace.js";
import {
  createCheckpointStore,
  digest,
} from "../../client-runtime/src/adapters/browser/checkpoints.js";
import { selectFixture } from "../../client-runtime/src/providers/temporal.js";
export function createConsoleClient(provider, environment) {
  const store = createCheckpointStore(environment);
  const id = "meter-correction";
  let storageRevision = 0;
  let status = "Unsaved";
  let blockedCheckpoint = null;
  let workspace = createWorkspace({ applicationPackage });
  const client = createLocalClient({
    applicationPackage,
    services: {
      sites: provider.getSites,
      sessions: provider.getLiveSessions,
      task: () => workspace.task(),
      submitCorrection: (args) => workspace.submit(args),
      prepareCorrection: (args) => workspace.prepare(args),
      decideCorrection: ({ input, ...args }) => workspace.decide({ ...input, ...args }),
      analytics: provider.queryAnalytics,
      temporal: ({ validAt, knownAt }) => {
        const r = selectFixture(temporalExample, validAt, knownAt);
        return { ...r, price: r.price == null ? null : String(r.price) };
      },
    },
  });
  async function task() {
    const r = await client.execute({
      query:
        "{ task { id revision status stage values outcome descriptor flowState approvalDueAt records } }",
    });
    if (r.errors) throw Error(r.errors[0].message);
    return r.data.task;
  }
  const report = (error) => {
    status = `Not saved: ${error.message}`;
    throw error;
  };
  return {
    execute: client.execute,
    task,
    status: () => status,
    async restore() {
      try {
        const saved = await store.load(id, applicationPackage);
        if (saved) {
          storageRevision = saved.storageRevision;
          workspace = createWorkspace({
            applicationPackage,
            snapshot: saved.payload,
          });
          status = "Saved workspace restored";
        }
        return task();
      } catch (e) {
        try {
          blockedCheckpoint = await store.raw(id);
          storageRevision = blockedCheckpoint?.storageRevision ?? 0;
        } catch {}
        status = `Memory only — ${e.message}. Export or reset the stored workspace before saving.`;
        return task();
      }
    },
    async prepare(input, expectedRevision, idempotencyKey) {
      const response = await client.execute({ query: "mutation($input:PrepareCorrectionInput!,$revision:Int!,$key:String!){prepareCorrection(input:$input,expectedRevision:$revision,idempotencyKey:$key){accepted code revision violations{ruleId field message} task{id revision status stage values outcome descriptor flowState approvalDueAt records}}}", variables: { input, revision: expectedRevision, key: idempotencyKey } });
      if (response.errors) throw Error(response.errors[0].message);
      const result = response.data.prepareCorrection;
      if (result.accepted) status = "Unsaved changes";
      return result;
    },
    async expireApproval(expectedRevision, idempotencyKey) {
      const result = await workspace.expireApproval({ expectedRevision, idempotencyKey });
      if (result.accepted) status = "Unsaved changes";
      return result;
    },
    async decide(input, expectedRevision, idempotencyKey) {
      const response = await client.execute({ query: "mutation($input:CorrectionDecisionInput!,$revision:Int!,$key:String!){decideCorrection(input:$input,expectedRevision:$revision,idempotencyKey:$key){accepted code revision violations{ruleId field message} task{id revision status stage values outcome descriptor flowState approvalDueAt records}}}", variables: { input, revision: expectedRevision, key: idempotencyKey } });
      if (response.errors) throw Error(response.errors[0].message);
      const result = response.data.decideCorrection;
      if (result.accepted) status = "Unsaved changes";
      return result;
    },
    async submit(input, expectedRevision, idempotencyKey) {
      const r = await client.execute({
        query:
          "mutation Submit($input:CorrectionInput!,$revision:Int!,$key:String!){submitCorrection(input:$input,expectedRevision:$revision,idempotencyKey:$key){accepted code revision violations{ruleId field message} task{id revision status stage values outcome descriptor flowState approvalDueAt records}}}",
        variables: { input, revision: expectedRevision, key: idempotencyKey },
      });
      if (r.errors) throw Error(r.errors[0].message);
      if (r.data.submitCorrection.accepted) status = "Unsaved changes";
      return r.data.submitCorrection;
    },
    async save() {
      try {
        if (blockedCheckpoint)
          throw Error("Export and reset the incompatible checkpoint first");
        const saved = await store.save(
          id,
          workspace.export(),
          applicationPackage,
          storageRevision,
        );
        storageRevision = saved.storageRevision;
        status = "Saved on this device";
      } catch (e) {
        report(e);
      }
    },
    async reset() {
      try {
        await store.remove(id, storageRevision);
        storageRevision = 0;
        blockedCheckpoint = null;
        workspace = createWorkspace({ applicationPackage });
        status = "Unsaved";
        return task();
      } catch (e) {
        report(e);
      }
    },
    async export() {
      if (blockedCheckpoint) return JSON.stringify(blockedCheckpoint, null, 2);
      return JSON.stringify(
        {
          format: 1,
          packageDigest: applicationPackage.digest,
          package: applicationPackage,
          payload: workspace.export(),
          storageRevision: storageRevision || 1,
          checksum: await digest(workspace.export(), environment.crypto),
        },
        null,
        2,
      );
    },
    async import(text) {
      const parsed = JSON.parse(text);
      await store.verify(parsed, applicationPackage);
      workspace = createWorkspace({
        applicationPackage,
        snapshot: parsed.payload,
      });
      status = "Imported — unsaved";
      return task();
    },
  };
}
