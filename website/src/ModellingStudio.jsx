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
  const [temporal, setTemporal] = useState(null);
  const [temporalPolicy, setTemporalPolicy] = useState('snapshot-versioned');
  const [responsibility, setResponsibility] = useState(null);
  const [impact, setImpact] = useState(null);
  const [requirementQuery, setRequirementQuery] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [intervalRule, setIntervalRule] = useState({ startProperty: '', endProperty: '', ruleId: '' });
  const [diff, setDiff] = useState(null);
  const [job, setJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [publication, setPublication] = useState(null);
  const [publicationSubject, setPublicationSubject] = useState('');
  const [publicationBody, setPublicationBody] = useState('');
  const [publicationHistory, setPublicationHistory] = useState([]);
  const [canPush, setCanPush] = useState(false);
  const [commitSha, setCommitSha] = useState('');
  const [commitWorkflows, setCommitWorkflows] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewDecision, setReviewDecision] = useState('request_changes');
  const [reviewCase, setReviewCase] = useState({ requirementId: '', ruleId: '', caseId: '', start: '', end: '', expectedConformance: 'true', scenario: '' });
  const [definition, setDefinition] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [fieldEdit, setFieldEdit] = useState(null);
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

  useEffect(() => { setTemporal(null); }, [connection, snapshot?.revision, selected?.name]);
  useEffect(() => { setResponsibility(null); }, [connection, snapshot?.revision, selected?.name]);
  useEffect(() => { setImpact(null); }, [connection, snapshot?.revision]);
  useEffect(() => { setPublication(null); }, [connection, snapshot?.revision]);
  useEffect(() => { setRequirements([]); }, [connection, snapshot?.revision]);
  useEffect(() => { setFieldEdit(null); }, [connection, selected?.name]);
  useEffect(() => { setIntervalRule({ startProperty: '', endProperty: '', ruleId: '' }); }, [connection, selected?.name]);

  function startFieldEdit(item) {
    const range = item.values ? `{${item.values.join(',')}}` : item.range;
    setFieldEdit({ name: item.property, expectedRange: range, expectedCardinality: item.cardinality, range, cardinality: item.cardinality });
  }
  async function updateField(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'property.update', owner: selected.name, ...fieldEdit })) setFieldEdit(null);
  }

  async function inspectImpact() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_change_impact_get', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setImpact(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  async function inspectPublication() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_preflight', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setPublication(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  async function searchRequirements(event) {
    event.preventDefault(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_requirement_search', arguments: { workspaceId: connection.workspaceId, query: requirementQuery, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setRequirements(response.structuredContent.results);
    } catch (problem) { setError(problem.message); }
  }
  async function focusSuggestion(event) {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: event.payload.root, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) {
        setSelected(response.structuredContent.entity);
        setDefinition(response.structuredContent.entity.definition);
      }
    } catch (problem) { setError(problem.message); }
  }
  async function linkRequirement(item) {
    await applyCommand({ type: 'requirement.link', requirementId: item.id, className: selected.name, expectedClasses: item.classes });
  }
  async function addIntervalRule(event, item) {
    event.preventDefault();
    const eligible = (entityInfo?.fields || []).filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality));
    const start = eligible.find(field => field.property === intervalRule.startProperty), end = eligible.find(field => field.property === intervalRule.endProperty);
    if (!start || !end || start.property === end.property) { setError('Choose two different declared date-time fields.'); return; }
    if (await applyCommand({ type: 'constraint.add', template: 'valid-interval', owner: selected.name, startProperty: start.property, endProperty: end.property, expectedStartCardinality: start.cardinality, expectedEndCardinality: end.cardinality, requirementId: item.id, expectedRules: item.rules, ruleId: intervalRule.ruleId })) setIntervalRule({ startProperty: '', endProperty: '', ruleId: '' });
  }

  async function inspectResponsibility() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_responsibility_view_get', arguments: { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setResponsibility(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }

  async function inspectTemporal() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_temporal_view_get', arguments: { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current && response.structuredContent.root === selected.name) {
        setTemporal(response.structuredContent);
        setTemporalPolicy(response.structuredContent.policy ?? 'snapshot-versioned');
      }
    } catch (problem) { setError(problem.message); }
  }
  async function saveTemporalPolicy(event) {
    event.preventDefault();
    await applyCommand({ type: 'temporal.policy_set', className: selected.name, expectedPolicy: temporal.policy, policy: temporalPolicy });
  }

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
      const history = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_decisions', arguments: { workspaceId: connection.workspaceId } });
      setReviews(history.structuredContent.decisions);
    } catch { setError('Review readiness requires a reviewer credential.'); }
  }
  async function submitReview(event) {
    event.preventDefault(); setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_review', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, decision: reviewDecision, reason: reviewReason } });
      setReviewReason('');
      const history = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_decisions', arguments: { workspaceId: connection.workspaceId } });
      setReviews(history.structuredContent.decisions);
    } catch (problem) { setError(problem.message); }
  }
  async function submitReviewCase(event) {
    event.preventDefault(); setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_reviewer_interval_case_add', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, ...reviewCase, expectedConformance: reviewCase.expectedConformance === 'true' } });
      setStatus('Reviewer case saved; validation must be rerun');
    } catch (problem) { setError(problem.message); }
  }
  async function inspectCommitWorkflows(event) {
    event.preventDefault(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_github_commit_workflows', arguments: { workspaceId: connection.workspaceId, commitSha } });
      setCommitWorkflows(response.structuredContent);
    } catch (problem) { setError(problem.message); }
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
  async function inspectPublicationHistory() {
    const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_history', arguments: { workspaceId: connection.workspaceId } });
    setPublicationHistory(response.structuredContent.publications);
    const capabilities = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_capabilities', arguments: { workspaceId: connection.workspaceId } });
    setCanPush(capabilities.structuredContent.canPush);
  }
  async function reservePublication(event) {
    event.preventDefault(); setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_reserve', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, reviewId: reviews[0].id, previewJobId: job.id, subject: publicationSubject, body: publicationBody } });
      await inspectPublicationHistory();
    } catch (problem) { setError(problem.message); }
  }
  async function preparePublication(reviewId) {
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_prepare', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, reviewId } });
      let current = response.structuredContent; setJob(current);
      while (['queued', 'running', 'cancelling'].includes(current.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } });
        current = response.structuredContent; setJob(current);
      }
    } catch (problem) { setError(problem.message); }
  }
  async function createLocalCommit(publicationId) {
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_create_commit', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, publicationId } });
      let current = response.structuredContent; setJob(current);
      while (['queued', 'running'].includes(current.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } });
        current = response.structuredContent; setJob(current);
      }
      await inspectPublicationHistory();
    } catch (problem) { setError(problem.message); }
  }
  async function runPublicationAction(publicationId, name) {
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name, arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, publicationId } });
      let current = response.structuredContent; setJob(current);
      while (['queued', 'running'].includes(current.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } });
        current = response.structuredContent; setJob(current);
      }
      await inspectPublicationHistory();
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
      <section><h2>Workspace</h2><p>{snapshot.title}</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision shown above. Search again to refresh results.</p>{graph && <div className="studio-graph"><h3>Concept neighbourhood</h3><p>Selected: <strong>{graph.root}</strong></p><NeighbourhoodDiagram graph={graph} />{graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.predicate} → </span><button type="button" onClick={() => { const node = graph.nodes.find(item => item.name === edge.target); setSelected(node); setDefinition(node.definition); }}>{edge.target}</button> <small>{edge.cardinality ? ' (' + edge.cardinality + ')' : ''} · {edge.changeStatus} · {edge.sourceRef.path}:{edge.sourceRef.line}</small></li>)}</ul> : <p>No explicit class relationships.</p>}{graph.omitted > 0 && <p>{graph.omitted} relationships omitted.</p>}</div>}<details><summary>Add a concept</summary><form onSubmit={addClass}><label>Class name <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required /></label><label>Module <input value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required /></label><label>Parent class <input value={newClass.parent} onChange={e => setNewClass({ ...newClass, parent: e.target.value })} required /></label><label>Class definition <textarea value={newClass.definition} onChange={e => setNewClass({ ...newClass, definition: e.target.value })} required /></label><button>Add concept</button></form></details><button type="button" onClick={() => runChecks('structural')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run reference checks</button><button type="button" onClick={() => runChecks('audit')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run independent audit</button><button type="button" onClick={() => runChecks('acceptance')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run release gates</button>{job && <div>{['queued', 'running'].includes(job.status) && <button type="button" onClick={cancelCheck}>Cancel check</button>}{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest || job.revision !== snapshot.revision ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.steps?.length > 0 && <ul>{job.steps.map(step => <li key={step.ordinal}>{step.checkName}: {step.status}</li>)}</ul>} {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={inspectChanges}>Inspect changes</button>{diff && <div><h3>Changes at revision {diff.revision}</h3>{diff.changes.length ? <ul>{diff.changes.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}{item.fieldChanges?.length > 0 && <ul>{item.fieldChanges.map(change => <li key={change.name}>{change.name}: {change.compatibility}{change.compatibility === 'potentially-breaking' ? ' — existing data or consumers may need migration and new tests' : ''}</li>)}</ul>}</li>)}</ul> : <p>{diff.additionalSources?.length ? 'No schema changes; additional source changes are shown below.' : 'No changes from the baseline.'}</p>}<details open><summary>Source patch</summary><pre>{diff.source.patch}</pre></details><details><summary>Source before and after</summary><h4>Before</h4><pre>{diff.source.before}</pre><h4>After</h4><pre>{diff.source.after}</pre></details>{diff.additionalSources?.map(source => <details key={source.path} open><summary>Source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}</div>}</section>
      <section><h2>Inspector</h2>{selected ? <><h3>{selected.name}</h3><form onSubmit={saveDefinition}><label>Definition <textarea value={definition} onChange={event => setDefinition(event.target.value)} maxLength={4000} required /></label><button disabled={definition === selected.definition}>Save definition</button><button type="button" onClick={() => setDefinition(selected.definition)}>Cancel</button></form><p>Parent: {selected.parent}</p>{entityInfo && <><p>IRI: <code>{entityInfo.iri}</code></p><p>Source: {entityInfo.source.path}:{entityInfo.source.line}</p><h4>Fields</h4>{entityInfo.fields.length ? <ul>{entityInfo.fields.map((item, index) => <li key={index}>{item.property}: {item.range} ({item.cardinality}) — {item.inherited ? 'inherited from ' + item.owner : 'declared'} <small>{item.source.path}:{item.source.line}</small>{!item.inherited && <button type="button" onClick={() => startFieldEdit(item)}>Edit {item.property}</button>}{!item.inherited && item.type === 'object' && ['?', '*'].includes(item.cardinality) && <button type="button" title="Requiring a relationship may break existing data." onClick={() => applyCommand({ type: 'constraint.add', template: 'required-relationship', owner: selected.name, name: item.property, expectedRange: item.range, expectedCardinality: item.cardinality })}>Require {item.property}</button>}</li>)}</ul> : <p>No fields.</p>}</>}<details><summary>Add a field or relationship</summary><form onSubmit={addField}><label>Field name <input value={field.name} onChange={e => setField({ ...field, name: e.target.value })} required /></label><p>Use a datatype, class name, or controlled values such as &#123;Draft,Confirmed,Cancelled&#125;.</p><label>Datatype or target class <input value={field.range} onChange={e => setField({ ...field, range: e.target.value })} required /></label><label>Cardinality <select value={field.cardinality} onChange={e => setField({ ...field, cardinality: e.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Add field</button></form></details></> : <p>Select a concept to inspect it.</p>}</section>
    </div>
    {fieldEdit && selected && <section className="studio-activity"><h2>Edit field contract</h2><p>Changing a range or tightening cardinality can break existing data and consumers. Review affected requirements and rerun checks.</p><p>Current contract: {fieldEdit.name}: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}).</p><form onSubmit={updateField}><label>New datatype or target class <input value={fieldEdit.range} onChange={event => setFieldEdit({ ...fieldEdit, range: event.target.value })} required /></label><label>New cardinality <select value={fieldEdit.cardinality} onChange={event => setFieldEdit({ ...fieldEdit, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Update field contract</button><button type="button" onClick={() => setFieldEdit(null)}>Cancel field edit</button></form></section>}
    <section className="studio-activity"><h2>Responsibility perspective</h2><button type="button" onClick={inspectResponsibility} disabled={!selected}>Inspect responsibilities for selected concept</button>{responsibility && responsibility.root === selected?.name && responsibility.revision === snapshot.revision && <><p>{responsibility.note}</p>{responsibility.bindings.length ? <ul>{responsibility.bindings.map(binding => <li key={`${binding.owner}-${binding.property}`}><strong>{binding.label}</strong>: {binding.property} → {binding.range} ({binding.cardinality}) · {binding.category} · {binding.source.path}:{binding.source.line} · {binding.mappingVersion}</li>)}</ul> : <p>No responsibility binding defined in this mapping.</p>}</>}</section>
    <section className="studio-activity"><h2>Temporal perspective</h2><button type="button" onClick={inspectTemporal} disabled={!selected}>Inspect time for selected concept</button>{temporal && temporal.root === selected?.name && temporal.revision === snapshot.revision && <><p>Model revision {temporal.revision}; {temporal.policySource.scope === 'draft' ? 'draft policy from baseline' : 'policy from baseline'} <code>{temporal.baselineCommit}</code>.</p><p>Class policy: {temporal.policy ?? 'No explicit temporal policy defined.'}</p>{snapshot.editableSources?.includes('model/temporal-policy.json') && <form onSubmit={saveTemporalPolicy}><label>Set explicit temporal policy <select value={temporalPolicy} onChange={event => setTemporalPolicy(event.target.value)}><option value="snapshot-versioned">Snapshot versioned</option><option value="immutable-aggregate">Immutable aggregate</option><option value="history-metadata">History metadata</option><option value="tenant-context">Tenant context</option><option value="abstract">Abstract</option></select></label><button disabled={temporalPolicy === temporal.policy}>Save temporal policy</button><p>Review the policy and associated temporal tests; choosing a value does not establish complete time semantics.</p></form>}<p>Policy source: {temporal.policySource.path}; interval convention: {temporal.timeConvention.interval ?? 'unspecified'}; recorded time: {temporal.timeConvention.recordedTimeOwner ?? 'unspecified'}.</p><h3>Explicit time fields and window references</h3>{temporal.fields.length ? <ul>{temporal.fields.map(field => <li key={`${field.owner}-${field.property}`}>{field.property}: {field.range} ({field.cardinality}) · {field.inherited ? `inherited from ${field.owner}` : 'declared'} · {field.source.path}:{field.source.line}</li>)}</ul> : <p>No explicit time fields or window references.</p>}</>}</section>
    <section className="studio-activity"><h2>Requirement links</h2>{snapshot.digestVersion === 4 ? <><p>Linking a concept records a relationship in the requirement register; it does not prove coverage or acceptance.</p><form onSubmit={searchRequirements}><label>Search requirements <input value={requirementQuery} onChange={event => setRequirementQuery(event.target.value)} /></label><button>Search requirements</button></form><ul>{requirements.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <button type="button" disabled={!selected || item.classes.includes(selected.name)} onClick={() => linkRequirement(item)}>Link selected concept</button>{selected && item.classes.includes(selected.name) && ['model/audit-rules.json', 'model/authoring-example-overrides.json', 'tests/business-acceptance.json', 'tests/negative-cases.json'].every(path => snapshot.editableSources?.includes(path)) && <details><summary>Add interval rule for {item.id}</summary><p>Only a new class with two new, declared date-time fields is supported. The generated cases are draft examples and require independent review.</p><form onSubmit={event => addIntervalRule(event, item)}><label>Interval start <select value={intervalRule.startProperty} onChange={event => setIntervalRule({ ...intervalRule, startProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>Interval end <select value={intervalRule.endProperty} onChange={event => setIntervalRule({ ...intervalRule, endProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>New rule ID <input value={intervalRule.ruleId} onChange={event => setIntervalRule({ ...intervalRule, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><button>Add interval constraint</button></form></details>}</li>)}</ul></> : <p>Create a version-four workspace to edit requirement links.</p>}</section>
    <section className="studio-activity"><h2>Change impact</h2><button type="button" onClick={inspectImpact}>Inspect explicit impact references</button>{impact && impact.revision === snapshot.revision && <><p>{impact.note}</p><p>Changed classes: {impact.changedClasses.join(', ') || 'none'}; changed properties: {impact.changedProperties.join(', ') || 'none'}.</p>{impact.references.length ? <ul>{impact.references.map(item => <li key={`${item.kind}-${item.id}`}>{item.kind} {item.id}: {item.title} · {item.source} · references {item.terms.join(', ')}</li>)}</ul> : <p>No indexed baseline references matched.</p>}{impact.omitted > 0 && <p>{impact.omitted} additional references omitted.</p>}</>}</section>
    {job?.artifactSummary && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) && <section className="studio-activity"><h2>Generated artifact comparison</h2><p>Revision {job.revision} · {job.artifactSummary.changedCount} files differ in exact bytes{job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' · stale' : ''}.</p><p>{job.artifactSummary.note}</p><p>Baseline manifest: <code>{job.artifactSummary.baselineManifestSha256}</code>; candidate manifest: <code>{job.artifactSummary.candidateManifestSha256}</code>.</p>{job.artifactSummary.changes.length > 0 && <ul>{job.artifactSummary.changes.map(item => <li key={item.path}>{item.kind}: {item.path}</li>)}</ul>}{job.artifactSummary.omitted > 0 && <p>{job.artifactSummary.omitted} additional changes omitted.</p>}</section>}
    {history.some(event => event.payload.type === 'view_suggestion') && <section className="studio-activity"><h2>Suggested views</h2><p>Suggestions do not change the model or select a concept until you choose one.</p><ul>{history.filter(event => event.payload.type === 'view_suggestion').slice(-10).reverse().map(event => <li key={event.sequence}><strong>{event.payload.root}</strong> · {event.payload.viewpoint} · {event.actor} · revision {event.revision}<p>{event.payload.explanation}</p><button type="button" disabled={event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest} onClick={() => focusSuggestion(event)}>Focus {event.payload.root}</button>{(event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest) && <small> Suggestion refers to an older draft.</small>}</li>)}</ul></section>}
    <section className="studio-activity"><h2>Publication preflight</h2><p>Check the target and available evidence before review. Publication requires a current review and explicit publisher permission.</p><button type="button" onClick={inspectPublication}>Check publication target</button>{publication && publication.revision === snapshot.revision && <><p>Target: {publication.target.repository} · {publication.target.branch} · {publication.target.status}.</p><p>Baseline: <code>{publication.baselineCommit}</code>; target head: <code>{publication.target.head ?? 'unavailable'}</code>.</p><p>Changed source files: {publication.sourceFiles.join(', ') || 'none'}.</p>{publication.comparison && <><p>Remote comparison: {publication.comparison.status}. {publication.comparison.note}</p><p>Overlapping files: {publication.comparison.overlap.join(', ') || 'none identified'}.</p><details><summary>Files changed on target</summary><ul>{publication.comparison.changedFiles.map(path => <li key={path}>{path}</li>)}</ul></details></>}<p>Generated comparison: {publication.generatedEvidence ? `${publication.generatedEvidence.summary.changedCount} byte-different files from ${publication.generatedEvidence.profile} checks` : 'not available for this revision'}.</p><ul>{publication.limitations.map(item => <li key={item}>{item}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Prepare reviewed candidate</h2><p>Stage the exact accepted source and generated files in a disposable checkout. This does not publish or recheck the remote.</p><button type="button" disabled={!reviews[0] || reviews[0].decision !== 'accept' || reviews[0].revision !== snapshot.revision || reviews[0].sourceDigest !== snapshot.sourceDigest} onClick={() => preparePublication(reviews[0].id)}>Prepare staged preview</button>{job?.profile === 'publication-preview' && <><p>Preview: {job.status}{job.stale ? ' ? stale' : ''}.</p>{job.output && <pre>{job.output}</pre>}{job.artifactSummary?.files && <><p>{job.artifactSummary.note}</p><ul>{job.artifactSummary.files.map(file => <li key={file.path}>{file.kind}: {file.path} ? {file.sha256 ?? 'removed'}</li>)}</ul><form onSubmit={reservePublication}><label>Commit subject <input value={publicationSubject} onChange={event => setPublicationSubject(event.target.value)} maxLength={120} required /></label><label>Commit description <textarea value={publicationBody} onChange={event => setPublicationBody(event.target.value)} maxLength={10000} required /></label><button disabled={job.stale}>Save publication intent</button></form></>}</>}</section>
    <section className="studio-activity">
      <h2>Publication history</h2>
      <button type="button" onClick={() => inspectPublicationHistory().catch(problem => setError(problem.message))}>Inspect publication history</button>
      <p>A saved intent is local. Publisher permission: {canPush ? 'enabled' : 'not enabled'}.</p>
      {['publication-commit', 'publication-push', 'publication-pr'].includes(job?.profile) && <p>Publication operation: {job.status}. {job.output} {job.artifactSummary?.note}</p>}
      <ol>{publicationHistory.map(item => <li key={item.id}>
        {item.state} - {item.branch} - revision {item.revision}{item.stale ? ' - stale' : ''}{item.commitSha && <> - <code>{item.commitSha}</code></>}
        <p>{item.subject}</p>
        {item.state === 'prepared' && <button type="button" disabled={item.stale} onClick={() => createLocalCommit(item.id)}>Create local commit</button>}
        {['commit_created', 'push_unknown'].includes(item.state) && <button type="button" disabled={!canPush || (item.stale && item.state !== 'push_unknown')} onClick={() => runPublicationAction(item.id, 'ontology_publication_push')}>{item.state === 'push_unknown' ? 'Reconcile push' : 'Push isolated branch'}</button>}
        {['pushed', 'pr_unknown'].includes(item.state) && <button type="button" disabled={!canPush || (item.stale && item.state !== 'pr_unknown')} onClick={() => runPublicationAction(item.id, 'ontology_publication_pull_request')}>{item.state === 'pr_unknown' ? 'Reconcile pull request' : 'Create draft pull request'}</button>}
        {item.prNumber && <p><a href={`https://github.com/pli-poc/charge-weave/pull/${item.prNumber}`} target="_blank" rel="noreferrer">Pull request #{item.prNumber}</a> - {item.prStatus} when recorded</p>}
      </li>)}</ol>
    </section>
    <section className="studio-activity"><h2>GitHub commit checks</h2><p>Look up workflow runs for a full commit SHA. This does not check branch-protection requirements or deployment.</p><form onSubmit={inspectCommitWorkflows}><label>Commit SHA <input value={commitSha} onChange={event => setCommitSha(event.target.value)} pattern="[a-f0-9]{40}" required /></label><button>Check commit workflows</button></form>{commitWorkflows && <><p>Commit <code>{commitWorkflows.sha}</code>: {commitWorkflows.status}. {commitWorkflows.reason || commitWorkflows.note}</p><ul>{commitWorkflows.workflows.map(run => <li key={run.id}><a href={run.url} target="_blank" rel="noreferrer">{run.name}</a>: {run.status}{run.conclusion ? ` ? ${run.conclusion}` : ''}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Reviewer interval case</h2><p>Write a separate synthetic example and expected outcome. Review whether it is independent and relevant; saving it does not run validation.</p><form onSubmit={submitReviewCase}><label>Requirement ID <input value={reviewCase.requirementId} onChange={event => setReviewCase({ ...reviewCase, requirementId: event.target.value })} pattern="BR-[0-9]+" required /></label><label>Rule ID <input value={reviewCase.ruleId} onChange={event => setReviewCase({ ...reviewCase, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><label>Unique case ID <input value={reviewCase.caseId} onChange={event => setReviewCase({ ...reviewCase, caseId: event.target.value })} pattern="[A-Za-z0-9][A-Za-z0-9-]*" maxLength={128} required /></label><label>Start (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.start} onChange={event => setReviewCase({ ...reviewCase, start: event.target.value })} required /></label><label>End (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.end} onChange={event => setReviewCase({ ...reviewCase, end: event.target.value })} required /></label><label>Expected outcome <select value={reviewCase.expectedConformance} onChange={event => setReviewCase({ ...reviewCase, expectedConformance: event.target.value })}><option value="true">Conforms</option><option value="false">Violates rule</option></select></label><label>Business scenario and expected result <textarea value={reviewCase.scenario} onChange={event => setReviewCase({ ...reviewCase, scenario: event.target.value })} minLength={12} maxLength={1000} required /></label><button>Save reviewer case</button></form></section>
    <section className="studio-activity"><h2>Reviewer decision</h2><p>Acceptance records a reviewer decision for this exact draft; it does not publish or establish business completeness. A rejection does not erase the draft.</p><form onSubmit={submitReview}><label>Decision <select value={reviewDecision} onChange={event => setReviewDecision(event.target.value)}><option value="request_changes">Request changes</option><option value="reject">Reject draft</option><option value="accept">Accept draft</option></select></label><label>Reason <textarea value={reviewReason} onChange={event => setReviewReason(event.target.value)} maxLength={4000} required /></label><button>Record reviewer decision</button></form>{reviews.length > 0 && <ol>{reviews.map(review => <li key={review.id}>{review.decision === 'reject' ? 'Rejected' : review.decision === 'accept' ? 'Accepted' : 'Changes requested'} · revision {review.revision} · {review.actor} · {review.revision !== snapshot.revision || review.sourceDigest !== snapshot.sourceDigest ? 'stale' : 'current'}<p>{review.reason}</p></li>)}</ol>}</section>
    <section className="studio-activity"><h2>Review readiness</h2><button type="button" onClick={inspectReadiness}>Inspect review gates</button>{readiness && <><p>Revision {readiness.revision}, digest <code>{readiness.sourceDigest}</code></p><p>{readiness.canAccept ? 'Ready for a reviewer decision.' : 'Review gates are incomplete.'} {readiness.note}</p><ul>{readiness.missing.map(item => <li key={item}>Missing: {item}</li>)}</ul></>}<h2>Activity</h2><button type="button" onClick={undoLatest} disabled={!snapshot.revision || history.at(-1)?.payload?.type === 'undo'}>Undo latest command group</button><ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : event.payload.type === 'review' ? event.payload.decision : event.payload.type === 'publication' ? `publication ${event.payload.state}` : event.payload.type === 'view_suggestion' ? 'suggested ' + event.payload.root : (event.payload.commands || []).map(command => command.type).join(', ')}</li>)}</ol></section></fieldset>}
  </main>;
}
