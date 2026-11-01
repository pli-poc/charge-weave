import React, { useEffect, useRef, useState } from 'react';
import './modelling-studio.css';

// Stateless MCP Streamable HTTP requests; the token stays in component memory.
async function call(endpoint, token, method, params, signal) {
  const response = await fetch(`${endpoint}/mcp`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}`, 'MCP-Protocol-Version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  });
  if (!response.ok) throw new Error(`Service returned ${response.status}`);
  const message = await response.json();
  if (message.error) throw new Error(message.error.message);
  if (message.result?.isError) throw new Error(message.result.content?.[0]?.text || 'Tool failed');
  return message.result;
}

function NeighbourhoodDiagram({ graph }) {
  const height = Math.max(110, graph.edges.length * 60 + 30);
  return <svg className="studio-diagram" viewBox={`0 0 600 ${height}`} role="img" aria-label={`Relationships for ${graph.root}`}>
    <rect x="10" y="30" width="170" height="40" rx="6" />
    <text x="95" y="55" textAnchor="middle">{graph.root}</text>
    {graph.edges.map((edge, index) => <g key={`${edge.predicate}-${index}`}>
      <line x1="180" y1="50" x2="390" y2={50 + index * 60} />
      <text x="285" y={43 + index * 60} textAnchor="middle">{edge.predicate}</text>
      <rect x="390" y={30 + index * 60} width="200" height="40" rx="6" />
      <text x="490" y={55 + index * 60} textAnchor="middle">{edge.target}</text>
    </g>)}
  </svg>;
}

export default function ModellingStudio() {
  const [endpoint, setEndpoint] = useState('http://127.0.0.1:4317');
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [connection, setConnection] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [graph, setGraph] = useState(null);
  const [diff, setDiff] = useState(null);
  const [job, setJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [definition, setDefinition] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState('');
  const cursor = useRef(0);

  useEffect(() => {
    if (!connection) return undefined;
    const abort = new AbortController();
    const { endpoint: url, token: credential, workspaceId: id } = connection;
    const tool = async (name, args) => (await call(url, credential, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    async function refresh() {
      const value = await tool('ontology_workspace_get', { workspaceId: id });
      cursor.current = value.eventSequence;
      setSnapshot(value);
      setDiff(null);
      const activity = await tool('ontology_history_get', { workspaceId: id });
      setHistory(activity.events);
      return value;
    }
    async function run() {
      try {
        await call(url, credential, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'chargeweave-browser', version: '0.1.0' } }, abort.signal);
        await refresh();
        setStatus('Connected');
        while (!abort.signal.aborted) {
          try {
            const response = await fetch(`${url}/events?workspaceId=${encodeURIComponent(id)}&after=${cursor.current}`, { headers: { Authorization: `Bearer ${credential}` }, signal: abort.signal });
            if (!response.ok || !response.body) throw new Error(`Event feed returned ${response.status}`);
            setStatus('Connected');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (!abort.signal.aborted) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              let boundary;
              while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
                if (event.includes('event: workspace-change')) await refresh();
              }
            }
          } catch (problem) {
            if (abort.signal.aborted) break;
            setStatus('Reconnecting');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await refresh();
          }
        }
      } catch (problem) {
        if (!abort.signal.aborted) { setError(problem.message); setStatus('Disconnected'); }
      }
    }
    run();
    return () => abort.abort();
  }, [connection]);

  useEffect(() => {
    if (!connection || !snapshot || !selected) { setGraph(null); return undefined; }
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_get', arguments: { workspaceId: connection.workspaceId, root: selected.name } }, abort.signal)
      .then(response => {
        const value = response.structuredContent;
        setGraph(value);
        const refreshed = value.nodes.find(item => item.name === value.root);
        if (refreshed) {
          setSelected(previous => previous?.name === refreshed.name ? refreshed : previous);
          setDefinition(draft => draft === selected.definition ? refreshed.definition : draft);
        }
      })
      .catch(problem => { if (!abort.signal.aborted) setError(problem.message); });
    return () => abort.abort();
  }, [connection, snapshot?.revision, selected?.name]);

  async function search(event) {
    event.preventDefault(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_context_search', arguments: { workspaceId: connection.workspaceId, query } });
      setResults(response.structuredContent.results);
    } catch (problem) { setError(problem.message); }
  }
  async function saveDefinition(event) {
    event.preventDefault(); setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_apply', arguments: {
        workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision,
        commands: [{ type: 'class.describe', name: selected.name, definition }],
      } });
      setSelected({ ...selected, definition });
      setStatus('Saved; awaiting workspace update');
    } catch (problem) { setError(problem.message); }
  }
  async function applyCommand(command) {
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_apply', arguments: {
        workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, commands: [command],
      } });
      setStatus('Saved; awaiting workspace update');
      return true;
    } catch (problem) { setError(problem.message); return false; }
  }
  async function addClass(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'class.add', ...newClass })) setNewClass({ name: '', module: newClass.module, parent: 'Record', definition: '' });
  }
  async function addField(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'property.add', owner: selected.name, ...field })) setField({ name: '', range: 'string', cardinality: '?' });
  }
  async function undoLatest() {
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_undo', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, targetRevision: snapshot.revision } });
      setStatus('Saved; awaiting workspace update');
    } catch (problem) { setError(problem.message); }
  }
  async function inspectChanges() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_diff', arguments: { workspaceId: connection.workspaceId } });
      setDiff(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  async function runChecks(profile) {
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_validation_start', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, profile } });
      let current = response.structuredContent;
      setJob(current);
      while (current.status === 'queued' || current.status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } });
        current = response.structuredContent; setJob(current);
      }
    } catch (problem) { setError(problem.message); }
  }
  function connect(event) {
    event.preventDefault(); setError(''); setSnapshot(null); setResults([]); setSelected(null); setStatus('Connecting');
    try {
      const url = new URL(endpoint);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('Use a loopback service URL such as http://127.0.0.1:4317');
      setConnection({ endpoint: url.origin, token, workspaceId });
    } catch (problem) { setError(problem.message); setStatus('Disconnected'); }
  }
  return <main id="main" className="container modelling-studio">
    <h1>Ontology modelling studio</h1>
    <p>Use Codex to propose changes; inspect and refine them here.</p>
    <form className="studio-connect" onSubmit={connect}>
      <label>Local service <input value={endpoint} onChange={event => setEndpoint(event.target.value)} required /></label>
      <label>Workspace ID <input value={workspaceId} onChange={event => setWorkspaceId(event.target.value)} required /></label>
      <label>Draft token <input type="password" value={token} onChange={event => setToken(event.target.value)} required autoComplete="off" /></label>
      <button type="submit">Connect</button>
    </form>
    <p role="status">{status}{snapshot && ` · revision ${snapshot.revision} · baseline ${snapshot.baselineCommit}`}</p>
    {error && <p role="alert">{error}</p>}
    {snapshot && <div className="studio-panels">
      <section><h2>Discover concepts</h2><form onSubmit={search}><label>Search model <input value={query} onChange={event => setQuery(event.target.value)} /></label><button>Search</button></form>
        <ul>{results.map(item => <li key={item.name}><button type="button" onClick={() => { setSelected(item); setDefinition(item.definition); }}>{item.name}</button> <small>{item.module}</small></li>)}</ul></section>
      <section><h2>Workspace</h2><p>{snapshot.title}</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision shown above. Search again to refresh results.</p>{graph && <div className="studio-graph"><h3>Concept neighbourhood</h3><p>Selected: <strong>{graph.root}</strong></p><NeighbourhoodDiagram graph={graph} />{graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.predicate} → </span><button type="button" onClick={() => { const node = graph.nodes.find(item => item.name === edge.target); setSelected(node); setDefinition(node.definition); }}>{edge.target}</button> <small>{edge.sourcePath}</small></li>)}</ul> : <p>No explicit class relationships.</p>}{graph.omitted > 0 && <p>{graph.omitted} relationships omitted.</p>}</div>}<details><summary>Add a concept</summary><form onSubmit={addClass}><label>Class name <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required /></label><label>Module <input value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required /></label><label>Parent class <input value={newClass.parent} onChange={e => setNewClass({ ...newClass, parent: e.target.value })} required /></label><label>Class definition <textarea value={newClass.definition} onChange={e => setNewClass({ ...newClass, definition: e.target.value })} required /></label><button>Add concept</button></form></details><button type="button" onClick={() => runChecks('structural')} disabled={job?.status === 'queued' || job?.status === 'running'}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={job?.status === 'queued' || job?.status === 'running'}>Run reference checks</button>{job && <div>{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={inspectChanges}>Inspect changes</button>{diff && <div><h3>Changes at revision {diff.revision}</h3>{diff.changes.length ? <ul>{diff.changes.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}</li>)}</ul> : <p>No changes from the baseline.</p>}<details><summary>Source before and after</summary><h4>Before</h4><pre>{diff.source.before}</pre><h4>After</h4><pre>{diff.source.after}</pre></details></div>}</section>
      <section><h2>Inspector</h2>{selected ? <><h3>{selected.name}</h3><form onSubmit={saveDefinition}><label>Definition <textarea value={definition} onChange={event => setDefinition(event.target.value)} maxLength={4000} required /></label><button disabled={definition === selected.definition}>Save definition</button><button type="button" onClick={() => setDefinition(selected.definition)}>Cancel</button></form><p>Parent: {selected.parent}</p><p>Fields: {selected.fields || 'None declared'}</p><details><summary>Add a field or relationship</summary><form onSubmit={addField}><label>Field name <input value={field.name} onChange={e => setField({ ...field, name: e.target.value })} required /></label><label>Datatype or target class <input value={field.range} onChange={e => setField({ ...field, range: e.target.value })} required /></label><label>Cardinality <select value={field.cardinality} onChange={e => setField({ ...field, cardinality: e.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Add field</button></form></details></> : <p>Select a concept to inspect it.</p>}</section>
    </div>}
    {snapshot && <section className="studio-activity"><h2>Activity</h2><button type="button" onClick={undoLatest} disabled={!snapshot.revision || history.at(-1)?.payload?.type === 'undo'}>Undo latest command group</button><ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : (event.payload.commands || []).map(command => command.type).join(', ')}</li>)}</ol></section>}
  </main>;
}
