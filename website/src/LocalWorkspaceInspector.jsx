import { useEffect, useState } from "react";
import pkg from "../../client-runtime/generated/application.json";
import { createCheckpointStore } from "../../client-runtime/src/adapters/browser/checkpoints.js";
import { createWorkspace } from "../../client-runtime/src/profiles/chargeweave/workspace.js";
export default function LocalWorkspaceInspector() {
  const [state, setState] = useState({ message: "Reading local checkpoint…" });
  async function refresh() {
    try {
      const store = createCheckpointStore({
        indexedDB: globalThis.indexedDB,
        crypto: globalThis.crypto,
      });
      const saved = await store.load("meter-correction", pkg);
      if (!saved) {
        setState({
          message:
            "No saved correction workspace. Complete or save the task in the operations console first.",
        });
        return;
      }
      const workspace = createWorkspace({
        applicationPackage: pkg,
        snapshot: saved.payload,
      });
      setState({
        message:
          "The saved operator workspace, restored through its pinned workflow definition.",
        task: workspace.task(),
        history: workspace.history(),
        storageRevision: saved.storageRevision,
      });
    } catch (e) {
      setState({ message: e.message });
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  return (
    <section className="container dev-section">
      <h2>Saved client execution</h2>
      <p>
        This inspector reads the same local checkpoint as My work. It does not
        start a separate demonstration or change business state.
      </p>
      <p role="status">{state.message}</p>
      <p>
        <button type="button" onClick={refresh}>
          Refresh checkpoint
        </button>{" "}
        <a href={`${import.meta.env.BASE_URL}app/#work`}>Open My work</a>
      </p>
      {state.task && (
        <>
          <dl>
            <dt>Workflow state</dt>
            <dd data-testid="saved-flow-state">{state.task.flowState}</dd>
            <dt>Task revision</dt>
            <dd>{state.task.revision}</dd>
            <dt>Checkpoint revision</dt>
            <dd>{state.storageRevision}</dd>
            <dt>Application package</dt>
            <dd style={{ overflowWrap: "anywhere" }}>{pkg.digest}</dd>
          </dl>
          <details>
            <summary>Accepted decisions and calculation evidence</summary>
            <pre style={{ overflow: "auto", maxHeight: 480 }}>
              {JSON.stringify(state.history, null, 2)}
            </pre>
          </details>
        </>
      )}
      <h3>Executable browser profile</h3>
      <p>
        Supported command checks: {pkg.capabilities.rules.join(", ")}. Full
        SHACL remains the reference verification pipeline. Financial dashboard
        calculations retain the existing analytical representation; the
        correction command uses fixed-point decimal arithmetic.
      </p>
    </section>
  );
}
