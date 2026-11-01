import React, { useEffect, useRef, useState } from 'react';
import { classifyEvent } from './model/event-cursor.js';
import './modelling-studio.css';

// Stateless MCP Streamable HTTP requests; the token stays in component memory.
function authHeaders(credential) {
  return typeof credential === 'string' ? { Authorization: `Bearer ${credential}` } : { 'X-CSRF-Token': credential.csrf };
}
async function call(endpoint, token, method, params, signal) {
  const response = await fetch(`${endpoint}/mcp`, {
    method: 'POST', signal,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...authHeaders(token), 'MCP-Protocol-Version': '2025-06-18' },
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
  const [endpoint, setEndpoint] = useState(() => window.location.hostname === '127.0.0.1' && !['4173', '5173'].includes(window.location.port) ? window.location.origin : 'http://127.0.0.1:4317');
  const [token, setToken] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [connection, setConnection] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [graph, setGraph] = useState(null);
  const [entityInfo, setEntityInfo] = useState(null);
  const [diff, setDiff] = useState(null);
  const [job, setJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [definition, setDefinition] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [status, setStatus] = useState('Disconnected');
  const [online, setOnline] = useState(false);
  const [error, setError] = useState('');
  const cursor = useRef(0);
  const currentRevision = useRef(null);

  useEffect(() => {
    if (window.location.protocol !== 'http:' || window.location.hostname !== '127.0.0.1') return undefined;
    const abort = new AbortController();
    fetch('/session', { credentials: 'same-origin', signal: abort.signal }).then(async response => {
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
      const session = await response.json();
      setWorkspaceId(session.workspaceId);
      setEndpoint(window.location.origin);
      setConnection({ endpoint: window.location.origin, token: { csrf: session.csrf }, workspaceId: session.workspaceId });
    }).catch(() => {});
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!connection) return undefined;
    setOnline(false);
    const abort = new AbortController();
    const { endpoint: url, token: credential, workspaceId: id } = connection;
    const tool = async (name, args) => (await call(url, credential, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    async function refresh() {
      const value = await tool('ontology_workspace_get', { workspaceId: id });
      cursor.current = value.eventSequence;
      if (currentRevision.current !== value.revision) setResults([]);
      currentRevision.current = value.revision;
      setSnapshot(value);
      setDiff(null);
      setReadiness(null);
      const activity = await tool('ontology_history_get', { workspaceId: id });
      setHistory(activity.events);
      return value;
    }
    async function run() {
      try {
        await call(url, credential, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'chargeweave-browser', version: '0.1.0' } }, abort.signal);
        await refresh();
        setStatus('Connected');
        let delay = 500;
        let needsRefresh = false;
        while (!abort.signal.aborted) {
          try {
            if (needsRefresh) { await refresh(); needsRefresh = false; }
            const response = await fetch(`${url}/events?workspaceId=${encodeURIComponent(id)}&after=${cursor.current}`, { headers: authHeaders(credential), credentials: 'same-origin', signal: abort.signal });
            if (!response.ok || !response.body) throw new Error(`Event feed returned ${response.status}`);
            setStatus('Connected');
            setOnline(true);
            delay = 500;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (!abort.signal.aborted) {
              const { value, done } = await reader.read();
              if (done) throw new Error('Event stream closed');
              buffer += decoder.decode(value, { stream: true });
              if (buffer.length > 1024 * 1024) throw new Error('Event buffer exceeded; reload snapshot');
              let boundary;
              while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
                if (event.includes('event: workspace-change')) {
                  const data = event.split('\n').find(line => line.startsWith('data: '));
                  const disposition = classifyEvent(data ? JSON.parse(data.slice(6)) : null, cursor.current);
                  if (disposition !== 'duplicate') { setOnline(false); await refresh(); setOnline(true); }
                }
              }
            }
          } catch (problem) {
            if (abort.signal.aborted) break;
            setOnline(false);
            setStatus('Reconnecting');
            needsRefresh = true;
            await new Promise(resolve => setTimeout(resolve, delay + Math.random() * delay * 0.2));
            delay = Math.min(delay * 2, 10000);
          }
        }
      } catch (problem) {
        if (!abort.signal.aborted) { setOnline(false); setError(problem.message); setStatus('Disconnected'); }
      }
    }
    run();
    return () => abort.abort();
  }, [connection]);

  useEffect(() => {
    if (!connection || !snapshot || !selected) { setGraph(null); return undefined; }
    const abort = new AbortController();
    setGraph(null);
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_get', arguments: { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision } }, abort.signal)
      .then(response => {
        const value = response.structuredContent;
        if (value.revision !== currentRevision.current) return;
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

  useEffect(() => {
    if (!connection || !snapshot || !selected) { setEntityInfo(null); return undefined; }
    const abort = new AbortController();
    setEntityInfo(null);
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: selected.name, expectedRevision: snapshot.revision } }, abort.signal)
      .then(response => { if (response.structuredContent.revision === currentRevision.current) setEntityInfo(response.structuredContent.entity); })
      .catch(problem => { if (!abort.signal.aborted) setError(problem.message); });
    return () => abort.abort();
  }, [connection, snapshot?.revision, selected?.name]);

  async function search(event) {
    event.preventDefault(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_context_search', arguments: { workspaceId: connection.workspaceId, query, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setResults(response.structuredContent.results);
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
  async function inspectReadiness() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_readiness', arguments: { workspaceId: connection.workspaceId } });
      setReadiness(response.structuredContent);
    } catch { setError('Review readiness requires a reviewer credential.'); }
  }
  async function runChecks(profile) {
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_validation_start', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, profile } });
      let current = response.structuredContent;
      setJob(current);
      while (['queued', 'running', 'cancelling'].includes(current.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } });
        current = response.structuredContent; setJob(current);
      }
    } catch (problem) { setError(problem.message); }
  }
  async function cancelCheck() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_cancel', arguments: { workspaceId: connection.workspaceId, jobId: job.id, operationId: crypto.randomUUID() } });
      setJob(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  function connect(event) {
    event.preventDefault(); setError(''); setOnline(false); setSnapshot(null); setResults([]); setSelected(null); setStatus('Connecting');
    try {
      const url = new URL(endpoint);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('Use a loopback service URL such as http://127.0.0.1:4317');
      setConnection({ endpoint: url.origin, token, workspaceId });
    } catch (problem) { setError(problem.message); setStatus('Disconnected'); }
  }
  async function pair(event) {
    event.preventDefault(); setError(''); setOnline(false); setStatus('Connecting');
    try {
      if (window.location.protocol !== 'http:' || window.location.hostname !== '127.0.0.1') throw new Error('Open the local studio URL before pairing.');
      const response = await fetch('/pair', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pairingCode }) });
      if (!response.ok) throw new Error('Pairing code is invalid, expired, or unavailable.');
      const session = await response.json();
      setPairingCode(''); setWorkspaceId(session.workspaceId); setEndpoint(window.location.origin);
      setConnection({ endpoint: window.location.origin, token: { csrf: session.csrf }, workspaceId: session.workspaceId });
    } catch (problem) { setStatus('Disconnected'); setError(problem.message); }
  }
  async function disconnect() {
    let revokeFailed = false;
    if (connection && typeof connection.token !== 'string') {
      try {
        const response = await fetch('/session', { method: 'DELETE', credentials: 'same-origin', headers: authHeaders(connection.token) });
        revokeFailed = !response.ok;
      } catch { revokeFailed = true; }
    }
    setConnection(null); setOnline(false); setSnapshot(null); setSelected(null); setStatus('Disconnected');
    if (revokeFailed) setError('Could not confirm session revocation. Reconnect and try Disconnect again, or restart the service.');
  }
  return <main id="main" className="container modelling-studio">
    <h1>Ontology modelling studio</h1>
    <p>Use Codex to propose changes; inspect and refine them here.</p>
    <form className="studio-connect" onSubmit={pair}>
      <label>Pairing code <input type="password" value={pairingCode} onChange={event => setPairingCode(event.target.value)} required autoComplete="off" /></label>
      <button type="submit">Pair local studio</button>
    </form>
    <form className="studio-connect" onSubmit={connect}>
      <label>Local service <input value={endpoint} onChange={event => setEndpoint(event.target.value)} required /></label>
      <label>Workspace ID <input value={workspaceId} onChange={event => setWorkspaceId(event.target.value)} required /></label>
      <label>Draft token <input type="password" value={token} onChange={event => setToken(event.target.value)} required autoComplete="off" /></label>
      <button type="submit">Connect</button>
    </form>
    <p role="status">{status}{snapshot && ` · revision ${snapshot.revision} · baseline ${snapshot.baselineCommit}`}</p>
    {connection && <button type="button" onClick={disconnect}>Disconnect</button>}
    {error && <p role="alert">{error}</p>}
    {snapshot && <fieldset className="studio-workspace" disabled={!online}><legend className="sr-only">Modelling workspace</legend><div className="studio-panels">
      <section><h2>Discover concepts</h2><form onSubmit={search}><label>Search model <input value={query} onChange={event => setQuery(event.target.value)} /></label><button>Search</button></form>
        <ul>{results.map(item => <li key={item.name}><button type="button" onClick={() => { setSelected(item); setDefinition(item.definition); }}>{item.name}</button> <small>{item.module}</small></li>)}</ul></section>
      <section><h2>Workspace</h2><p>{snapshot.title}</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision shown above. Search again to refresh results.</p>{graph && <div className="studio-graph"><h3>Concept neighbourhood</h3><p>Selected: <strong>{graph.root}</strong></p><NeighbourhoodDiagram graph={graph} />{graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.predicate} → </span><button type="button" onClick={() => { const node = graph.nodes.find(item => item.name === edge.target); setSelected(node); setDefinition(node.definition); }}>{edge.target}</button> <small>{edge.cardinality ? ' (' + edge.cardinality + ')' : ''} · {edge.changeStatus} · {edge.sourceRef.path}:{edge.sourceRef.line}</small></li>)}</ul> : <p>No explicit class relationships.</p>}{graph.omitted > 0 && <p>{graph.omitted} relationships omitted.</p>}</div>}<details><summary>Add a concept</summary><form onSubmit={addClass}><label>Class name <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required /></label><label>Module <input value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required /></label><label>Parent class <input value={newClass.parent} onChange={e => setNewClass({ ...newClass, parent: e.target.value })} required /></label><label>Class definition <textarea value={newClass.definition} onChange={e => setNewClass({ ...newClass, definition: e.target.value })} required /></label><button>Add concept</button></form></details><button type="button" onClick={() => runChecks('structural')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run reference checks</button><button type="button" onClick={() => runChecks('acceptance')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run release gates</button>{job && <div>{['queued', 'running'].includes(job.status) && <button type="button" onClick={cancelCheck}>Cancel check</button>}{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest || job.revision !== snapshot.revision ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.steps?.length > 0 && <ul>{job.steps.map(step => <li key={step.ordinal}>{step.checkName}: {step.status}</li>)}</ul>} {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={inspectChanges}>Inspect changes</button>{diff && <div><h3>Changes at revision {diff.revision}</h3>{diff.changes.length ? <ul>{diff.changes.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}</li>)}</ul> : <p>No changes from the baseline.</p>}<details open><summary>Source patch</summary><pre>{diff.source.patch}</pre></details><details><summary>Source before and after</summary><h4>Before</h4><pre>{diff.source.before}</pre><h4>After</h4><pre>{diff.source.after}</pre></details></div>}</section>
      <section><h2>Inspector</h2>{selected ? <><h3>{selected.name}</h3><form onSubmit={saveDefinition}><label>Definition <textarea value={definition} onChange={event => setDefinition(event.target.value)} maxLength={4000} required /></label><button disabled={definition === selected.definition}>Save definition</button><button type="button" onClick={() => setDefinition(selected.definition)}>Cancel</button></form><p>Parent: {selected.parent}</p>{entityInfo && <><p>IRI: <code>{entityInfo.iri}</code></p><p>Source: {entityInfo.source.path}:{entityInfo.source.line}</p><h4>Fields</h4>{entityInfo.fields.length ? <ul>{entityInfo.fields.map((item, index) => <li key={index}>{item.property}: {item.range} ({item.cardinality}) — {item.inherited ? 'inherited from ' + item.owner : 'declared'} <small>{item.source.path}:{item.source.line}</small></li>)}</ul> : <p>No fields.</p>}</>}<details><summary>Add a field or relationship</summary><form onSubmit={addField}><label>Field name <input value={field.name} onChange={e => setField({ ...field, name: e.target.value })} required /></label><p>Use a datatype, class name, or controlled values such as &#123;Draft,Confirmed,Cancelled&#125;.</p><label>Datatype or target class <input value={field.range} onChange={e => setField({ ...field, range: e.target.value })} required /></label><label>Cardinality <select value={field.cardinality} onChange={e => setField({ ...field, cardinality: e.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Add field</button></form></details></> : <p>Select a concept to inspect it.</p>}</section>
    </div>
    <section className="studio-activity"><h2>Review readiness</h2><button type="button" onClick={inspectReadiness}>Inspect review gates</button>{readiness && <><p>Revision {readiness.revision}, digest <code>{readiness.sourceDigest}</code></p><p>Acceptance is not available yet.</p><ul>{readiness.missing.map(item => <li key={item}>Missing: {item}</li>)}</ul></>}<h2>Activity</h2><button type="button" onClick={undoLatest} disabled={!snapshot.revision || history.at(-1)?.payload?.type === 'undo'}>Undo latest command group</button><ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : (event.payload.commands || []).map(command => command.type).join(', ')}</li>)}</ol></section></fieldset>}
  </main>;
}
