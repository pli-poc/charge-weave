import { createFlowRuntime } from "../../flow/engine.js";
import { validateFields } from "../../services/validation.js";
import { clone, stable } from "../../engineering/contracts.js";
export function createDocumentWorkspace({ applicationPackage: pkg, principal = { role: "Author" }, documentId = "document-001", clock = () => "2026-10-13T08:00:00.000Z", snapshot }) {
  const transitions = { submitDocument: ["draft", "submit"], reviewDocument: ["review", "approve"], requestChanges: ["review", "requestChanges"], resubmitDocument: ["changes", "resubmit"] };
  let state = snapshot ? clone(snapshot) : { revision: 0, history: [], receipts: {}, actor: null, document: { id: documentId, title: "Synthetic design proposal", status: "draft" } };
  if (!Number.isSafeInteger(state.revision) || state.revision < 0 || state.history?.length !== state.revision || !state.receipts || !["draft", "review", "changes", "approved"].includes(state.document?.status)) throw Error("Invalid document checkpoint");
  // Recompute the state from declared commands, rather than trusting an editable snapshot.
  let expected = "draft";
  for (const [i, record] of state.history.entries()) {
    const pair = transitions[record.command];
    if (!pair || pair[0] !== expected || record.revision !== i + 1 || record.documentId !== state.document.id) throw Error("Incoherent document history");
    const task = pkg.tasks.find(t => t.command === record.command);
    if (validateFields(task.form.fields, record.input).length) throw Error("Invalid retained document command");
    expected = { submitDocument: "review", reviewDocument: "approved", requestChanges: "changes", resubmitDocument: "review" }[record.command];
  }
  if (state.document.status !== expected || state.revision > 0 && !state.actor || (state.actor && state.actor.value !== expected)) throw Error("Incoherent document/process checkpoint");
  const actor = createFlowRuntime().createActor(pkg.flow, state.actor ? { snapshot: state.actor } : {}); actor.start();
  if (actor.getSnapshot().value !== expected) { actor.stop(); throw Error("Incompatible workflow checkpoint"); }
  const task = ({ id } = {}) => {
    if (id && !pkg.tasks.some(t => t.id === id)) throw Error("Unknown task identity");
    const descriptor = pkg.tasks.find(t => t.id === id) ?? pkg.tasks.find(t => (t.activeStep ?? t.id) === state.document.status) ?? pkg.tasks[1];
    return { id: descriptor.id, revision: state.revision, status: state.document.status === "approved" ? "completed" : (descriptor.activeStep ?? descriptor.id) === state.document.status ? "open" : "inactive", stage: state.document.status, descriptor: clone(descriptor), values: {}, outcome: state.document.status === "approved" ? { approved: true } : null, flowState: actor.getSnapshot().value };
  };
  let queue = Promise.resolve(), pending = 0;
  async function execute(commandId, args) {
    const command = pkg.commands.commands.find(c => c.id === commandId), descriptor = pkg.tasks.find(t => t.command === commandId);
    if (!command || !descriptor) throw Error("Unsupported document command");
    const result = (accepted, code, violations = []) => ({ accepted, code, revision: state.revision, violations, task: task({ id: descriptor.id }) });
    if (principal.role !== command.role) return result(false, "FORBIDDEN");
    if (typeof args.idempotencyKey !== "string" || !args.idempotencyKey.trim() || args.idempotencyKey.length > 120) return result(false, "INVALID_KEY");
    const signature = stable({ commandId, ...args });
    if (state.receipts[args.idempotencyKey]) return state.receipts[args.idempotencyKey].signature === signature ? clone(state.receipts[args.idempotencyKey].result) : result(false, "KEY_REUSED");
    const violations = validateFields(descriptor.form.fields, args.input).map(v => ({ ...v, ruleId: "task-fields" }));
    if (args.expectedRevision !== state.revision) violations.push({ ruleId: "expected-revision", message: "Stale document revision" });
    if (transitions[commandId][0] !== state.document.status) violations.push({ ruleId: "task-scope", message: "Command is not active at this stage" });
    for (const rule of command.requiredRules) if (!pkg.capabilities.rules.includes(rule) || !["task-fields", "task-scope", "expected-revision"].includes(rule)) violations.push({ ruleId: rule, message: "Required evaluator unavailable" });
    if (violations.length) return result(false, "REJECTED", violations);
    actor.send({ type: transitions[commandId][1] });
    const next = actor.getSnapshot(); if (next.status === "error") throw next.error;
    state.revision++; state.document.status = next.value; state.actor = actor.getPersistedSnapshot();
    state.history.push({ revision: state.revision, command: commandId, input: clone(args.input), at: clock(), documentId: state.document.id });
    const accepted = result(true, "ACCEPTED"); state.receipts[args.idempotencyKey] = { signature, result: clone(accepted) }; return accepted;
  }
  const submit = (id, args) => {
    const pinned = clone(args); pending++;
    const result = queue.then(() => execute(id, pinned)).finally(() => pending--); queue = result.catch(() => {}); return result;
  };
  return {
    task, tasks: () => pkg.tasks.map(t => task({ id: t.id })), documents: () => [clone(state.document)],
    submitDocument: args => submit("submitDocument", args), reviewDocument: args => submit("reviewDocument", args), requestChanges: args => submit("requestChanges", args), resubmitDocument: args => submit("resubmitDocument", args),
    export() { if (pending) throw Error("Unsettled document command"); return clone(state); }, history: () => clone(state.history), dispose: () => actor.stop(),
  };
}
