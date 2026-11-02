import React, { useEffect, useRef, useState } from 'react';
import { classifyEvent } from './model/event-cursor.js';
import ModellingCanvas from './ModellingCanvas.jsx';
import ValidationIssues from './ValidationIssues.jsx';
import PerspectivePanels from './PerspectivePanels.jsx';
import { projectView } from './model/project-view.js';
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
  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403 ? 'Authorization expired or was rejected. Reconnect or pair again.' : `Service returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const message = await response.json();
  if (message.error) throw new Error(message.error.message);
  if (message.result?.isError) throw new Error(message.result.content?.[0]?.text || 'Tool failed');
  return message.result;
}

function eventConcept(event) {
  if (event.payload.type === 'view_suggestion') return event.payload.root;
  for (const command of [...(event.payload.commands || [])].reverse()) {
    if (command.owner) return command.owner;
    if (command.className) return command.className;
    if (command.type === 'class.add' || command.type === 'class.describe') return command.name;
  }
  return null;
}

export default function ModellingStudio() {
  const [endpoint, setEndpoint] = useState(() => window.location.hostname === '127.0.0.1' && !['4173', '5173'].includes(window.location.port) ? window.location.origin : 'http://127.0.0.1:4317');
  const [token, setToken] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [connection, setConnection] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [canCreateWorkspace, setCanCreateWorkspace] = useState(false);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [workspaceBaseline, setWorkspaceBaseline] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const creationOperation = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [selected, setSelected] = useState(null);
  const [graph, setGraph] = useState(null);
  const [savedViewRevision, setSavedViewRevision] = useState(null);
  const [viewId, setViewId] = useState('default');
  const [viewIdInput, setViewIdInput] = useState('default');
  const [savedViews, setSavedViews] = useState([]);
  const [viewLoaded, setViewLoaded] = useState(false);
  const [viewGroups, setViewGroups] = useState([]);
  const [viewAnnotations, setViewAnnotations] = useState([]);
  const [viewMetadata, setViewMetadata] = useState({ mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information' });
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [viewNotice, setViewNotice] = useState('');
  const [hideNavigator, setHideNavigator] = useState(false);
  const [hideInspector, setHideInspector] = useState(false);
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
  const [historyDetail, setHistoryDetail] = useState(null);
  const [followSuggestions, setFollowSuggestions] = useState(false);
  const [followPaused, setFollowPaused] = useState(false);
  const followCursor = useRef(0);
  const followGeneration = useRef(0);
  const [readiness, setReadiness] = useState(null);
  const [publication, setPublication] = useState(null);
  const [publicationSubject, setPublicationSubject] = useState('');
  const [publicationBody, setPublicationBody] = useState('');
  const [publicationHistory, setPublicationHistory] = useState([]);
  const [canPush, setCanPush] = useState(false);
  const [commitSha, setCommitSha] = useState('');
  const [commitWorkflows, setCommitWorkflows] = useState(null);
  const [requiredChecks, setRequiredChecks] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewDecision, setReviewDecision] = useState('request_changes');
  const [reviewCase, setReviewCase] = useState({ requirementId: '', ruleId: '', caseId: '', start: '', end: '', expectedConformance: 'true', scenario: '' });
  const [definition, setDefinition] = useState('');
  const [rationale, setRationale] = useState('');
  const [changeSetIntent, setChangeSetIntent] = useState('');
  const [changeSetRequirements, setChangeSetRequirements] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [relationshipDraft, setRelationshipDraft] = useState(null);
  const [relationshipSubmitting, setRelationshipSubmitting] = useState(false);
  const [fieldEdit, setFieldEdit] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [online, setOnline] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [diagnosticMessage, setDiagnosticMessage] = useState('');
  const [connectionCopyMessage, setConnectionCopyMessage] = useState('');
  const [error, setError] = useState('');
  const cursor = useRef(0);
  const currentRevision = useRef(null);
  const searchInput = useRef(null);
  const relationshipOrigin = useRef(null);

  useEffect(() => {
    function shortcut(event) {
      const editing = event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable=true]');
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !editing && searchInput.current && !searchInput.current.disabled) {
        event.preventDefault(); searchInput.current.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

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
    let streamAbort = null;
    const refreshOnVisible = () => { if (document.visibilityState === 'visible' && streamAbort) { setOnline(false); streamAbort.abort(); } };
    document.addEventListener('visibilitychange', refreshOnVisible);
    const { endpoint: url, token: credential, workspaceId: id } = connection;
    const tool = async (name, args) => (await call(url, credential, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    async function refresh() {
      const value = await tool('ontology_workspace_get', { workspaceId: id });
      cursor.current = value.eventSequence;
      if (currentRevision.current !== value.revision) { setResults([]); setSearchDone(false); }
      currentRevision.current = value.revision;
      setSnapshot(value);
      setWorkspaceBaseline(previous => previous || value.baselineCommit);
      setDiff(null);
      setReadiness(null);
      const activity = await tool('ontology_history_get', { workspaceId: id });
      setHistory(activity.events);
      return value;
    }
    async function run() {
      try {
        const initialization = await call(url, credential, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'chargeweave-browser', version: '0.1.0' } }, abort.signal);
        if (initialization.protocolVersion !== '2025-06-18') throw new Error(`Unsupported MCP protocol ${initialization.protocolVersion ?? 'unknown'}; update the local service or studio.`);
        setServerInfo({ name: initialization.serverInfo?.name ?? 'unknown', version: initialization.serverInfo?.version ?? 'unknown', protocolVersion: initialization.protocolVersion ?? 'unknown' });
        const capabilities = await call(url, credential, 'tools/list', {}, abort.signal);
        setCanCreateWorkspace(capabilities.tools.some(item => item.name === 'ontology_workspace_create'));
        const listing = await tool('ontology_workspace_list', {});
        setWorkspaces(listing.workspaces);
        await refresh();
        setStatus('Connected');
        let delay = 500;
        let needsRefresh = false;
        while (!abort.signal.aborted) {
          try {
            if (needsRefresh) { await refresh(); needsRefresh = false; }
            streamAbort = new AbortController();
            const response = await fetch(`${url}/events?workspaceId=${encodeURIComponent(id)}&after=${cursor.current}`, { headers: authHeaders(credential), credentials: 'same-origin', signal: AbortSignal.any([abort.signal, streamAbort.signal]) });
            if (response.status === 401 || response.status === 403) { setOnline(false); setStatus('Authorization expired; reconnect'); setError('Authorization expired or was rejected. Reconnect or pair again.'); return; }
            if (!response.ok || !response.body) throw new Error(`Event feed returned ${response.status}`);
            setStatus('Connected');
            setOnline(true);
            delay = 500;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let heartbeatTimeout;
            const resetHeartbeat = () => { clearTimeout(heartbeatTimeout); heartbeatTimeout = setTimeout(() => streamAbort?.abort(), 45000); };
            resetHeartbeat();
            try {
            while (!abort.signal.aborted) {
              const { value, done } = await reader.read();
              if (done) throw new Error('Event stream closed');
              resetHeartbeat();
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
            } finally { clearTimeout(heartbeatTimeout); }
          } catch (problem) {
            if (abort.signal.aborted) break;
            setOnline(false);
            if (problem.status === 401 || problem.status === 403) { setStatus('Authorization expired; reconnect'); setError(problem.message); return; }
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
    return () => { document.removeEventListener('visibilitychange', refreshOnVisible); streamAbort?.abort(); abort.abort(); };
  }, [connection]);

  useEffect(() => {
    setSavedViewRevision(null); setViewLoaded(false); setViewNotice('');
    if (!connection) return undefined;
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_get', arguments: { workspaceId: connection.workspaceId, viewId } }, abort.signal)
      .then(response => { setSavedViewRevision(response.structuredContent.viewRevision); setViewLoaded(!response.structuredContent.definition); if (!response.structuredContent.definition) { setViewGroups([]); setViewAnnotations([]); setViewMetadata({ mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information' }); } })
      .catch(problem => { if (!abort.signal.aborted) setViewNotice(`Saved view unavailable: ${problem.message}`); });
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_list', arguments: { workspaceId: connection.workspaceId } }, abort.signal)
      .then(response => setSavedViews(response.structuredContent.views)).catch(() => {});
    return () => abort.abort();
  }, [connection, viewId]);

  useEffect(() => {
    if (!connection || !snapshot || !selected) { setGraph(null); return undefined; }
    const abort = new AbortController();
    const tool = async (name, args) => (await call(connection.endpoint, connection.token, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    (async () => {
        const args = { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision };
        const information = await tool('ontology_view_get', args);
        const viewpoint = viewMetadata.viewpoint ?? 'information';
        const perspective = viewpoint === 'information' ? null : await tool(viewpoint === 'responsibility' ? 'ontology_responsibility_view_get' : 'ontology_temporal_view_get', args);
        const value = await projectView(information, perspective, viewMetadata.filter, async name => (await tool('ontology_entity_get', { workspaceId: connection.workspaceId, name, expectedRevision: snapshot.revision })).entity);
        if (abort.signal.aborted || value.revision !== currentRevision.current) return;
        setGraph(value);
        const refreshed = value.nodes.find(item => item.name === value.root);
        if (refreshed) {
          setSelected(previous => previous?.name === refreshed.name ? refreshed : previous);
          setDefinition(draft => draft === selected.definition ? refreshed.definition : draft);
        }
      })()
      .catch(problem => { if (!abort.signal.aborted) setError(problem.message); });
    return () => abort.abort();
  }, [connection, snapshot?.revision, selected?.name, viewMetadata.viewpoint, viewMetadata.filter]);

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
  useEffect(() => { setRelationshipDraft(null); }, [connection]);
  useEffect(() => { setHistoryDetail(null); }, [connection]);
  useEffect(() => { setRationale(''); }, [connection]);

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
        return true;
      }
    } catch (problem) { setError(problem.message); }
    return false;
  }
  function pauseFollowing() {
    if (followSuggestions && !followPaused) {
      followGeneration.current += 1;
      setFollowPaused(true);
    }
  }
  useEffect(() => {
    if (!followSuggestions || followPaused || !connection || !snapshot) return;
    const pending = history.filter(event => event.sequence > followCursor.current && eventConcept(event));
    if (!pending.length) return;
    followCursor.current = Math.max(...pending.map(event => event.sequence));
    const latest = pending.filter(event => event.revision === snapshot.revision && event.payload.sourceDigest === snapshot.sourceDigest).at(-1);
    if (!latest) return;
    const active = document.activeElement;
    if (active?.matches('input:not([type=checkbox]), textarea, select, [contenteditable=true]')) { pauseFollowing(); return; }
    const generation = followGeneration.current;
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: eventConcept(latest), expectedRevision: snapshot.revision } })
      .then(response => {
        if (generation !== followGeneration.current || response.structuredContent.revision !== currentRevision.current) return;
        setSelected(response.structuredContent.entity);
        setDefinition(response.structuredContent.entity.definition);
      }).catch(problem => { if (generation === followGeneration.current) setError(problem.message); });
  }, [history, followSuggestions, followPaused, connection, snapshot]);
  function setFollowing(enabled) {
    followGeneration.current += 1;
    followCursor.current = cursor.current;
    setFollowSuggestions(enabled);
    setFollowPaused(false);
  }
  function resumeFollowing() {
    followGeneration.current += 1;
    followCursor.current = cursor.current;
    setFollowPaused(false);
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
  async function selectPerspectiveConcept(name) {
    pauseFollowing(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) {
        setSelected(response.structuredContent.entity);
        setDefinition(response.structuredContent.entity.definition);
        return true;
      }
    } catch (problem) { setError(problem.message); }
    return false;
  }
  async function saveLayout() {
    setViewNotice('');
    try {
      const positions = JSON.parse(sessionStorage.getItem(`chargeweave.canvas.v1.${connection.workspaceId}`) || '{}');
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_save', arguments: { workspaceId: connection.workspaceId, viewId, operationId: crypto.randomUUID(), expectedViewRevision: savedViewRevision, definition: { root: selected.name, positions, ...viewMetadata, groups: viewGroups, annotations: viewAnnotations } } });
      setSavedViewRevision(response.structuredContent.viewRevision); setViewNotice('Shared view saved.');
      const listing = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_list', arguments: { workspaceId: connection.workspaceId } }); setSavedViews(listing.structuredContent.views);
    } catch (problem) { setViewNotice(`Could not save view: ${problem.message}. Load the shared view to refresh its revision.`); }
  }
  async function loadLayout() {
    setViewNotice('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_get', arguments: { workspaceId: connection.workspaceId, viewId } });
      const saved = response.structuredContent; setSavedViewRevision(saved.viewRevision);
      if (!saved.definition) { setViewNotice('No shared view has been saved.'); return; }
      if (await selectPerspectiveConcept(saved.definition.root)) { sessionStorage.setItem(`chargeweave.canvas.v1.${connection.workspaceId}`, JSON.stringify(saved.definition.positions)); setViewGroups(saved.definition.groups ?? []); setViewAnnotations(saved.definition.annotations ?? []); setViewMetadata(Object.fromEntries(['mappingVersion', 'viewpoint', 'filter'].filter(key => Object.hasOwn(saved.definition, key)).map(key => [key, saved.definition[key]]))); setViewLoaded(true); setCanvasVersion(version => version + 1); setViewNotice('Shared view loaded.'); }
      else setViewNotice('The saved root is unavailable in the current draft.');
    } catch (problem) { setViewNotice(`Could not load view: ${problem.message}`); }
  }
  function openRelationshipAuthoring() {
    setHideInspector(false);
    requestAnimationFrame(() => {
      const details = document.getElementById('studio-add-field');
      if (details) { details.open = true; details.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); details.querySelector('input')?.focus(); }
    });
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
      if (response.structuredContent.revision === currentRevision.current) { setResults(response.structuredContent.results); setSearchDone(true); }
    } catch (problem) { setError(problem.message); }
  }
  async function saveDefinition(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'class.describe', name: selected.name, definition })) setSelected({ ...selected, definition });
  }
  async function applyCommand(command, expectedRevision = snapshot.revision) {
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_apply', arguments: {
        workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), ...(rationale.trim() ? { rationale: rationale.trim() } : {}), commands: [command],
      } });
      setStatus('Saved; awaiting workspace update');
      setRationale('');
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
  function startRelationship(source, target) {
    if (!source || !target || graph?.revision !== snapshot.revision) return;
    pauseFollowing();
    relationshipOrigin.current = document.activeElement;
    setRelationshipDraft({ source, target, name: '', description: '', cardinality: '?', revision: snapshot.revision });
  }
  function cancelRelationship() {
    setRelationshipDraft(null);
    requestAnimationFrame(() => relationshipOrigin.current?.focus?.());
  }
  async function addRelationship(event) {
    event.preventDefault();
    if (!relationshipDraft || relationshipSubmitting || relationshipDraft.revision !== snapshot.revision) return;
    const { source, target, name, description, cardinality, revision } = relationshipDraft;
    setRelationshipSubmitting(true);
    try {
      if (await applyCommand({ type: 'relationship.add', owner: source, name, range: target, cardinality, description }, revision)) setRelationshipDraft(null);
    } finally { setRelationshipSubmitting(false); }
  }
  async function undoLatest() {
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_undo', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), targetRevision: snapshot.revision } });
      setStatus('Saved; awaiting workspace update');
    } catch (problem) { setError(problem.message); }
  }
  async function openChangeSet(event) {
    event.preventDefault(); setError('');
    try {
      const requirements = changeSetRequirements.split(',').map(value => value.trim()).filter(Boolean);
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_open', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, intent: changeSetIntent.trim(), requirements } });
      setChangeSetIntent(''); setChangeSetRequirements('');
    } catch (problem) { setError(problem.message); }
  }
  async function reopenChangeSet() {
    setError('');
    try { await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_reopen', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, changeSetId: snapshot.changeSet.id } }); }
    catch (problem) { setError(problem.message); }
  }
  async function inspectHistory(revision) {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_history_detail', arguments: { workspaceId: connection.workspaceId, revision } });
      setHistoryDetail(response.structuredContent);
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
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_review', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), sourceDigest: snapshot.sourceDigest, decision: reviewDecision, reason: reviewReason } });
      setReviewReason('');
      const history = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_decisions', arguments: { workspaceId: connection.workspaceId } });
      setReviews(history.structuredContent.decisions);
    } catch (problem) { setError(problem.message); }
  }
  async function submitReviewCase(event) {
    event.preventDefault(); setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_reviewer_interval_case_add', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), ...reviewCase, expectedConformance: reviewCase.expectedConformance === 'true' } });
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
  async function inspectRequiredChecks() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_github_required_checks', arguments: { workspaceId: connection.workspaceId, commitSha } });
      setRequiredChecks(response.structuredContent);
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
    followGeneration.current += 1;
    setFollowSuggestions(false);
    setFollowPaused(false);
    setServerInfo(null);
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
  async function copyDiagnostics() {
    const bundle = { server: serverInfo, connection: status, online, workspaceId: connection?.workspaceId ?? null, revision: snapshot?.revision ?? null, eventCursor: cursor.current, job: job ? { profile: job.profile, status: job.status, revision: job.revision } : null };
    try { await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2)); setDiagnosticMessage('Redacted diagnostics copied.'); }
    catch { setDiagnosticMessage('Clipboard unavailable; the fields above can be copied manually.'); }
  }
  async function downloadEvidence() {
    setError('');
    try {
      const url = `${connection.endpoint}/api/jobs/${encodeURIComponent(job.id)}/artifacts/evidence.json?workspaceId=${encodeURIComponent(connection.workspaceId)}`;
      const response = await fetch(url, { headers: authHeaders(connection.token), credentials: 'same-origin' });
      if (!response.ok) throw new Error('Evidence is unavailable or authorization has expired.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = objectUrl; link.download = 'chargeweave-evidence.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (problem) { setError(problem.message); }
  }
  function switchWorkspace(id) {
    if (!connection || id === connection.workspaceId) return;
    followGeneration.current += 1; currentRevision.current = null; cursor.current = 0;
    setSnapshot(null); setSelected(null); setGraph(null); setEntityInfo(null); setTemporal(null); setResponsibility(null); setImpact(null);
    setResults([]); setSearchDone(false); setHistory([]); setHistoryDetail(null); setDiff(null); setJob(null); setReadiness(null); setReviews([]); setPublication(null); setPublicationHistory([]); setCommitWorkflows(null); setRequiredChecks(null); setRequirements([]); setViewId('default'); setViewIdInput('default'); setError('');
    setWorkspaceId(id); setConnection({ ...connection, workspaceId: id });
  }
  async function createWorkspace(event) {
    event.preventDefault(); setError(''); setCreatingWorkspace(true);
    const title = workspaceTitle.trim(), baselineCommit = workspaceBaseline.trim();
    const key = JSON.stringify({ title, baselineCommit });
    if (creationOperation.current?.key !== key) creationOperation.current = { key, id: crypto.randomUUID() };
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_workspace_create', arguments: { title, baselineCommit, operationId: creationOperation.current.id } });
      const created = response.structuredContent;
      setWorkspaces(current => [...current.filter(item => item.workspaceId !== created.workspaceId), created]);
      creationOperation.current = null; setWorkspaceTitle(''); switchWorkspace(created.workspaceId);
    } catch (problem) { setError(problem.message); } finally { setCreatingWorkspace(false); }
  }
  async function copyConnectionValue(value, label) {
    try { await navigator.clipboard.writeText(value); setConnectionCopyMessage(`${label} copied.`); }
    catch { setConnectionCopyMessage(`Clipboard unavailable; copy the ${label.toLowerCase()} shown below.`); }
  }
  const latestChange = history.filter(event => event.payload.commands?.length && eventConcept(event)).at(-1);
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
    {connection && <section><h2>Workspaces</h2><label>Current workspace <select value={connection.workspaceId} onChange={event => switchWorkspace(event.target.value)}>{workspaces.map(item => <option key={item.workspaceId} value={item.workspaceId}>{item.title}</option>)}</select></label>{canCreateWorkspace && <form onSubmit={createWorkspace}><label>New workspace title <input value={workspaceTitle} onChange={event => setWorkspaceTitle(event.target.value)} maxLength={120} required /></label><label>Baseline commit SHA <input value={workspaceBaseline} onChange={event => setWorkspaceBaseline(event.target.value)} pattern="[a-f0-9]{40}" required /></label><button disabled={creatingWorkspace}>{creatingWorkspace ? 'Creating workspace…' : 'Create workspace'}</button></form>}</section>}
    {connection && <><button type="button" onClick={disconnect}>Disconnect</button><p>Workspace ID: <code>{connection.workspaceId}</code> <button type="button" onClick={() => copyConnectionValue(connection.workspaceId, 'Workspace ID')}>Copy workspace ID</button></p><details><summary>Connect an MCP client</summary><p>Use this local endpoint and workspace ID with the separately configured draft token. The token is not included below.</p><pre>{`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`}</pre><button type="button" onClick={() => copyConnectionValue(`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`, 'Connection details')}>Copy connection details</button></details>{connectionCopyMessage && <p aria-live="polite">{connectionCopyMessage}</p>}</>}
    <details><summary>Connection diagnostics</summary><p>Connection: {status}; event stream: {online ? 'live' : 'not live'}.</p><p>Server: {serverInfo ? `${serverInfo.name} ${serverInfo.version}` : 'not initialized'}; negotiated MCP protocol: {serverInfo?.protocolVersion ?? 'unknown'}.</p><p>Workspace: {connection?.workspaceId ?? 'none'}; revision: {snapshot?.revision ?? 'unknown'}; last event cursor: {cursor.current}.</p><p>Latest job: {job ? `${job.profile}, ${job.status}, revision ${job.revision}` : 'none'}.</p><button type="button" onClick={copyDiagnostics}>Copy redacted diagnostics</button>{diagnosticMessage && <p aria-live="polite">{diagnosticMessage}</p>}<p>Reconnect by opening the local studio and pairing again. Diagnostics exclude credentials and check output.</p></details>
    {error && <p role="alert">{error}</p>}
    {snapshot && <fieldset className="studio-workspace" disabled={!online} onFocusCapture={event => { if (event.target.matches('input:not([type=checkbox]), textarea, select, [contenteditable=true]')) pauseFollowing(); }}><legend className="sr-only">Modelling workspace</legend><section className="studio-activity"><h2>Change set</h2>{snapshot.changeSet ? <><p>{snapshot.changeSet.intent} · {snapshot.changeSet.status} · <code>{snapshot.changeSet.id}</code></p><p>Requirement references: {snapshot.changeSet.requirements.join(', ') || 'none'}.</p>{['accepted', 'rejected'].includes(snapshot.changeSet.status) && <><p>Editing is locked until a reviewer reopens this change set. Reopening invalidates its acceptance.</p><button type="button" onClick={reopenChangeSet}>Reopen change set</button></>}{snapshot.changeSet.status === 'published' && <p>This change set was pushed. Start a new workspace from the reviewed target before another proposal.</p>}</> : <><p>Opening a change set records intent for the whole current draft, including any edits already made.</p><form onSubmit={openChangeSet}><label>Change-set intent <input value={changeSetIntent} onChange={event => setChangeSetIntent(event.target.value)} maxLength={1000} required /></label><label>Requirement IDs (comma separated, optional) <input value={changeSetRequirements} onChange={event => setChangeSetRequirements(event.target.value)} /></label><button>Open change set</button></form></>}</section><div className="studio-panel-controls"><button type="button" aria-pressed={!hideNavigator} onClick={() => setHideNavigator(!hideNavigator)}>{hideNavigator ? 'Show navigator' : 'Hide navigator'}</button><button type="button" aria-pressed={!hideInspector} onClick={() => setHideInspector(!hideInspector)}>{hideInspector ? 'Show inspector' : 'Hide inspector'}</button></div><div className="studio-panels" data-hide-navigator={hideNavigator} data-hide-inspector={hideInspector}>
      <section hidden={hideNavigator}><h2>Discover concepts</h2><form onSubmit={search}><label>Search model <input ref={searchInput} value={query} onChange={event => setQuery(event.target.value)} /></label><button>Search</button></form>
        {searchDone && !results.length && <p>No matching concepts. Try a shorter or related term before creating a concept.</p>}<ul>{results.map(item => <li key={item.name}><button type="button" onClick={() => { pauseFollowing(); setSelected(item); setDefinition(item.definition); }}>{item.name}</button> <small>Class · {item.module}</small><p>{item.definition}</p></li>)}</ul></section>
      <section><h2>Workspace</h2><p>{snapshot.title}</p><label>Reason for next edit (optional) <input value={rationale} maxLength={2000} onChange={event => setRationale(event.target.value)} /></label><p>The reason is recorded with the next submitted ontology edit.</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision shown above. Search again to refresh results.</p>{graph && <div className="studio-graph"><h3>Concept neighbourhood</h3><p>Selected: <strong>{graph.root}</strong></p><label>Graph viewpoint <select value={viewMetadata.viewpoint ?? 'information'} onChange={event => setViewMetadata({ ...viewMetadata, viewpoint: event.target.value })}><option value="information">Information</option><option value="responsibility">Responsibility</option><option value="temporal">Temporal</option></select></label><label>Filter graph relationships <input value={viewMetadata.filter ?? ''} maxLength={200} onChange={event => setViewMetadata({ ...viewMetadata, filter: event.target.value })} /></label><p>Filters and viewpoints affect presentation only. Responsibility uses explicit mappings; temporal edges show explicit window references.</p><>{(graph.revision !== snapshot.revision || graph.root !== selected?.name || graph.viewpoint !== (viewMetadata.viewpoint ?? 'information')) && <p aria-live="polite">Updating graph for the current selection and revision.</p>}<ModellingCanvas key={`${graph.workspaceId}-${canvasVersion}`} graph={graph} onManualInteraction={pauseFollowing} onConnect={({ source, target }) => startRelationship(source, target)} onSelect={item => { setSelected(item); setDefinition(item.definition); }} /></><p>Shared view: <strong>{viewId}</strong>; revision: {savedViewRevision ?? 'loading'}.</p><label>View ID <input value={viewIdInput} onChange={event => setViewIdInput(event.target.value)} maxLength={64} /></label><button type="button" disabled={!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(viewIdInput)} onClick={() => setViewId(viewIdInput)}>Choose view ID</button>{savedViews.length > 0 && <label>Existing shared views <select value={savedViews.some(view => view.viewId === viewId) ? viewId : ''} onChange={event => { if (event.target.value) { setViewId(event.target.value); setViewIdInput(event.target.value); } }}><option value="">Choose saved view</option>{savedViews.map(view => <option key={view.viewId} value={view.viewId}>{view.viewId} (revision {view.viewRevision})</option>)}</select></label>}{savedViewRevision > 0 && !viewLoaded && <p>Load this view before saving so its notes and groups are preserved.</p>}<details><summary>View groups and annotations</summary><p>These are presentation notes, not ontology relationships.</p><label>Group name <input value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={100} /></label><label>Group concepts (comma separated) <input value={groupMembers} onChange={event => setGroupMembers(event.target.value)} /></label><button type="button" disabled={!groupName.trim() || !groupMembers.trim()} onClick={() => { setViewGroups([...viewGroups, { name: groupName.trim(), members: groupMembers.split(',').map(name => name.trim()).filter(Boolean) }]); setGroupName(''); setGroupMembers(''); }}>Add view group</button><ul>{viewGroups.map((group, index) => <li key={`${group.name}-${index}`}>{group.name}: {group.members.join(', ')} <button type="button" onClick={() => setViewGroups(viewGroups.filter((_, i) => i !== index))}>Remove group {group.name}</button></li>)}</ul><label>Note for selected concept <textarea value={annotationText} onChange={event => setAnnotationText(event.target.value)} maxLength={1000} /></label><button type="button" disabled={!annotationText.trim()} onClick={() => { setViewAnnotations([...viewAnnotations, { target: selected.name, text: annotationText.trim() }]); setAnnotationText(''); }}>Add view note</button><ul>{viewAnnotations.map((note, index) => <li key={`${note.target}-${index}`}>{note.target}: {note.text} <button type="button" onClick={() => setViewAnnotations(viewAnnotations.filter((_, i) => i !== index))}>Remove note {index + 1}</button></li>)}</ul></details><button type="button" disabled={savedViewRevision === null || !viewLoaded || graph.root !== selected?.name} onClick={saveLayout}>Save shared view</button><button type="button" disabled={savedViewRevision === null} onClick={loadLayout}>Load shared view</button>{viewNotice && <p aria-live="polite">{viewNotice}</p>}{graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.predicate} → </span><button type="button" onClick={() => { pauseFollowing(); const node = graph.nodes.find(item => item.name === edge.target); setSelected(node); setDefinition(node.definition); }}>{edge.target}</button> <small>{edge.cardinality ? ' (' + edge.cardinality + ')' : ''} · {edge.changeStatus} · {edge.sourceRef.path}:{edge.sourceRef.line}</small></li>)}</ul> : <p>{graph.omitted > 0 ? 'No relationships match the current view.' : 'No explicit class relationships in this view.'}</p>}{graph.omitted > 0 && <p>{graph.omitted} relationships omitted.</p>}<details><summary>Create a relationship using the keyboard</summary><p>Select a target from this neighbourhood.</p>{graph.nodes.filter(node => node.name !== graph.root).map(node => <button type="button" key={node.name} onClick={() => startRelationship(graph.root, node.name)}>Relate {graph.root} to {node.name}</button>)}</details>{relationshipDraft && <form onSubmit={addRelationship} aria-label="New relationship" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancelRelationship(); } }}><h4>New relationship</h4><p>{relationshipDraft.source} → {relationshipDraft.target}</p><p>Opening or cancelling this form does not change the model.</p><label>Predicate name <input value={relationshipDraft.name} onChange={event => setRelationshipDraft({ ...relationshipDraft, name: event.target.value })} pattern="[A-Za-z][A-Za-z0-9]*" maxLength={128} required /></label><label>Relationship description <textarea value={relationshipDraft.description} onChange={event => setRelationshipDraft({ ...relationshipDraft, description: event.target.value })} maxLength={4000} required /></label><label>Relationship cardinality <select value={relationshipDraft.cardinality} onChange={event => setRelationshipDraft({ ...relationshipDraft, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label>{relationshipDraft.revision !== snapshot.revision && <p role="alert">The draft changed. Cancel and start this relationship again.</p>}<button disabled={relationshipSubmitting || relationshipDraft.revision !== snapshot.revision}>Create relationship</button><button type="button" onClick={cancelRelationship}>Cancel relationship</button></form>}</div>}<details><summary>Add a concept</summary><form onSubmit={addClass}><label>Class name <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required /></label><label>Module <input value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required /></label><label>Parent class <input value={newClass.parent} onChange={e => setNewClass({ ...newClass, parent: e.target.value })} required /></label><label>Class definition <textarea value={newClass.definition} onChange={e => setNewClass({ ...newClass, definition: e.target.value })} required /></label><button>Add concept</button></form></details><button type="button" onClick={() => runChecks('structural')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run reference checks</button><button type="button" onClick={() => runChecks('audit')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run independent audit</button><button type="button" onClick={() => runChecks('maintenance-demo')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run maintenance fixtures</button><button type="button" onClick={() => runChecks('acceptance')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run release gates</button>{job && <div>{['queued', 'running'].includes(job.status) && <button type="button" onClick={cancelCheck}>Cancel check</button>}{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest || job.revision !== snapshot.revision ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.steps?.length > 0 && <ul>{job.steps.map(step => <li key={step.ordinal}>{step.checkName}: {step.status}</li>)}</ul>} {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={inspectChanges}>Inspect changes</button>{diff && <div><h3>Changes at revision {diff.revision}</h3>{diff.changes.length ? <ul>{diff.changes.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.after && <button type="button" onClick={() => selectPerspectiveConcept(item.name)}>Focus changed {item.name}</button>}{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}{item.fieldChanges?.length > 0 && <ul>{item.fieldChanges.map(change => <li key={change.name}>{change.name}: {change.compatibility}{change.compatibility === 'potentially-breaking' ? ' — existing data or consumers may need migration and new tests' : ''}</li>)}</ul>}</li>)}</ul> : <p>{diff.additionalSources?.length ? 'No schema changes; additional source changes are shown below.' : 'No changes from the baseline.'}</p>}<details open><summary>Source patch</summary><pre>{diff.source.patch}</pre></details><details><summary>Source before and after</summary><h4>Before</h4><pre>{diff.source.before}</pre><h4>After</h4><pre>{diff.source.after}</pre></details>{diff.additionalSources?.map(source => <details key={source.path} open><summary>Source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}</div>}</section>
      <section hidden={hideInspector}><h2>Inspector</h2>{selected ? <><h3>{selected.name}</h3><form onSubmit={saveDefinition}><label>Definition <textarea value={definition} onChange={event => setDefinition(event.target.value)} maxLength={4000} required /></label><button disabled={definition === selected.definition}>Save definition</button><button type="button" onClick={() => setDefinition(selected.definition)}>Cancel</button></form><p>Parent: {selected.parent}</p>{entityInfo && <><p>IRI: <code>{entityInfo.iri}</code></p><p>Source: {entityInfo.source.path}:{entityInfo.source.line}</p><h4>Fields</h4>{entityInfo.fields.length ? <ul>{entityInfo.fields.map((item, index) => <li key={index}>{item.property}: {item.range} ({item.cardinality}){item.description && <span> — {item.description}</span>} — {item.inherited ? 'inherited from ' + item.owner : 'declared'} <small>{item.source.path}:{item.source.line}</small>{!item.inherited && <button type="button" onClick={() => startFieldEdit(item)}>Edit {item.property}</button>}{!item.inherited && item.type === 'object' && ['?', '*'].includes(item.cardinality) && <button type="button" title="Requiring a relationship may break existing data." onClick={() => applyCommand({ type: 'constraint.add', template: 'required-relationship', owner: selected.name, name: item.property, expectedRange: item.range, expectedCardinality: item.cardinality })}>Require {item.property}</button>}</li>)}</ul> : <p>No fields.</p>}</>}<details id="studio-add-field"><summary>Add a field or relationship</summary><form onSubmit={addField}><label>Field name <input value={field.name} onChange={e => setField({ ...field, name: e.target.value })} required /></label><p>Use a datatype, class name, or controlled values such as &#123;Draft,Confirmed,Cancelled&#125;.</p><label>Datatype or target class <input value={field.range} onChange={e => setField({ ...field, range: e.target.value })} required /></label><label>Cardinality <select value={field.cardinality} onChange={e => setField({ ...field, cardinality: e.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Add field</button></form></details></> : <p>Select a concept to inspect it.</p>}</section>
    </div>
    {fieldEdit && selected && <section className="studio-activity"><h2>Edit field contract</h2><p>Changing a range or tightening cardinality can break existing data and consumers. Review affected requirements and rerun checks.</p><p>Current contract: {fieldEdit.name}: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}).</p><form onSubmit={updateField}><label>New datatype or target class <input value={fieldEdit.range} onChange={event => setFieldEdit({ ...fieldEdit, range: event.target.value })} required /></label><label>New cardinality <select value={fieldEdit.cardinality} onChange={event => setFieldEdit({ ...fieldEdit, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button>Update field contract</button><button type="button" onClick={() => setFieldEdit(null)}>Cancel field edit</button></form></section>}
    <PerspectivePanels selected={selected} snapshot={snapshot} entityInfo={entityInfo} responsibility={responsibility} temporal={temporal} temporalPolicy={temporalPolicy} setTemporalPolicy={setTemporalPolicy} inspectResponsibility={inspectResponsibility} inspectTemporal={inspectTemporal} saveTemporalPolicy={saveTemporalPolicy} selectConcept={selectPerspectiveConcept} addRelationship={openRelationshipAuthoring} addBinding={applyCommand} />
    <section className="studio-activity"><h2>Requirement links</h2>{snapshot.digestVersion === 4 ? <><p>Linking a concept records a relationship in the requirement register; it does not prove coverage or acceptance.</p><form onSubmit={searchRequirements}><label>Search requirements <input value={requirementQuery} onChange={event => setRequirementQuery(event.target.value)} /></label><button>Search requirements</button></form><ul>{requirements.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <button type="button" disabled={!selected || item.classes.includes(selected.name)} onClick={() => linkRequirement(item)}>Link selected concept</button>{selected && item.classes.includes(selected.name) && ['model/audit-rules.json', 'model/authoring-example-overrides.json', 'tests/business-acceptance.json', 'tests/negative-cases.json'].every(path => snapshot.editableSources?.includes(path)) && <details><summary>Add interval rule for {item.id}</summary><p>Only a new class with two new, declared date-time fields is supported. The generated cases are draft examples and require independent review.</p><form onSubmit={event => addIntervalRule(event, item)}><label>Interval start <select value={intervalRule.startProperty} onChange={event => setIntervalRule({ ...intervalRule, startProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>Interval end <select value={intervalRule.endProperty} onChange={event => setIntervalRule({ ...intervalRule, endProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>New rule ID <input value={intervalRule.ruleId} onChange={event => setIntervalRule({ ...intervalRule, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><button>Add interval constraint</button></form></details>}</li>)}</ul></> : <p>Create a version-four workspace to edit requirement links.</p>}</section>
    <ValidationIssues job={job} snapshot={snapshot} onRetry={runChecks} onFocusConcept={selectPerspectiveConcept} />
    {job && ['passed', 'failed', 'cancelled', 'interrupted'].includes(job.status) && <button type="button" onClick={downloadEvidence}>Download evidence report</button>}
    <section className="studio-activity"><h2>Change impact</h2><button type="button" onClick={inspectImpact}>Inspect explicit impact references</button>{impact && impact.revision === snapshot.revision && <><p>{impact.note}</p><p>Changed classes: {impact.changedClasses.join(', ') || 'none'}; changed properties: {impact.changedProperties.join(', ') || 'none'}.</p>{impact.references.length ? <ul>{impact.references.map(item => <li key={`${item.kind}-${item.id}`}>{item.kind} {item.id}: {item.title} · {item.source} · references {item.terms.join(', ')}</li>)}</ul> : <p>No indexed baseline references matched.</p>}{impact.omitted > 0 && <p>{impact.omitted} additional references omitted.</p>}</>}</section>
    {job?.artifactSummary && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) && <section className="studio-activity"><h2>Generated artifact comparison</h2><p>Revision {job.revision} · {job.artifactSummary.changedCount} files differ in exact bytes{job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' · stale' : ''}.</p><p>{job.artifactSummary.note}</p><p>Baseline manifest: <code>{job.artifactSummary.baselineManifestSha256}</code>; candidate manifest: <code>{job.artifactSummary.candidateManifestSha256}</code>.</p>{job.artifactSummary.changes.length > 0 && <ul>{job.artifactSummary.changes.map(item => <li key={item.path}>{item.kind}: {item.path}</li>)}</ul>}{job.artifactSummary.omitted > 0 && <p>{job.artifactSummary.omitted} additional changes omitted.</p>}</section>}
    <section className="studio-activity"><h2>Suggested views</h2><p>Suggestions never change the model. Follow new changes and suggestions to select their concepts automatically; your interaction pauses following.</p><label><input type="checkbox" checked={followSuggestions} onChange={event => setFollowing(event.target.checked)} /> Follow new changes and suggestions</label>{followSuggestions && <p aria-live="polite">{followPaused ? 'Following paused after interaction.' : 'Following new changes and suggestions.'}</p>}{followSuggestions && followPaused && <button type="button" onClick={resumeFollowing}>Resume following</button>}<ul>{history.filter(event => event.payload.type === 'view_suggestion').slice(-10).reverse().map(event => <li key={event.sequence}><strong>{event.payload.root}</strong> · {event.payload.viewpoint} · {event.actor} · revision {event.revision}<p>{event.payload.explanation}</p><button type="button" disabled={event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest} onClick={() => { pauseFollowing(); focusSuggestion(event); }}>Focus {event.payload.root}</button>{(event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest) && <small> Suggestion refers to an older draft.</small>}</li>)}</ul></section>
    <section className="studio-activity"><h2>Publication preflight</h2><p>Check the target and available evidence before review. Publication requires a current review and explicit publisher permission.</p><button type="button" onClick={inspectPublication}>Check publication target</button>{publication && publication.revision === snapshot.revision && <><p>Target: {publication.target.repository} · {publication.target.branch} · {publication.target.status}.</p><p>Baseline: <code>{publication.baselineCommit}</code>; target head: <code>{publication.target.head ?? 'unavailable'}</code>.</p><p>Changed source files: {publication.sourceFiles.join(', ') || 'none'}.</p>{publication.comparison && <><p>Remote comparison: {publication.comparison.status}. {publication.comparison.note}</p><p>Overlapping files: {publication.comparison.overlap.join(', ') || 'none identified'}.</p><details><summary>Files changed on target</summary><ul>{publication.comparison.changedFiles.map(path => <li key={path}>{path}</li>)}</ul></details></>}<p>Generated comparison: {publication.generatedEvidence ? `${publication.generatedEvidence.summary.changedCount} byte-different files from ${publication.generatedEvidence.profile} checks` : 'not available for this revision'}.</p><ul>{publication.limitations.map(item => <li key={item}>{item}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Prepare reviewed candidate</h2><p>Stage the exact accepted source and generated files in a disposable checkout. This does not publish or recheck the remote.</p><button type="button" disabled={!reviews[0] || reviews[0].decision !== 'accept' || reviews[0].revision !== snapshot.revision || reviews[0].sourceDigest !== snapshot.sourceDigest || Boolean(snapshot.changeSet && (snapshot.changeSet.status !== 'accepted' || snapshot.changeSet.reviewId !== reviews[0].id))} onClick={() => preparePublication(reviews[0].id)}>Prepare staged preview</button>{job?.profile === 'publication-preview' && <><p>Preview: {job.status}{job.stale ? ' ? stale' : ''}.</p>{job.output && <pre>{job.output}</pre>}{job.artifactSummary?.files && <><p>{job.artifactSummary.note}</p><ul>{job.artifactSummary.files.map(file => <li key={file.path}>{file.kind}: {file.path} ? {file.sha256 ?? 'removed'}</li>)}</ul><form onSubmit={reservePublication}><label>Commit subject <input value={publicationSubject} onChange={event => setPublicationSubject(event.target.value)} maxLength={120} required /></label><label>Commit description <textarea value={publicationBody} onChange={event => setPublicationBody(event.target.value)} maxLength={10000} required /></label><button disabled={job.stale}>Save publication intent</button></form></>}</>}</section>
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
    <section className="studio-activity"><h2>Required status checks</h2><p>Use the commit SHA above. Missing policy access or incomplete results remain unknown.</p><button type="button" onClick={inspectRequiredChecks}>Check required status checks</button>{requiredChecks && <><p>Commit <code>{requiredChecks.sha}</code>: {requiredChecks.status}. {requiredChecks.note}</p><ul>{requiredChecks.checks.map(check => <li key={`${check.context}-${check.appId}`}>{check.context}: {check.status}{check.appId != null && ` (app ${check.appId})`}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Reviewer interval case</h2><p>Write a separate synthetic example and expected outcome. Review whether it is independent and relevant; saving it does not run validation.</p><form onSubmit={submitReviewCase}><label>Requirement ID <input value={reviewCase.requirementId} onChange={event => setReviewCase({ ...reviewCase, requirementId: event.target.value })} pattern="BR-[0-9]+" required /></label><label>Rule ID <input value={reviewCase.ruleId} onChange={event => setReviewCase({ ...reviewCase, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><label>Unique case ID <input value={reviewCase.caseId} onChange={event => setReviewCase({ ...reviewCase, caseId: event.target.value })} pattern="[A-Za-z0-9][A-Za-z0-9-]*" maxLength={128} required /></label><label>Start (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.start} onChange={event => setReviewCase({ ...reviewCase, start: event.target.value })} required /></label><label>End (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.end} onChange={event => setReviewCase({ ...reviewCase, end: event.target.value })} required /></label><label>Expected outcome <select value={reviewCase.expectedConformance} onChange={event => setReviewCase({ ...reviewCase, expectedConformance: event.target.value })}><option value="true">Conforms</option><option value="false">Violates rule</option></select></label><label>Business scenario and expected result <textarea value={reviewCase.scenario} onChange={event => setReviewCase({ ...reviewCase, scenario: event.target.value })} minLength={12} maxLength={1000} required /></label><button>Save reviewer case</button></form></section>
    <section className="studio-activity"><h2>Reviewer decision</h2><p>Acceptance records a reviewer decision for this exact draft; it does not publish or establish business completeness. A rejection does not erase the draft.</p><form onSubmit={submitReview}><label>Decision <select value={reviewDecision} onChange={event => setReviewDecision(event.target.value)}><option value="request_changes">Request changes</option><option value="reject">Reject draft</option><option value="accept">Accept draft</option></select></label><label>Reason <textarea value={reviewReason} onChange={event => setReviewReason(event.target.value)} maxLength={4000} required /></label><button>Record reviewer decision</button></form>{reviews.length > 0 && <ol>{reviews.map(review => <li key={review.id}>{review.decision === 'reject' ? 'Rejected' : review.decision === 'accept' ? 'Accepted' : 'Changes requested'} · revision {review.revision} · {review.actor} · {review.revision !== snapshot.revision || review.sourceDigest !== snapshot.sourceDigest || Boolean(review.decision === 'accept' && snapshot.changeSet && (snapshot.changeSet.reviewId !== review.id || !['accepted', 'published'].includes(snapshot.changeSet.status))) ? 'stale' : 'current'}<p>{review.reason}</p></li>)}</ol>}</section>
    <section className="studio-activity"><h2>Review readiness</h2><button type="button" onClick={inspectReadiness}>Inspect review gates</button>{readiness && <><p>Revision {readiness.revision}, digest <code>{readiness.sourceDigest}</code></p><p>{readiness.canAccept ? 'Ready for a reviewer decision.' : 'Review gates are incomplete.'} {readiness.note}</p><ul>{readiness.evidence.map(item => <li key={item.profile}>{item.profile}: {item.job ? `${item.job.status} at revision ${item.job.revision}` : 'not run for this draft'}</li>)}</ul><ul>{readiness.missing.map(item => <li key={item}>Missing: {item}</li>)}</ul></>}<h2>Activity</h2>{latestChange && <p>Latest change: {latestChange.actor} updated {eventConcept(latestChange)} at revision {latestChange.revision}. <button type="button" onClick={() => selectPerspectiveConcept(eventConcept(latestChange))}>Show latest change</button></p>}<button type="button" onClick={undoLatest} disabled={!snapshot.revision || history.at(-1)?.payload?.type === 'undo'}>Undo latest command group</button><ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.createdAt ?? 'time not recorded'} · {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : event.payload.type === 'review' ? event.payload.decision : event.payload.type === 'publication' ? `publication ${event.payload.state}` : event.payload.type === 'view_suggestion' ? 'suggested ' + event.payload.root : event.payload.type === 'changeset_opened' ? 'opened change set: ' + event.payload.intent : event.payload.type === 'changeset_reopened' ? 'reopened change set' : (event.payload.commands || []).map(command => command.type).join(', ')}{event.payload.rationale && <p>Reason: {event.payload.rationale}</p>}{event.payload.commands?.length > 0 && <button type="button" onClick={() => inspectHistory(event.revision)}>Inspect revision {event.revision}</button>}</li>)}</ol>{historyDetail && <section aria-label="Historical comparison"><h3>Historical revision {historyDetail.revision}</h3><p>Read-only comparison; the current draft is unchanged.</p>{historyDetail.available ? <><p>Actor: {historyDetail.actor}; source digest: <code>{historyDetail.sourceDigest}</code>.</p>{historyDetail.commandGroupId && <p>Command group: <code>{historyDetail.commandGroupId}</code>; operation: <code>{historyDetail.operationId}</code>.</p>}{historyDetail.rationale && <p>Reason: {historyDetail.rationale}</p>}<details open><summary>Command group patch</summary><pre>{historyDetail.patch}</pre></details><details><summary>Compare historical revision with baseline</summary><pre>{historyDetail.baselinePatch}</pre></details>{historyDetail.additionalSources.map(source => <details key={source.path}><summary>Historical source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}</> : <p>{historyDetail.reason}</p>}<button type="button" onClick={() => setHistoryDetail(null)}>Return to current draft</button></section>}</section></fieldset>}
  </main>;
}
