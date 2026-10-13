import { clone, stable, validate, validateEnvelope, VERSION } from "./contracts.js";
export function createBroker({ identity, journal = [], maxCalls = 80, now = () => Date.now() }) {
  const providers = new Map(), receipts = new Map();
  let calls = 0, queue = Promise.resolve();
  function register(descriptor, execute) {
    if (!/^[a-z][a-z0-9_.]*$/.test(descriptor.id) || providers.has(descriptor.id) || typeof execute !== "function") throw Error("Invalid or duplicate capability");
    if (!descriptor.inputSchema || !descriptor.outputSchema || !["read", "candidate-write"].includes(descriptor.effect)) throw Error("Invalid capability contract");
    providers.set(descriptor.id, { descriptor: clone({ contractVersion: VERSION, implementationVersion: VERSION, timeoutMs: 15000, maxInputBytes: 100000, maxOutputBytes: 1000000, ...descriptor }), execute });
  }
  function catalog(grant) {
    return [...providers.values()].map(v => v.descriptor).filter(d => !grant || grant.capabilities.includes(d.id)).map(clone);
  }
  async function executeCall(id, args, host) {
    const provider = providers.get(id);
    if (!provider) throw Error(`Unknown capability ${id}`);
    if (!host.grant?.capabilities.includes(id)) throw Error(`Capability not granted: ${id}`);
    if (host.signal?.aborted) throw Error("Cancelled");
    if (!host.invocationId || host.invocationId.length > 200) throw Error("Invocation identity required");
    const d = provider.descriptor, before = clone(identity());
    const key = `${host.grant.taskId}:${host.invocationId}`;
    const signature = stable({ id, args, grant: host.grant });
    if (receipts.has(key)) {
      if (receipts.get(key).signature !== signature) throw Error("Invocation reused with different inputs or grant");
      return clone(receipts.get(key).result);
    }
    validate(d.inputSchema, args);
    if (new TextEncoder().encode(stable(args)).length > d.maxInputBytes) throw Error("Input budget exceeded");
    if (++calls > maxCalls) throw Error("Tool budget exhausted");
    const entry = { id: key, capability: id, signature, identity: before, state: "running", startedAt: now() };
    journal.push(entry);
    // Host cancellation reaches trusted providers. Writes are never raced against a timeout
    // because doing so would release the serial queue while an effect is still running.
    const controller = new AbortController();
    const cancel = () => controller.abort();
    host.signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(cancel, d.timeoutMs);
    try {
      const data = await provider.execute(clone(args), { ...host, signal: controller.signal, identity: before });
      validate(d.outputSchema, data, "output");
      if (new TextEncoder().encode(stable(data)).length > d.maxOutputBytes) throw Error("Output budget exceeded");
      const current = identity();
      if (d.effect === "read" && stable(current) !== stable(before)) throw Error("Source changed during read");
      const result = validateEnvelope({ status: "ok", ...current, data, evidenceRefs: data.evidenceRefs ?? [], unsupported: data.unsupported ?? [], truncated: false, continuation: null }, current);
      entry.state = "completed"; entry.completedAt = now(); entry.result = clone(result);
      receipts.set(key, { signature, result: clone(result) });
      return result;
    } catch (e) {
      entry.state = "failed"; entry.error = e.message;
      throw e;
    } finally { clearTimeout(timer); host.signal?.removeEventListener("abort", cancel); }
  }
  return {
    register, catalog,
    invoke(id, args, host) {
      // Serialize all calls, including reads following writes, for stable snapshots.
      const run = queue.then(() => executeCall(id, clone(args), host));
      queue = run.catch(() => {}); return run;
    },
    tools(grant) { return catalog(grant).sort((a,b) => a.id.localeCompare(b.id)).map(d => ({ type: "function", name: d.id.replaceAll(".", "_"), description: d.description, strict: true, parameters: d.inputSchema })); },
    restore(entries) {
      for (const e of entries) {
        if (e.state === "running") throw Error("Unreconciled interrupted invocation");
        if (e.state === "completed") receipts.set(e.id, { signature: e.signature, result: clone(e.result) });
      }
    },
  };
}
