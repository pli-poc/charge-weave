import { useEffect, useRef, useState } from "react";
import { createApplicationHost } from "../../client-runtime/src/application/host.js";
import { createDocumentWorkspace } from "../../client-runtime/src/profiles/document-review/workspace.js";
import { createCheckpointStore } from "../../client-runtime/src/adapters/browser/checkpoints.js";
export default function DocumentReviewPreview({ applicationPackage: pkg }) {
  const host = useRef(null), revision = useRef(0);
  const [role, setRole] = useState("Author"), [tasks, setTasks] = useState([]), [current, setCurrent] = useState(null), [values, setValues] = useState({}), [message, setMessage] = useState("Synthetic document ready for submission"), [busy, setBusy] = useState(false);
  const store = () => createCheckpointStore({ indexedDB: globalThis.indexedDB, crypto: globalThis.crypto, database: "syntriq-document-preview-v1" });
  function open(snapshot, principal = role) {
    host.current?.dispose();
    host.current = createApplicationHost({ applicationPackage: pkg, factory: createDocumentWorkspace, options: { snapshot, principal: { role: principal } } });
    const list = host.current.workspace.tasks(); setTasks(list); setCurrent(host.current.workspace.task()); setValues({});
  }
  useEffect(() => { open(); return () => host.current?.dispose(); }, [pkg.digest]);
  async function submit(t) {
    setBusy(true);
    try {
      const cmd = pkg.commands.commands.find(c => c.id === t.descriptor.command);
      const result = await host.current.execute({ query: `mutation($input:${cmd.inputType}!,$revision:Int!,$key:String!){${cmd.id}(input:$input,expectedRevision:$revision,idempotencyKey:$key){accepted code violations{message} task{flowState}}}`, variables: { input: values, revision: current.revision, key: globalThis.crypto.randomUUID() } });
      if (result.errors) throw Error(result.errors.map(e => e.message).join("; "));
      const outcome = result.data[cmd.id]; setMessage(outcome.accepted ? `Document ${outcome.task.flowState}` : `${outcome.code}: ${outcome.violations.map(v => v.message).join("; ")}`);
      setTasks(host.current.workspace.tasks()); setCurrent(host.current.workspace.task());
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  return <div className="eng-card" style={{ marginTop: 24 }}><p className="eyebrow">Second application · Generated task forms</p><h3>Document review</h3><p>Submit a proposal, request changes, resubmit and approve using the same generated API, workflow and checkpoint contracts.</p><label>Simulated document role<select aria-label="Simulated document role" value={role} onChange={e => { const snapshot = host.current.workspace.export(); setRole(e.target.value); open(snapshot, e.target.value); }}><option>Author</option><option>Reviewer</option></select></label><p role="status">{message} · revision {current?.revision ?? 0}</p>{current?.flowState !== "approved" && tasks.filter(t => (t.descriptor.activeStep ?? t.id) === current?.flowState).map(t => <div key={t.id}><h4>{t.descriptor.title}</h4>{t.descriptor.form.fields.map(f => <label key={f.id}>{f.label}<textarea value={values[f.id] ?? ""} maxLength={f.maxLength} onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}/></label>)}<button className="eng-button" disabled={busy} onClick={() => submit(t)}>{t.descriptor.title}</button></div>)}<div className="eng-actions" style={{ marginTop: 20 }}><button className="eng-button" disabled={busy} onClick={async () => { try { const saved = await store().save("preview", host.current.workspace.export(), pkg, revision.current); revision.current = saved.storageRevision; setMessage("Document checkpoint saved"); } catch (e) { setMessage(e.message); } }}>Save document checkpoint</button><button className="eng-button" disabled={busy} onClick={async () => { try { const saved = await store().load("preview", pkg); if (!saved) throw Error("No document checkpoint saved"); revision.current = saved.storageRevision; open(saved.payload); setMessage("Document checkpoint restored"); } catch (e) { setMessage(e.message); } }}>Restore document checkpoint</button></div></div>;
}
