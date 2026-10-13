import { createApplicationHost } from "../../application/host.js";
import { createDocumentWorkspace } from "./workspace.js";
import { sha256, stable } from "../../engineering/contracts.js";
export const documentScenarios = [
  ["document.approve", "Submit and approve a document"], ["document.changes", "Request changes and resubmit"],
  ["document.duplicate", "Replay document command once"], ["document.stale", "Reject stale review revision"],
  ["document.restore", "Restore a waiting review task"], ["document.denied", "Reject an unauthorized reviewer"],
].map(([id, label]) => ({ id, label, clock: "configurable" }));
export function documentAdapters(getPackage) {
  return [{ id: "document.review", version: "1.0.0", scenarios: documentScenarios, async run({ scenarioId, seed, startAt }) {
    const pkg = getPackage(), id = `doc-${(await sha256(seed)).slice(0, 12)}`, options = { documentId: id, clock: () => startAt };
    let host = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace, options });
    const assertions = [];
    const mutation = (name, type, revision, key) => ({ query: `mutation($input:${type}!){${name}(input:$input,expectedRevision:${revision},idempotencyKey:"${key}"){accepted code revision violations{ruleId message} task{id flowState}}}`, variables: { input: { note: "Reviewed synthetic document evidence." } } });
    try {
      const args = mutation("submitDocument", "SubmitDocumentInput", 0, "submit");
      const first = await host.execute(args); assertions.push({ id: "submit-through-generated-api", passed: first.data?.submitDocument.accepted === true, detail: "Document submission reaches review" });
      if (scenarioId === "document.duplicate") { const retry = await host.execute(args); assertions.push({ id: "idempotent-document-command", passed: stable(retry) === stable(first) && host.workspace.history().length === 1, detail: "Duplicate submission returns one receipt" }); }
      const waiting = host.workspace.export(); host.dispose();
      host = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace, options: { ...options, snapshot: waiting, principal: { role: scenarioId === "document.denied" ? "Author" : "Reviewer" } } });
      assertions.push({ id: "waiting-task-restoration", passed: host.workspace.task().flowState === "review", detail: "A waiting review resumes from a stable actor checkpoint" });
      if (scenarioId === "document.changes") {
        const changes = await host.execute(mutation("requestChanges", "RequestChangesInput", 1, "changes"));
        assertions.push({ id: "request-changes", passed: changes.data?.requestChanges.task.flowState === "changes", detail: "Review requests return the document to its author" });
        const s = host.workspace.export(); host.dispose(); host = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace, options: { ...options, snapshot: s } });
        const resubmitted = await host.execute(mutation("resubmitDocument", "ResubmitDocumentInput", 2, "resubmit"));
        assertions.push({ id: "resubmit", passed: resubmitted.data?.resubmitDocument.task.flowState === "review", detail: "Revised document returns to review" });
        const next = host.workspace.export(); host.dispose(); host = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace, options: { ...options, snapshot: next, principal: { role: "Reviewer" } } });
      }
      const revision = host.workspace.export().revision;
      const review = await host.execute(mutation("reviewDocument", "ReviewDocumentInput", scenarioId === "document.stale" ? 0 : revision, "review"));
      const reject = ["document.stale", "document.denied"].includes(scenarioId);
      assertions.push({ id: "review-outcome", passed: review.data?.reviewDocument.accepted === !reject, detail: review.data?.reviewDocument.code ?? "GraphQL error" });
      assertions.push({ id: "prohibited-effects", passed: host.workspace.export().revision === revision + (reject ? 0 : 1), detail: "Rejected review commands commit no effects" });
      return { assertions, output: { documents: host.workspace.documents(), tasks: host.workspace.tasks(), snapshot: host.workspace.export() }, trace: host.workspace.history(), unsupported: pkg.capabilities.unsupported };
    } finally { host.dispose(); }
  } }];
}
