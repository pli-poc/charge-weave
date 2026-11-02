import React, { useEffect, useRef, useState } from 'react';
import { classifyEvent } from './model/event-cursor.js';
import ModellingCanvas from './ModellingCanvas.jsx';
import WorkspaceDock from './WorkspaceDock.jsx';
import PerspectivePanels from './PerspectivePanels.jsx';
import StudioThemeControl from './StudioThemeControl.jsx';
import AllowedValuesEditor from './AllowedValuesEditor.jsx';
import { projectView } from './model/project-view.js';
import { mergeIncoming } from './model/incoming-view.js';
import { canvasPositionKey, readCanvasPositions, writeCanvasPositions } from './model/canvas-positions.js';
import './modelling-studio.css';

function BrowseConceptRow({ item, selectedName, onSelect, onOpen, connection, revision, expanded, onToggle }) {
  const [loaded, setLoaded] = useState(null);
  const [failure, setFailure] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!expanded) return undefined;
    const controller = new AbortController();
    setLoaded(null); setFailure('');
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: item.name, expectedRevision: revision } }, controller.signal)
      .then(result => {
        if (!controller.signal.aborted && result.structuredContent.revision === revision) setLoaded({ revision, workspaceId: connection.workspaceId, entity: result.structuredContent.entity });
      })
      .catch(error => { if (!controller.signal.aborted) setFailure(error.message); });
    return () => controller.abort();
  }, [expanded, connection.endpoint, connection.token, connection.workspaceId, item.name, revision, retry]);
  const entity = loaded?.revision === revision && loaded.workspaceId === connection.workspaceId ? loaded.entity : null;
  const fields = entity?.fields || [];
  const declared = fields.filter(field => !field.inherited);
  const inherited = fields.filter(field => field.inherited);
  const fieldList = entries => <ul>{entries.map((field, index) => <li key={`${field.owner}-${field.property}-${index}`}><span>{field.property}</span> <small>{field.range} · {cardinalityLabels[field.cardinality] ?? field.cardinality}{field.inherited ? ` · from ${field.owner}` : ''}</small></li>)}</ul>;
  return <li><div className="studio-explorer-concept"><button type="button" className="studio-explorer-expand" aria-label={`${expanded ? 'Hide' : 'Show'} fields for ${item.name}`} aria-expanded={expanded} onClick={() => onToggle(item.name)}>{expanded ? '−' : '+'}</button><button type="button" title="Select to inspect; double-click or press Enter to focus its neighbourhood" aria-current={item.name === selectedName ? 'true' : undefined} onClick={() => onSelect(item)} onDoubleClick={() => onOpen(item)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onOpen(item); } }}>{item.name}</button></div>
    {expanded && <div className="studio-explorer-fields">{failure ? <><p role="status">Fields unavailable: {failure}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry fields for {item.name}</button></> : !entity ? <p role="status">Loading fields for {item.name}…</p> : <><p>Declared fields</p>{declared.length ? fieldList(declared) : <p>No declared fields.</p>}{inherited.length > 0 && <details><summary>Inherited fields ({inherited.length})</summary>{fieldList(inherited)}</details>}</>}</div>}
  </li>;
}

function BrowseConceptTree({ browse, selectedName, onSelect, onOpen, onBrowseModule, pending, connection, revision, expandedNames, onToggle }) {
  const groups = new Map();
  for (const item of browse.results) {
    if (!groups.has(item.module)) groups.set(item.module, []);
    groups.get(item.module).push(item);
  }
  return <ul className="studio-module-tree" aria-label="Loaded concepts by module">{browse.modules.map(({ name: module, count }) => <li key={module}>
    <details open={groups.has(module)}><summary>{module} <span>({groups.get(module)?.length || 0} of {count} loaded)</span></summary>
      <button type="button" disabled={pending} onClick={() => onBrowseModule(module)}>Browse {module}</button>
      <ul>{(groups.get(module) || []).map(item => <BrowseConceptRow key={item.name} item={item} selectedName={selectedName} onSelect={onSelect} onOpen={onOpen} connection={connection} revision={revision} expanded={expandedNames.includes(item.name)} onToggle={onToggle} />)}</ul>
    </details>
  </li>)}</ul>;
}

function RequirementExplorer({ connection, snapshot, selected, available, canLink, commandPending, onInspect, onLink }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const request = useRef(0);
  const controller = useRef(null);
  useEffect(() => {
    request.current += 1; controller.current?.abort(); setResult(null); setPending(false); setFailure('');
    return () => controller.current?.abort();
  }, [connection, snapshot.revision, snapshot.sourceDigest]);
  const current = result && result.workspaceId === snapshot.workspaceId && result.revision === snapshot.revision && result.sourceDigest === snapshot.sourceDigest && result.query === query;
  async function search(event) {
    event.preventDefault();
    const sequence = ++request.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setResult(null); setFailure('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_requirement_search', arguments: { workspaceId: snapshot.workspaceId, expectedRevision: snapshot.revision, query, limit: 20 } }, abort.signal);
      const value = response.structuredContent;
      if (!abort.signal.aborted && sequence === request.current && value.workspaceId === snapshot.workspaceId && value.revision === snapshot.revision && value.sourceDigest === snapshot.sourceDigest) setResult({ ...value, query });
    } catch (problem) { if (!abort.signal.aborted && sequence === request.current) setFailure(problem.message); }
    finally { if (!abort.signal.aborted && sequence === request.current) setPending(false); }
  }
  return <details className="studio-requirement-explorer"><summary>Requirements</summary>
    <p>Search the existing requirement register. A recorded link does not establish coverage or acceptance.</p>
    {!available || snapshot.digestVersion !== 4 ? <p>Requirement search is unavailable for this workspace or connection.</p> : <><form onSubmit={search}><label>Find requirements <input value={query} maxLength={200} onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setFailure(''); setQuery(event.target.value); }} /></label><button type="submit" disabled={pending}>Find requirements</button></form>
      {pending && <p role="status">Searching requirements…</p>}{failure && <p role="status">Requirement search unavailable: {failure}</p>}
      {current && <><p aria-live="polite">{result.results.length} matches shown; search returns up to 20. Refine the query to explore further.</p>{!canLink && <p>Linking is unavailable for this workspace, role or change-set state.</p>}{result.results.length ? <ul>{result.results.map(item => <li key={item.id}><strong>{item.id}</strong><p>{item.statement}</p><p>Linked concepts: {item.classes.length ? item.classes.join(', ') : 'none recorded'}.</p>{item.classes.map(name => <button key={name} type="button" onClick={() => onInspect(name)}>Inspect {name}</button>)}<button type="button" disabled={!canLink || !selected || commandPending || item.classes.includes(selected.name)} onClick={() => onLink(item)}>{selected && item.classes.includes(selected.name) ? `Linked to ${selected.name}` : selected ? `Link ${selected.name}` : 'Select a concept to link'}</button></li>)}</ul> : <p>No requirements match this search.</p>}</>}
    </>}
  </details>;
}

const relationshipCardinalities = { '!': '1', '?': '0..1', '+': '1..*', '*': '0..*' };
function RelationshipList({ graph, onSelect }) {
  return <div className="studio-relationship-list" role="region" aria-label={`Relationship list for ${graph.root}`}>
    {graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.source === graph.root ? edge.predicate + ' → ' : '← ' + edge.predicate + ' from '}</span><button type="button" onClick={() => { const name = edge.source === graph.root ? edge.target : edge.source; onSelect(graph.nodes.find(item => item.name === name)); }}>{edge.source === graph.root ? edge.target : edge.source}</button> <small>{edge.cardinality ? ' (' + (relationshipCardinalities[edge.cardinality] ?? edge.cardinality) + ')' : ''} · {edge.changeStatus} · {edge.sourceRef.path}:{edge.sourceRef.line}</small></li>)}</ul> : <p>{graph.omitted > 0 ? 'No relationships match the current view.' : 'No explicit class relationships in this view.'}</p>}
  </div>;
}

function ReviewWorkflow({ snapshot, canReview, publisherAvailable, diff, readiness, reviews, decisionsLoaded, publication, canPush, commitWorkflows, onInspect, onChecks, onGo }) {
  const comparison = !diff ? 'Comparison not opened' : diff.revision === snapshot.revision && diff.sourceDigest === snapshot.sourceDigest ? `Comparison current at revision ${diff.revision}` : `Comparison out of date (revision ${diff.revision})`;
  const gates = !readiness || readiness.revision !== snapshot.revision || readiness.sourceDigest !== snapshot.sourceDigest ? 'Review gates not inspected for this draft' : readiness.canAccept ? 'Last inspection: review gates complete for this draft' : `Last inspection: review gates incomplete: ${readiness.missing.length} missing`;
  const latestReview = decisionsLoaded ? reviews[0] : null;
  const reviewCurrent = latestReview && latestReview.revision === snapshot.revision && latestReview.sourceDigest === snapshot.sourceDigest && latestReview.baselineCommit === snapshot.baselineCommit && !(latestReview.decision === 'accept' && snapshot.changeSet && (snapshot.changeSet.reviewId !== latestReview.id || !['accepted', 'published'].includes(snapshot.changeSet.status)));
  const decision = latestReview ? `Latest decision: ${latestReview.decision} · revision ${latestReview.revision} · ${reviewCurrent ? 'current' : 'out of date'}` : decisionsLoaded ? 'No decision returned' : 'Decision not inspected';
  const target = publication && !publication.stale && publication.revision === snapshot.revision && publication.sourceDigest === snapshot.sourceDigest ? `Target ${publication.target.branch}: ${publication.target.status}` : 'Target not checked for this draft';
  const permission = canPush === null ? (publisherAvailable ? 'Publisher permission not checked' : 'Publisher permission unavailable') : canPush ? 'Publisher permission enabled' : 'Publisher permission not enabled';
  const verification = commitWorkflows ? `Commit ${commitWorkflows.sha}: ${commitWorkflows.status}` : 'Commit checks not inspected';
  return <section className="studio-activity studio-review-workflow" aria-labelledby="studio-review-workflow-heading">
    <h2 id="studio-review-workflow-heading" tabIndex={-1}>Review workflow</h2>
    <p>Draft revision {snapshot.revision}</p><details><summary>Draft identity</summary><p>Source digest <code>{snapshot.sourceDigest}</code></p></details>
    {snapshot.changeSet ? <p>Intent: {snapshot.changeSet.intent}. Requirement references: {snapshot.changeSet.requirements.join(', ') || 'none recorded'}.</p> : <p>No change-set intent is recorded for this draft.</p>}
    <p>Each step is separate. Checks and review decisions do not publish the draft.</p>
    <p>Review gates reflect the last inspection. Check updates clear the inspection; inspect again to see current evidence.</p>
    <ol>
      <li><strong>Inspect</strong><span>Review the draft changes and source patch.</span><small>{comparison}</small><button type="button" onClick={onInspect}>Open draft changes</button></li>
      <li><strong>Validate</strong><span>Inspect checks and their revision.</span><small>{gates}</small><button type="button" onClick={onChecks}>Open validation checks</button></li>
      <li><strong>Decide</strong><span>{canReview ? 'Record a decision for the reviewed draft.' : 'Reviewer access is required to record a decision.'}</span><small>{decision}</small><button type="button" onClick={event => onGo(event, 'studio-review-decision-heading')}>Go to reviewer decision</button></li>
      <li><strong>Publish</strong><span>Check the target before preparing a reviewed candidate.</span><small>{target}. {permission}.</small><button type="button" onClick={event => onGo(event, 'studio-publication-heading')}>Go to publication preflight</button></li>
      <li><strong>Verify</strong><span>Inspect checks for an exact commit; branch protection is checked separately.</span><small>{verification}</small><button type="button" onClick={event => onGo(event, 'studio-commit-checks-heading')}>Go to commit checks</button></li>
    </ol>
  </section>;
}

function DraftChangeReview({ diff, snapshot, onFocus, onRefresh }) {
  const groups = [['added', 'Added concepts'], ['changed', 'Changed concepts'], ['removed', 'Removed concepts']];
  const count = kind => diff.changes.filter(item => item.kind === kind).length;
  const stale = diff.revision !== snapshot.revision || diff.sourceDigest !== snapshot.sourceDigest;
  return <div className="studio-change-review">
    <h3 id="studio-diff-heading" tabIndex={-1}>Changes at revision {diff.revision}</h3>
    {stale && <p aria-live="polite">This comparison is out of date for the current draft. <button type="button" onClick={onRefresh}>Refresh comparison</button></p>}
    {!stale && snapshot.changeSet?.intent && <p>Change-set intent: {snapshot.changeSet.intent}</p>}
    <p>{count('added')} added · {count('changed')} changed · {count('removed')} removed · {diff.additionalSources.length} additional source {diff.additionalSources.length === 1 ? 'file' : 'files'} changed</p>
    <details><summary>Comparison identity</summary><p>Baseline commit: <code>{diff.baselineCommit}</code></p><p>Draft source digest: <code>{diff.sourceDigest}</code></p></details>
    {diff.changes.length ? groups.map(([kind, title]) => {
      const items = diff.changes.filter(item => item.kind === kind);
      return items.length > 0 && <section key={kind} className="studio-change-group" aria-label={title}><h4>{title} ({items.length})</h4><ul>{items.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.after && <button type="button" disabled={stale} onClick={() => onFocus(item.name)}>Focus changed {item.name}</button>}<div className="studio-change-comparison">{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}</div>{item.fieldChanges?.length > 0 && <ul>{item.fieldChanges.map(change => <li key={change.name}>{change.name}: {change.compatibility}{change.compatibility === 'potentially-breaking' ? ' — existing data or consumers may need migration and new tests' : ''}</li>)}</ul>}</li>)}</ul></section>;
    }) : <p>{diff.additionalSources.length ? 'No schema changes; additional source changes are shown below.' : 'No changes from the baseline.'}</p>}
    <details open><summary>Source patch</summary><pre>{diff.source.patch}</pre></details>
    <details><summary>Source before and after</summary><h4>Before</h4><pre>{diff.source.before}</pre><h4>After</h4><pre>{diff.source.after}</pre></details>
    {diff.additionalSources.map(source => <details key={source.path} open><summary>Source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}
  </div>;
}

const cardinalityLabels = { '!': 'Exactly one (1)', '?': 'Optional (0..1)', '+': 'One or more (1..*)', '*': 'Zero or more (0..*)' };
const scalarTypes = ['string', 'langString', 'integer', 'nonNegativeInteger', 'positiveInteger', 'decimal', 'boolean', 'dateTime', 'date', 'time', 'anyURI'];
function ContextHandoff({ snapshot, entity, entityRevision, job, connection, availableTools }) {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [links, setLinks] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');
  const linkPageAbort = useRef(null);
  const current = entity && entityRevision === snapshot.revision;
  const canReadLinks = snapshot.digestVersion === 4 && availableTools.includes('ontology_requirement_links');
  const linksVisible = open || showLinks;
  useEffect(() => {
    setLinks(null); setLoadingMore(false); setMoreError('');
    if (!linksVisible || !current || !canReadLinks) return undefined;
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_requirement_links', arguments: { workspaceId: snapshot.workspaceId, name: entity.name, expectedRevision: snapshot.revision, limit: 50 } }, abort.signal)
      .then(response => {
        const value = response.structuredContent;
        if (!abort.signal.aborted && value.workspaceId === snapshot.workspaceId && value.revision === snapshot.revision && value.sourceDigest === snapshot.sourceDigest && value.name === entity.name) setLinks(value);
      }).catch(() => { if (!abort.signal.aborted) setLinks({ error: true, workspaceId: snapshot.workspaceId, revision: snapshot.revision, sourceDigest: snapshot.sourceDigest, name: entity.name }); });
    return () => { abort.abort(); linkPageAbort.current?.abort(); };
  }, [linksVisible, current, canReadLinks, connection, snapshot.workspaceId, snapshot.revision, snapshot.sourceDigest, entity?.name]);
  const validation = job && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) ? job : null;
  const boundLinks = links && links.workspaceId === snapshot.workspaceId && links.revision === snapshot.revision && links.sourceDigest === snapshot.sourceDigest && links.name === entity?.name ? links : null;
  async function loadMoreLinks() {
    if (!boundLinks || boundLinks.nextOffset === null || loadingMore) return;
    const offset = boundLinks.nextOffset, abort = new AbortController();
    linkPageAbort.current = abort;
    setLoadingMore(true); setMoreError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_requirement_links', arguments: { workspaceId: snapshot.workspaceId, name: entity.name, expectedRevision: snapshot.revision, offset, limit: 50 } }, abort.signal);
      const page = response.structuredContent;
      if (!abort.signal.aborted && page.workspaceId === snapshot.workspaceId && page.revision === snapshot.revision && page.sourceDigest === snapshot.sourceDigest && page.name === entity.name) setLinks(previous => previous?.workspaceId === page.workspaceId && previous.revision === page.revision && previous.sourceDigest === page.sourceDigest && previous.name === page.name && previous.nextOffset === offset ? { ...page, results: [...previous.results, ...page.results] } : previous);
    } catch { if (!abort.signal.aborted) setMoreError('Could not load more linked requirements. Try again.'); }
    finally { if (!abort.signal.aborted) setLoadingMore(false); }
  }
  const failed = validation?.steps?.filter(step => step.status === 'failed').map(step => step.checkName) || [];
  const preview = current ? [
    'Use the connected ontology authoring tools to inspect this context before proposing changes.',
    `Workspace: ${snapshot.workspaceId}; revision: ${snapshot.revision}; source digest: ${snapshot.sourceDigest}.`,
    `Selected concept: ${entity.name}; module: ${entity.module}; parent: ${entity.parent}.`,
    `Definition: ${entity.definition}`,
    !canReadLinks ? 'Explicit concept requirement links are unavailable for this workspace or connection.' : !boundLinks ? 'Explicit concept requirement links are loading.' : boundLinks.error ? 'Explicit concept requirement links could not be loaded.' : `Explicit concept requirement links: ${boundLinks.results.map(item => item.id).join(', ') || 'none recorded'} (${boundLinks.results.length} of ${boundLinks.total} shown). These links do not establish coverage or acceptance.`,
    `Change-set requirement references (not necessarily linked to this concept): ${snapshot.changeSet?.requirements?.join(', ') || 'none recorded'}.`,
    validation ? `Last displayed ${validation.profile} check: ${validation.status} at revision ${validation.revision}${validation.revision !== snapshot.revision || validation.digest !== snapshot.sourceDigest ? ' (out of date)' : ''}. Failed steps: ${failed.join(', ') || (validation.status === 'failed' ? 'job failed without a reported failed step' : 'none recorded')}.` : 'No validation result is displayed.',
    'Inspect the current model and check evidence before editing. This context is a starting point, not an instruction to publish.',
  ].join('\n') : '';
  async function copy() {
    try { await navigator.clipboard.writeText(preview); setMessage('Context copied. Paste it into your connected client.'); }
    catch { setMessage('Clipboard unavailable. Select and copy the preview.'); }
  }
  useEffect(() => { setMessage(''); }, [preview]);
  return <><details className="studio-requirement-links" onToggle={event => setShowLinks(event.currentTarget.open)}><summary>Linked requirements</summary>
    <p>These are explicit links from the requirement register; they do not establish coverage or acceptance.</p>
    {!current ? <p role="status">Loading the selected concept for the current draft.</p> : !canReadLinks ? <p>Requirement links are unavailable for this workspace or connection.</p> : !boundLinks ? <p role="status">Loading linked requirements…</p> : boundLinks.error ? <p role="status">Linked requirements could not be loaded.</p> : <><p>Showing {boundLinks.results.length} of {boundLinks.total} linked requirements.</p>{boundLinks.results.length ? <ul>{boundLinks.results.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <small>{item.source}</small></li>)}</ul> : <p>No explicit links are recorded for this concept.</p>}{boundLinks.nextOffset !== null && <button type="button" disabled={loadingMore} onClick={loadMoreLinks}>{loadingMore ? 'Loading requirements…' : 'Load more requirements'}</button>}{moreError && <p role="status">{moreError}</p>}</>}
  </details><details className="studio-context-handoff" onToggle={event => setOpen(event.currentTarget.open)}><summary>Prepare context for Codex</summary>
    <p>Preview and copy this context to your existing client. Nothing is sent automatically. Check output is not included.</p>
    {current ? <><label>Context preview <textarea readOnly value={preview} rows={9} /></label><button type="button" onClick={copy}>Copy context</button></> : <p role="status">Loading the selected concept for the current draft.</p>}
    {message && <p role="status">{message}</p>}
  </details></>;
}
function CommandPalette({ commands, onClose }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const matching = commands.filter(command => command.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = Math.min(active, matching.length - 1);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    input.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  function execute(command) {
    if (!command) return;
    onClose();
    requestAnimationFrame(command.run);
  }
  return <dialog ref={dialog} className="studio-command-palette" aria-labelledby="studio-command-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="studio-command-header"><h2 id="studio-command-title">Commands</h2><button type="button" onClick={onClose} aria-label="Close commands">Close</button></div>
    <label>Find a command <input ref={input} value={query} role="combobox" aria-expanded="true" aria-controls="studio-command-results" aria-autocomplete="list" aria-activedescendant={selected >= 0 ? `studio-command-${selected}` : undefined} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' && matching.length) { event.preventDefault(); setActive((selected + 1) % matching.length); }
      else if (event.key === 'ArrowUp' && matching.length) { event.preventDefault(); setActive((selected + matching.length - 1) % matching.length); }
      else if (event.key === 'Enter' && matching.length) { event.preventDefault(); execute(matching[selected]); }
    }} /></label>
    <p className="studio-command-hint">Use arrow keys to choose, Enter to run, or Escape to close.</p>
    <ul id="studio-command-results" role="listbox" aria-label="Available commands">{matching.map((command, index) => <li id={`studio-command-${index}`} key={command.label} role="option" aria-selected={index === selected} onMouseDown={event => event.preventDefault()} onClick={() => execute(command)}>{command.label}</li>)}</ul>
    {!matching.length && <p role="status">No matching commands.</p>}
  </dialog>;
}
function InspectorIdentifier({ iri }) {
  const [notice, setNotice] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(iri); setNotice('Identifier copied.'); }
    catch { setNotice('Clipboard unavailable; select and copy the identifier shown here.'); }
  }
  return <div className="studio-identifier"><p>IRI: <code>{iri}</code></p><button type="button" onClick={copy}>Copy identifier</button>{notice && <p aria-live="polite">{notice}</p>}</div>;
}
function InspectorFields({ fields, onEdit, onRequire, onNarrowValues, onInspectOwner, commandPending, narrowing, editingLocked }) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('source');
  const [origin, setOrigin] = useState('all');
  if (!fields.length) return <p>No fields.</p>;
  const term = filter.trim().toLocaleLowerCase();
  const visible = fields.filter(item => (origin === 'all' || (origin === 'inherited') === item.inherited) && `${item.property} ${item.range} ${item.description || ''} ${item.owner}`.toLocaleLowerCase().includes(term));
  if (sort === 'name') visible.sort((a, b) => a.property.localeCompare(b.property));
  if (sort === 'type') visible.sort((a, b) => a.range.localeCompare(b.range) || a.property.localeCompare(b.property));
  return <><div className="studio-field-controls"><label>Filter fields <input value={filter} onChange={event => setFilter(event.target.value)} /></label><label>Field origin <select value={origin} onChange={event => setOrigin(event.target.value)}><option value="all">All fields</option><option value="declared">Declared here</option><option value="inherited">Inherited</option></select></label><label>Sort fields <select value={sort} onChange={event => setSort(event.target.value)}><option value="source">Source order</option><option value="name">Name</option><option value="type">Type</option></select></label></div><p aria-live="polite">Showing {visible.length} of {fields.length} fields.</p>{!visible.length && <p>No fields match these filters. Clear the text or change the origin.</p>}<div className="studio-field-table-wrap"><table className="studio-field-table">
    <thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Cardinality</th><th scope="col">Origin</th><th scope="col">Actions</th></tr></thead>
    <tbody>{visible.map((item, index) => <tr key={`${item.owner}-${item.property}-${index}`}>
      <th scope="row">{item.property}<small>{item.source.path}:{item.source.line}</small>{item.description && <small>{item.description}</small>}</th>
      <td>{item.range}</td><td>{cardinalityLabels[item.cardinality] ?? item.cardinality}</td><td>{item.inherited ? `Inherited from ${item.owner}` : 'Declared here'}</td><td>
        {item.inherited && <button type="button" onClick={() => onInspectOwner(item.owner)}>Inspect owner {item.owner}</button>}
        {!item.inherited && <button type="button" onClick={event => onEdit(item, event.currentTarget)}>Edit {item.property}</button>}
        {!item.inherited && item.values?.length >= 3 && <button type="button" disabled={commandPending || narrowing || editingLocked} title={editingLocked ? 'Reopen the change set before editing.' : undefined} onClick={event => onNarrowValues(item, event.currentTarget)}>Narrow values for {item.property}</button>}
        {!item.inherited && item.type === 'object' && ['?', '*'].includes(item.cardinality) && <button type="button" disabled={commandPending} title="Requiring a relationship may break existing data." onClick={() => onRequire(item)}>Require {item.property}</button>}
      </td>
    </tr>)}</tbody>
  </table></div></>;
}

function panelWidth(key, fallback, minimum, maximum) {
  try {
    const stored = localStorage.getItem(`chargeweave.studio.${key}.v1`);
    if (stored === null || !/^\d+$/.test(stored)) return fallback;
    return Math.min(maximum, Math.max(minimum, Number(stored)));
  } catch { return fallback; }
}
function panelHidden(key, fallback) {
  try {
    const stored = localStorage.getItem(`chargeweave.studio.${key}.v1`);
    return stored === 'true' ? true : stored === 'false' ? false : fallback;
  } catch { return fallback; }
}
function resultsHeightLimit() {
  const reserved = window.innerWidth >= 1000 ? 304 : 392;
  return Math.max(160, Math.min(Math.floor(window.innerHeight * .45), window.innerHeight - reserved - 288));
}
function restoredViews(workspaceId, current) {
  try {
    const stored = JSON.parse(localStorage.getItem(`chargeweave.studio.views.v1.${workspaceId}`) || '[]');
    const valid = Array.isArray(stored) ? stored.filter(id => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)).slice(0, 50) : [];
    return [...new Set([current, ...valid])];
  } catch { return [current]; }
}

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
  const [compactListFirst, setCompactListFirst] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [dockPanel, setDockPanel] = useState(null);
  const [undoCandidate, setUndoCandidate] = useState(null);
  const [explorerExpansion, setExplorerExpansion] = useState({});
  const [compactSurface, setCompactSurface] = useState('model');
  const [editorDocument, setEditorDocument] = useState('diagram');
  const [dockLimit, setDockLimit] = useState(resultsHeightLimit);
  const [dockHeight, setDockHeight] = useState(() => Math.min(resultsHeightLimit(), panelWidth('results-height', 184, 160, 600)));
  const commandTrigger = useRef(null);
  const [endpoint, setEndpoint] = useState(() => window.location.hostname === '127.0.0.1' && !['4173', '5173'].includes(window.location.port) ? window.location.origin : 'http://127.0.0.1:4317');
  const [token, setToken] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [connection, setConnection] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [canCreateWorkspace, setCanCreateWorkspace] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [workspaceBaseline, setWorkspaceBaseline] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const creationOperation = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const lastSearch = useRef(null);
  const [browse, setBrowse] = useState(null);
  const [browsePending, setBrowsePending] = useState(false);
  const browseRequest = useRef(0);
  const browseSelection = useRef({ endpoint: null, workspaceId: null, module: '' });
  const [selected, setSelected] = useState(null);
  const [viewRoot, setViewRoot] = useState(null);
  const [rootHistory, setRootHistory] = useState({ entries: [], index: -1 });
  const [graph, setGraph] = useState(null);
  const [savedViewRevision, setSavedViewRevision] = useState(null);
  const [viewId, setViewId] = useState('default');
  const [openViewIds, setOpenViewIds] = useState(['default']);
  const viewContext = useRef(0);
  const viewContextKey = useRef(null);
  const viewOperation = useRef(null);
  const [pendingViewOps, setPendingViewOps] = useState({});
  const [viewBusy, setViewBusy] = useState(null);
  const [viewIdInput, setViewIdInput] = useState('default');
  const [savedViews, setSavedViews] = useState([]);
  const [savedViewsState, setSavedViewsState] = useState({ workspaceId: null, status: 'loading', truncated: false });
  const [savedViewsReload, setSavedViewsReload] = useState(0);
  const savedViewsRequest = useRef(0);
  const [pendingSavedView, setPendingSavedView] = useState(null);
  const [viewLoaded, setViewLoaded] = useState(false);
  const [viewReadyKey, setViewReadyKey] = useState(null);
  const [viewDirty, setViewDirty] = useState(false);
  const viewChangeVersion = useRef(0);
  const changedViews = useRef(new Set());
  const localViewDrafts = useRef(new Map());
  const [viewGroups, setViewGroups] = useState([]);
  const [viewAnnotations, setViewAnnotations] = useState([]);
  const [viewMetadata, setViewMetadata] = useState({ mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information' });
  const [showIncoming, setShowIncoming] = useState(false);
  const [incomingLimit, setIncomingLimit] = useState(20);
  const [outgoingLimit, setOutgoingLimit] = useState(12);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [viewNotice, setViewNotice] = useState('');
  const [hideNavigator, setHideNavigator] = useState(() => panelHidden('navigator-hidden', false));
  const [hideInspector, setHideInspector] = useState(() => panelHidden('inspector-hidden', window.matchMedia('(min-width: 901px) and (max-width: 1399px)').matches));
  const [navigatorWidth, setNavigatorWidth] = useState(() => panelWidth('navigator-width', 240, 200, 360));
  const [inspectorWidth, setInspectorWidth] = useState(() => panelWidth('inspector-width', 320, 280, 440));
  const [entityInfo, setEntityInfo] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const incomingRequest = useRef(0);
  const [entityRevision, setEntityRevision] = useState(null);
  const [temporal, setTemporal] = useState(null);
  const [temporalPolicy, setTemporalPolicy] = useState('snapshot-versioned');
  const [temporalBaseline, setTemporalBaseline] = useState(null);
  const temporalRequest = useRef(0);
  const [responsibility, setResponsibility] = useState(null);
  const [impact, setImpact] = useState(null);
  const [requirementQuery, setRequirementQuery] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [intervalRule, setIntervalRule] = useState({ startProperty: '', endProperty: '', ruleId: '' });
  const [binding, setBinding] = useState({ property: '', label: '', category: 'ownership' });
  const [diff, setDiff] = useState(null);
  const [job, setJob] = useState(null);
  const jobRef = useRef(job);
  jobRef.current = job;
  const [validationRefresh, setValidationRefresh] = useState(0);
  const [checkStarting, setCheckStarting] = useState(false);
  const [checkProfile, setCheckProfile] = useState('structural');
  const [jobRestoreNotice, setJobRestoreNotice] = useState('');
  const jobEpoch = useRef(0);
  const [commandPending, setCommandPending] = useState(false);
  const commandInFlight = useRef(false);
  const checkInFlight = useRef(false);
  const [history, setHistory] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyPending, setHistoryPending] = useState(false);
  const historyRequest = useRef(0);
  const diffRequest = useRef(0);
  const readinessRequest = useRef(0);
  const readinessEpoch = useRef(0);
  const reviewDecisionsRequest = useRef(0);
  const publicationRequest = useRef(0);
  const commitChecksRequest = useRef(0);
  const [followSuggestions, setFollowSuggestions] = useState(false);
  const [followPaused, setFollowPaused] = useState(false);
  const followCursor = useRef(0);
  const followGeneration = useRef(0);
  const [readiness, setReadiness] = useState(null);
  const [publication, setPublication] = useState(null);
  const [publicationSubject, setPublicationSubject] = useState('');
  const [publicationBody, setPublicationBody] = useState('');
  const [publicationHistory, setPublicationHistory] = useState([]);
  const [canPush, setCanPush] = useState(null);
  const [commitSha, setCommitSha] = useState('');
  const [commitWorkflows, setCommitWorkflows] = useState(null);
  const [requiredChecks, setRequiredChecks] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [decisionsLoaded, setDecisionsLoaded] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewDecision, setReviewDecision] = useState('request_changes');
  const [reviewCase, setReviewCase] = useState({ requirementId: '', ruleId: '', caseId: '', start: '', end: '', expectedConformance: 'true', scenario: '' });
  const [definition, setDefinition] = useState('');
  const [definitionConflict, setDefinitionConflict] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null);
  const definitionRef = useRef(definition);
  definitionRef.current = definition;
  const [rationale, setRationale] = useState('');
  const [changeSetIntent, setChangeSetIntent] = useState('');
  const [changeSetRequirements, setChangeSetRequirements] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [pendingCreatedConcept, setPendingCreatedConcept] = useState(null);
  const selectionGeneration = useRef(0);
  const [conceptFormOpen, setConceptFormOpen] = useState(false);
  const [parentSuggestions, setParentSuggestions] = useState([]);
  const [parentSearchError, setParentSearchError] = useState('');
  const [fieldFormOpen, setFieldFormOpen] = useState(false);
  const [rangeSuggestions, setRangeSuggestions] = useState([]);
  const [rangeSearchError, setRangeSearchError] = useState('');
  const [rangeSource, setRangeSource] = useState('add');
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [relationshipDraft, setRelationshipDraft] = useState(null);
  const [relationshipSubmitting, setRelationshipSubmitting] = useState(false);
  const [fieldEdit, setFieldEdit] = useState(null);
  const [valueConstraint, setValueConstraint] = useState(null);
  const valueConstraintRef = useRef(valueConstraint);
  valueConstraintRef.current = valueConstraint;
  const valueConstraintTrigger = useRef(null);
  const fieldEditRef = useRef(fieldEdit);
  fieldEditRef.current = fieldEdit;
  const [status, setStatus] = useState('Disconnected');
  const [online, setOnline] = useState(false);
  const [workspaceFocus, setWorkspaceFocus] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [diagnosticMessage, setDiagnosticMessage] = useState('');
  const [connectionCopyMessage, setConnectionCopyMessage] = useState('');
  const [error, setError] = useState('');
  const cursor = useRef(0);
  const currentRevision = useRef(null);
  const searchInput = useRef(null);
  const searchSequence = useRef(0);
  const fieldEditInput = useRef(null);
  const fieldEditTrigger = useRef(null);
  const unsavedDialog = useRef(null);
  const relationshipOrigin = useRef(null);
  const paneDrag = useRef(null);
  const connectionAbort = useRef(null);

  useEffect(() => { if (!online) setCommandsOpen(false); }, [online]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setCompactListFirst(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => setIsCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    function resizeResultsLimit() {
      const limit = resultsHeightLimit();
      setDockLimit(limit);
      setDockHeight(height => Math.min(height, limit));
    }
    window.addEventListener('resize', resizeResultsLimit);
    return () => window.removeEventListener('resize', resizeResultsLimit);
  }, []);
  useEffect(() => {
    if (job?.status === 'failed' && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile)) {
      setDockPanel('problems');
      if (window.matchMedia('(max-width: 900px)').matches) setCompactSurface('results');
    }
  }, [job?.id, job?.status, job?.profile]);

  useEffect(() => {
    if (!online || !workspaceFocus) return undefined;
    const frame = requestAnimationFrame(() => {
      const target = workspaceFocus.kind === 'view'
        ? [...document.querySelectorAll('.studio-view-tabs [data-view-id]')].find(button => button.dataset.viewId === workspaceFocus.id)
        : document.getElementById(workspaceFocus.kind === 'validation' ? 'studio-validation-heading' : 'studio-diff-heading');
      if (!target || target.matches(':disabled')) return;
      target.scrollIntoView({ block: 'nearest' });
      target.focus({ preventScroll: true });
      if (document.activeElement === target) setWorkspaceFocus(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [online, workspaceFocus, diff, openViewIds, dockPanel]);

  useEffect(() => {
    try {
      localStorage.setItem('chargeweave.studio.navigator-width.v1', String(navigatorWidth));
      localStorage.setItem('chargeweave.studio.inspector-width.v1', String(inspectorWidth));
      localStorage.setItem('chargeweave.studio.navigator-hidden.v1', String(hideNavigator));
      localStorage.setItem('chargeweave.studio.inspector-hidden.v1', String(hideInspector));
      localStorage.setItem('chargeweave.studio.results-height.v1', String(dockHeight));
    } catch { /* The layout remains available for this session. */ }
  }, [navigatorWidth, inspectorWidth, hideNavigator, hideInspector, dockHeight]);

  function resizePane(side, value) {
    if (side === 'navigator') setNavigatorWidth(Math.min(360, Math.max(200, value)));
    else setInspectorWidth(Math.min(440, Math.max(280, value)));
  }
  function panePointerDown(event, side) {
    if (!online || event.button !== 0) return;
    paneDrag.current = { side, x: event.clientX, width: side === 'navigator' ? navigatorWidth : inspectorWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function panePointerMove(event) {
    const drag = paneDrag.current;
    if (!drag) return;
    resizePane(drag.side, drag.width + (event.clientX - drag.x) * (drag.side === 'navigator' ? 1 : -1));
  }
  function paneKeyDown(event, side) {
    const width = side === 'navigator' ? navigatorWidth : inspectorWidth;
    const minimum = side === 'navigator' ? 200 : 280;
    const maximum = side === 'navigator' ? 360 : 440;
    if (event.key === 'Home') resizePane(side, minimum);
    else if (event.key === 'End') resizePane(side, maximum);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') resizePane(side, width + (event.key === 'ArrowRight' ? 10 : -10) * (side === 'navigator' ? 1 : -1));
    else return;
    event.preventDefault();
  }
  function openCompactPane(id) {
    const surfaces = { 'studio-navigator-pane': 'model', 'studio-editor-pane': 'diagram', 'studio-inspector-pane': 'inspector' };
    if (surfaces[id]) setCompactSurface(surfaces[id]);
    if (id === 'studio-editor-pane') setEditorDocument('diagram');
    if (!window.matchMedia('(max-width: 900px)').matches && id === 'studio-navigator-pane') setHideNavigator(false);
    if (!window.matchMedia('(max-width: 900px)').matches && id === 'studio-inspector-pane') setHideInspector(false);
    const previousFocus = document.activeElement;
    requestAnimationFrame(() => {
      if (document.activeElement !== previousFocus && document.activeElement !== document.body) return;
      const pane = document.getElementById(id);
      pane?.scrollIntoView({ block: 'start' });
      pane?.querySelector('h2')?.focus({ preventScroll: true });
    });
  }
  function invalidateReadiness() {
    readinessEpoch.current += 1;
    setReadiness(null);
  }
  function openWorkspaceTask(event, id) {
    event?.preventDefault();
    const reviewDestination = ['studio-review-workflow-heading', 'studio-review-decision-heading', 'studio-publication-heading', 'studio-commit-checks-heading', 'studio-review-heading'].includes(id);
    if (reviewDestination) { setEditorDocument('review'); setCompactSurface('diagram'); }
    else setCompactSurface('results');
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ block: 'start' });
      target?.focus({ preventScroll: true });
    });
  }
  function focusModelSearch() {
    if (!window.matchMedia('(max-width: 900px)').matches) setHideNavigator(false);
    setCompactSurface('model');
    requestAnimationFrame(() => {
      searchInput.current?.scrollIntoView({ block: 'nearest' });
      searchInput.current?.focus();
    });
  }
  function openConceptCreator() {
    pauseFollowing();
    setCompactSurface('diagram');
    setEditorDocument('diagram');
    requestAnimationFrame(() => {
      const details = document.getElementById('studio-concept-creator');
      if (!details) return;
      details.open = true;
      details.scrollIntoView({ block: 'nearest' });
      details.querySelector('input')?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    function shortcut(event) {
      const editing = event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable=true]');
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p' && commandTrigger.current && !commandTrigger.current.disabled && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        setCommandsOpen(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !editing && searchInput.current && !searchInput.current.matches(':disabled')) {
        event.preventDefault();
        focusModelSearch();
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
    jobEpoch.current += 1; checkInFlight.current = false; setCheckStarting(false); setJob(null); setJobRestoreNotice('');
    setAvailableTools([]);
    setCanPush(null);
    setPublicationHistory([]);
    setPublication(null);
    setReadiness(null);
    setReviews([]);
    setDecisionsLoaded(false);
    setCommitWorkflows(null);
    setDiff(null);
    setEditorDocument('diagram');
    const abort = new AbortController();
    connectionAbort.current = abort;
    let streamAbort = null;
    const refreshOnVisible = () => { if (document.visibilityState === 'visible' && streamAbort) { setOnline(false); streamAbort.abort(); } };
    document.addEventListener('visibilitychange', refreshOnVisible);
    const { endpoint: url, token: credential, workspaceId: id } = connection;
    const tool = async (name, args) => (await call(url, credential, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    async function refresh() {
      invalidateReadiness();
      const response = await call(url, credential, 'resources/read', { uri: `ontology://workspace/${id}/v1/summary` }, abort.signal);
      const value = JSON.parse(response.contents?.[0]?.text ?? 'null');
      if (value?.contractVersion !== 'chargeweave-resource-v1' || value.workspaceId !== id || !Number.isSafeInteger(value.revision) || !Number.isSafeInteger(value.eventSequence)) throw new Error('Invalid workspace summary');
      cursor.current = value.eventSequence;
      if (currentRevision.current !== value.revision) { setResults([]); setSearchDone(false); }
      currentRevision.current = value.revision;
      setSnapshot(value);
      setWorkspaceBaseline(previous => previous || value.baselineCommit);
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
        if (abort.signal.aborted) return;
        setAvailableTools(capabilities.tools.map(item => item.name));
        setCanCreateWorkspace(capabilities.tools.some(item => item.name === 'ontology_workspace_create'));
        const listing = await tool('ontology_workspace_list', {});
        setWorkspaces(listing.workspaces);
        await refresh();
        if (abort.signal.aborted) return;
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
                } else if (event.includes('event: validation-evidence')) {
                  invalidateReadiness();
                  if (!checkInFlight.current && !jobRef.current?.profile?.startsWith('publication-')) setValidationRefresh(value => value + 1);
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
    return () => { document.removeEventListener('visibilitychange', refreshOnVisible); streamAbort?.abort(); abort.abort(); if (connectionAbort.current === abort) connectionAbort.current = null; };
  }, [connection]);

  useEffect(() => {
    if (!connection || !availableTools.includes('ontology_validation_latest')) return undefined;
    const abort = new AbortController(), epoch = jobEpoch.current;
    const valid = () => !abort.signal.aborted && epoch === jobEpoch.current;
    async function restore() {
      try {
        const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_validation_latest', arguments: { workspaceId: connection.workspaceId } }, abort.signal);
        if (!valid()) return;
        if (response.structuredContent.workspaceId !== connection.workspaceId || (response.structuredContent.job && response.structuredContent.job.workspace !== connection.workspaceId)) throw new Error('Invalid validation job identity');
        let current = response.structuredContent.job;
        setJob(current); setJobRestoreNotice('');
        while (current && ['queued', 'running', 'cancelling'].includes(current.status)) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!valid()) return;
          const result = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } }, abort.signal);
          if (!valid()) return;
          if (result.structuredContent.workspace !== connection.workspaceId || result.structuredContent.id !== current.id) throw new Error('Invalid validation job identity');
          current = result.structuredContent; setJob(current);
        }
      } catch { if (valid()) setJobRestoreNotice('Could not restore the last validation result. Run or inspect checks again.'); }
    }
    void restore();
    return () => abort.abort();
  }, [connection, availableTools, validationRefresh]);

  useEffect(() => {
    const key = JSON.stringify([connection?.endpoint, connection?.workspaceId, viewId]);
    const draft = localViewDrafts.current.get(key);
    setSavedViewRevision(draft?.revision ?? null); setViewLoaded(draft?.loaded ?? false); setViewNotice(''); setViewDirty(changedViews.current.has(key)); viewChangeVersion.current += 1;
    setViewGroups(draft?.groups ?? []); setViewAnnotations(draft?.annotations ?? []); setViewMetadata(draft?.metadata ?? { mappingVersion: 'chargeweave-authoring-v1', viewpoint: 'information' });
    if (draft?.root) setViewRoot(draft.root);
    setViewReadyKey(key);
    if (!connection) return undefined;
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_get', arguments: { workspaceId: connection.workspaceId, viewId } }, abort.signal)
      .then(response => { if (!abort.signal.aborted && !draft) { setSavedViewRevision(response.structuredContent.viewRevision); setViewLoaded(!response.structuredContent.definition); } })
      .catch(problem => { if (!abort.signal.aborted) { setPendingSavedView(current => current?.workspaceId === connection.workspaceId && current.viewId === viewId ? null : current); setViewNotice(`Saved view unavailable: ${problem.message}`); } });
    return () => abort.abort();
  }, [connection, viewId]);

  useEffect(() => {
    if (!connection) return undefined;
    const abort = new AbortController();
    const request = ++savedViewsRequest.current;
    setSavedViewsState({ workspaceId: connection.workspaceId, status: 'loading', truncated: false });
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_list', arguments: { workspaceId: connection.workspaceId } }, abort.signal)
      .then(response => { if (abort.signal.aborted || request !== savedViewsRequest.current) return; if (response.structuredContent.workspaceId !== connection.workspaceId || !Array.isArray(response.structuredContent.views)) throw new Error('Invalid saved view list'); setSavedViews(response.structuredContent.views); setSavedViewsState({ workspaceId: connection.workspaceId, status: 'ready', truncated: response.structuredContent.truncated }); })
      .catch(() => { if (!abort.signal.aborted && request === savedViewsRequest.current) setSavedViewsState({ workspaceId: connection.workspaceId, status: 'error', truncated: false }); });
    return () => abort.abort();
  }, [connection, savedViewsReload]);

  useEffect(() => { setOpenViewIds(connection ? restoredViews(connection.workspaceId, viewId) : [viewId]); }, [connection?.endpoint, connection?.workspaceId]);

  useEffect(() => {
    if (!connection || !snapshot || !viewRoot) { setGraph(null); return undefined; }
    const abort = new AbortController();
    const tool = async (name, args) => (await call(connection.endpoint, connection.token, 'tools/call', { name, arguments: args }, abort.signal)).structuredContent;
    (async () => {
        const args = { workspaceId: connection.workspaceId, root: viewRoot, expectedRevision: snapshot.revision };
        const viewpoint = viewMetadata.viewpoint ?? 'information';
        const information = await tool('ontology_view_get', { ...args, limit: viewpoint === 'information' ? outgoingLimit : 50 });
        const perspective = viewpoint === 'information' ? null : await tool(viewpoint === 'responsibility' ? 'ontology_responsibility_view_get' : 'ontology_temporal_view_get', args);
        let value = await projectView(information, perspective, viewMetadata.filter, async name => (await tool('ontology_entity_get', { workspaceId: connection.workspaceId, name, expectedRevision: snapshot.revision })).entity);
        value = { ...value, remainingOutgoing: viewpoint === 'information' ? information.omitted : 0 };
        if (showIncoming && viewpoint === 'information') {
          const incomingPage = await tool('ontology_incoming_get', { ...args, limit: incomingLimit });
          value = mergeIncoming(value, incomingPage, viewMetadata.filter);
        }
        if (abort.signal.aborted || value.revision !== currentRevision.current) return;
        setGraph(value);
      })()
      .catch(problem => { if (!abort.signal.aborted) setError(problem.message); });
    return () => abort.abort();
  }, [connection, snapshot?.revision, viewRoot, viewMetadata.viewpoint, viewMetadata.filter, showIncoming, incomingLimit, outgoingLimit]);
  useEffect(() => { setIncomingLimit(20); }, [connection, viewRoot]);
  useEffect(() => { setOutgoingLimit(12); }, [connection, viewRoot]);

  useEffect(() => {
    if (!connection || !snapshot || !selected) { setEntityInfo(null); return undefined; }
    const abort = new AbortController();
    setEntityInfo(null); setEntityRevision(null);
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: selected.name, expectedRevision: snapshot.revision } }, abort.signal)
      .then(response => {
        if (abort.signal.aborted || response.structuredContent.revision !== currentRevision.current) return;
        const refreshed = response.structuredContent.entity;
        if (definitionRef.current !== selected.definition && refreshed.definition !== selected.definition && refreshed.definition !== definitionRef.current) setDefinitionConflict({ before: selected.definition, latest: refreshed.definition });
        setSelected(previous => previous?.name === refreshed.name ? refreshed : previous);
        setDefinition(draft => draft === selected.definition ? refreshed.definition : draft);
        setEntityInfo(refreshed); setEntityRevision(response.structuredContent.revision);
      })
      .catch(problem => { if (!abort.signal.aborted) setError(problem.message); });
    return () => abort.abort();
  }, [connection, snapshot?.revision, selected?.name]);

  useEffect(() => {
    const request = ++browseRequest.current;
    setBrowse(null); setBrowsePending(false);
    if (!connection || !snapshot) return undefined;
    if (browseSelection.current.endpoint !== connection.endpoint || browseSelection.current.workspaceId !== connection.workspaceId) browseSelection.current = { endpoint: connection.endpoint, workspaceId: connection.workspaceId, module: '' };
    const module = browseSelection.current.module;
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_explorer_list', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision, limit: 50, ...(module ? { module } : {}) } }, abort.signal)
      .then(response => { if (!abort.signal.aborted && request === browseRequest.current && response.structuredContent.revision === currentRevision.current) setBrowse(response.structuredContent); })
      .catch(problem => { if (!abort.signal.aborted && request === browseRequest.current) setBrowse({ error: problem.message }); });
    return () => abort.abort();
  }, [connection, snapshot?.revision]);
  useEffect(() => {
    setParentSuggestions([]); setParentSearchError('');
    const query = newClass.parent.trim();
    if (!conceptFormOpen || !connection || !snapshot || !query || query.length > 200) return undefined;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_context_search', arguments: { workspaceId: connection.workspaceId, query, limit: 25, expectedRevision: snapshot.revision } }, abort.signal)
        .then(response => { if (!abort.signal.aborted && response.structuredContent.revision === currentRevision.current) setParentSuggestions(response.structuredContent.results); })
        .catch(problem => { if (!abort.signal.aborted) setParentSearchError(`Parent suggestions unavailable: ${problem.message}`); });
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [conceptFormOpen, connection, snapshot?.revision, newClass.parent]);
  useEffect(() => {
    setRangeSuggestions([]); setRangeSearchError('');
    const query = (rangeSource === 'edit' ? fieldEdit?.range ?? '' : field.range).trim();
    if ((rangeSource === 'edit' ? !fieldEdit : !fieldFormOpen) || !connection || !snapshot || query.length < 2 || query.length > 128 || !/^[A-Za-z][A-Za-z0-9]*$/.test(query) || scalarTypes.includes(query)) return undefined;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_context_search', arguments: { workspaceId: connection.workspaceId, query, limit: 25, expectedRevision: snapshot.revision } }, abort.signal)
        .then(response => { if (!abort.signal.aborted && response.structuredContent.revision === currentRevision.current) setRangeSuggestions(response.structuredContent.results); })
        .catch(problem => { if (!abort.signal.aborted) setRangeSearchError(`Type suggestions unavailable: ${problem.message}`); });
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [fieldFormOpen, fieldEdit?.range, field.range, rangeSource, connection, snapshot?.revision]);
  async function browseModule(module) {
    if (!connection || !snapshot) return;
    browseSelection.current = { endpoint: connection.endpoint, workspaceId: connection.workspaceId, module };
    const request = ++browseRequest.current;
    setBrowsePending(true);
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_explorer_list', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision, limit: 50, ...(module ? { module } : {}) } });
      if (request === browseRequest.current && response.structuredContent.revision === currentRevision.current) setBrowse(response.structuredContent);
    } catch (problem) { if (request === browseRequest.current) setError(problem.message); }
    finally { if (request === browseRequest.current) setBrowsePending(false); }
  }
  async function loadMoreConcepts() {
    if (browsePending || !browse?.nextCursor || !connection || !snapshot) return;
    const cursor = browse.nextCursor;
    const request = ++browseRequest.current;
    setBrowsePending(true);
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_explorer_list', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision, cursor, limit: 50, ...(browse.module ? { module: browse.module } : {}) } });
      const page = response.structuredContent;
      if (request === browseRequest.current && page.revision === currentRevision.current) setBrowse(previous => previous?.workspaceId === page.workspaceId && previous.module === page.module && previous.nextCursor === cursor && previous.revision === page.revision ? { ...page, results: [...previous.results, ...page.results] } : previous);
    } catch (problem) { if (request === browseRequest.current) setError(problem.message); }
    finally { if (request === browseRequest.current) setBrowsePending(false); }
  }
  useEffect(() => { temporalRequest.current += 1; setTemporal(null); }, [connection, snapshot?.revision, selected?.name]);
  useEffect(() => { setTemporalBaseline(null); }, [connection, selected?.name]);
  useEffect(() => { incomingRequest.current += 1; setIncoming(null); }, [connection, snapshot?.revision, selected?.name]);
  useEffect(() => { setResponsibility(null); }, [connection, snapshot?.revision, selected?.name]);
  useEffect(() => { setImpact(null); }, [connection, snapshot?.revision]);
  useEffect(() => { setPublication(null); }, [connection, snapshot?.revision]);
  useEffect(() => { setRequirements([]); }, [connection, snapshot?.revision]);
  useEffect(() => { setFieldEdit(null); }, [connection, selected?.name]);
  useEffect(() => { setValueConstraint(null); }, [connection, selected?.name]);
  useEffect(() => { setViewRoot(null); setRootHistory({ entries: [], index: -1 }); }, [connection]);
  useEffect(() => { setDefinitionConflict(null); }, [connection, selected?.name]);
  useEffect(() => { setPendingSelection(null); }, [connection]);
  useEffect(() => {
    if (!pendingCreatedConcept || !connection || !snapshot) return undefined;
    if (pendingCreatedConcept.workspaceId !== connection.workspaceId || pendingCreatedConcept.selectionGeneration !== selectionGeneration.current) { setPendingCreatedConcept(null); return undefined; }
    if (snapshot.revision < pendingCreatedConcept.minimumRevision) return undefined;
    const abort = new AbortController();
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: pendingCreatedConcept.name, expectedRevision: snapshot.revision } }, abort.signal)
      .then(response => {
        if (abort.signal.aborted || response.structuredContent.revision !== currentRevision.current) return;
        if (pendingCreatedConcept.selectionGeneration === selectionGeneration.current) selectConcept(response.structuredContent.entity);
        setPendingCreatedConcept(null);
      })
      .catch(problem => { if (!abort.signal.aborted) { setError(`Concept created, but could not be opened: ${problem.message}`); setPendingCreatedConcept(null); } });
    return () => abort.abort();
  }, [pendingCreatedConcept, connection, snapshot?.revision, selected?.name]);
  useEffect(() => {
    const dialog = unsavedDialog.current;
    if (!pendingSelection || !dialog) return undefined;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [pendingSelection]);
  useEffect(() => {
    const sequence = ++searchSequence.current;
    const previous = lastSearch.current;
    if (!connection || !snapshot || !previous || previous.workspaceId !== connection.workspaceId) { setSearchPending(false); return undefined; }
    const abort = new AbortController();
    void runSearch(previous.query, sequence, abort.signal);
    return () => abort.abort();
  }, [connection, snapshot?.revision]);
  useEffect(() => { if (fieldEdit) fieldEditInput.current?.focus(); }, [fieldEdit?.name]);
  useEffect(() => { setIntervalRule({ startProperty: '', endProperty: '', ruleId: '' }); }, [connection, selected?.name]);
  useEffect(() => { setBinding({ property: '', label: '', category: 'ownership' }); }, [connection, selected?.name]);
  useEffect(() => { setRelationshipDraft(null); }, [connection]);
  useEffect(() => { historyRequest.current += 1; setHistoryDetail(null); setHistoryPending(false); }, [connection]);
  useEffect(() => { setRationale(''); }, [connection]);

  function hasUnsavedInspectorEdits() {
    const editedField = fieldEditRef.current;
    return Boolean((selected && definitionRef.current !== selected.definition)
      || (editedField && (editedField.range !== editedField.expectedRange || editedField.cardinality !== editedField.expectedCardinality))
      || (valueConstraintRef.current && valueConstraintRef.current.values.length !== valueConstraintRef.current.original.length)
      || field.name.trim() || field.range !== 'string' || field.cardinality !== '?' || relationshipDraft
      || intervalRule.startProperty || intervalRule.endProperty || intervalRule.ruleId.trim()
      || binding.property || binding.label.trim() || binding.category !== 'ownership'
      || (temporalBaseline && temporalBaseline.root === selected?.name && temporalPolicy !== (temporalBaseline.policy ?? 'snapshot-versioned')));
  }
  function hasUnsavedWorkspaceEdits() {
    return Boolean(hasUnsavedInspectorEdits() || newClass.name.trim() || newClass.definition.trim());
  }
  useEffect(() => {
    function warnBeforeLeaving(event) {
      if (!commandInFlight.current && !hasUnsavedWorkspaceEdits() && !changedViews.current.size) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [connection, selected?.name, selected?.definition, definition, fieldEdit, valueConstraint, field, relationshipDraft, intervalRule, binding, temporalBaseline, temporalPolicy, newClass.name, newClass.definition]);
  const activeViewKey = JSON.stringify([connection?.endpoint, connection?.workspaceId, viewId]);
  if (viewContextKey.current !== activeViewKey) { viewContextKey.current = activeViewKey; viewContext.current += 1; }
  function markViewEdited() { viewChangeVersion.current += 1; changedViews.current.add(activeViewKey); setViewDirty(true); }
  function updateViewMetadata(key, value) {
    if ((viewMetadata[key] ?? '') === value) return;
    markViewEdited();
    setViewMetadata({ ...viewMetadata, [key]: value });
  }
  function cacheCurrentView() {
    if (changedViews.current.has(activeViewKey)) localViewDrafts.current.set(activeViewKey, { root: viewRoot, groups: viewGroups, annotations: viewAnnotations, metadata: viewMetadata, revision: savedViewRevision, loaded: viewLoaded });
    else localViewDrafts.current.delete(activeViewKey);
  }
  function updateOpenViews(ids) {
    setOpenViewIds(ids);
    try { localStorage.setItem(`chargeweave.studio.views.v1.${connection.workspaceId}`, JSON.stringify(ids.slice(0, 50))); }
    catch { /* Open views remain available for this session. */ }
  }
  function switchView(nextViewId) {
    if (nextViewId === viewId) return;
    cacheCurrentView();
    if (!openViewIds.includes(nextViewId)) updateOpenViews([...openViewIds, nextViewId]);
    setViewId(nextViewId);
    setViewIdInput(nextViewId);
  }
  function openSavedView(nextViewId) {
    pauseFollowing();
    setEditorDocument('diagram'); setCompactSurface('diagram');
    setPendingSavedView({ workspaceId: connection.workspaceId, viewId: nextViewId });
    if (nextViewId !== viewId) switchView(nextViewId);
  }
  function closeView(id) {
    if (openViewIds.length < 2) return;
    const key = JSON.stringify([connection?.endpoint, connection?.workspaceId, id]);
    if (pendingViewOps[key]) return;
    if (changedViews.current.has(key)) {
      if (!window.confirm(`Close ${id} and discard its local view changes? The shared view will not be changed.`)) return;
      try {
        sessionStorage.removeItem(canvasPositionKey(connection.workspaceId, id));
        if (id === 'default') sessionStorage.removeItem(`chargeweave.canvas.v1.${connection.workspaceId}`);
      } catch { setViewNotice('Could not discard the local layout. Check browser storage access and try again.'); return; }
      changedViews.current.delete(key);
      localViewDrafts.current.delete(key);
      if (id === viewId) { viewChangeVersion.current += 1; setViewDirty(false); }
    }
    const remaining = openViewIds.filter(item => item !== id);
    const next = id === viewId ? remaining[Math.max(0, openViewIds.indexOf(id) - 1)] : viewId;
    if (id === viewId) switchView(next);
    updateOpenViews(remaining);
    setWorkspaceFocus({ kind: 'view', id: next });
  }
  function focusViewRoot(name) {
    if (viewRoot && viewRoot !== name) markViewEdited();
    setViewRoot(name);
    setRootHistory(previous => {
      if (previous.entries[previous.index] === name) return previous;
      const entries = [...previous.entries.slice(0, previous.index + 1), name].slice(-50);
      return { entries, index: entries.length - 1 };
    });
  }
  function navigateViewHistory(offset) {
    const index = rootHistory.index + offset;
    if (index < 0 || index >= rootHistory.entries.length) return;
    setRootHistory({ ...rootHistory, index });
    markViewEdited();
    setViewRoot(rootHistory.entries[index]);
    pauseFollowing();
  }
  function selectConcept(item, { focusView = true } = {}) {
    if (!item) return false;
    if (commandInFlight.current && item.name !== selected?.name) { setError('Wait for the model change to finish before selecting another concept.'); return false; }
    if (item.name === selected?.name) { if (focusView) focusViewRoot(item.name); return true; }
    selectionGeneration.current += 1;
    if (hasUnsavedInspectorEdits()) { setPendingSelection({ kind: 'concept-selection', name: item.name, item, focusView }); return false; }
    setSelected(item); setDefinition(item.definition); if (focusView) focusViewRoot(item.name); return true;
  }
  function inspectFromNavigator(item) {
    pauseFollowing();
    const inspecting = Boolean(viewRoot);
    if (selectConcept(item, { focusView: !inspecting })) {
      if (!inspecting) setEditorDocument('diagram');
      if (window.matchMedia('(max-width: 900px)').matches) openCompactPane(inspecting ? 'studio-inspector-pane' : 'studio-editor-pane');
      else if (inspecting && window.matchMedia('(max-width: 1399px)').matches) setHideInspector(false);
    }
  }
  function toggleExplorerConcept(name) {
    const scope = JSON.stringify([connection.endpoint, connection.workspaceId]);
    setExplorerExpansion(previous => {
      const names = previous[scope] || [];
      return { ...previous, [scope]: names.includes(name) ? names.filter(item => item !== name) : [...names, name] };
    });
  }
  function openConceptView(item) {
    pauseFollowing();
    if (selectConcept(item)) {
      setEditorDocument('diagram');
      if (window.matchMedia('(max-width: 900px)').matches) openCompactPane('studio-editor-pane');
    }
  }
  function discardDefinitionAndSelect() {
    if (!pendingSelection) return;
    setFieldEdit(null); setValueConstraint(null); setField({ name: '', range: 'string', cardinality: '?' }); setRelationshipDraft(null); setIntervalRule({ startProperty: '', endProperty: '', ruleId: '' }); setBinding({ property: '', label: '', category: 'ownership' }); setTemporalBaseline(null);
    if (['workspace-switch', 'disconnect'].includes(pendingSelection.kind)) setNewClass({ name: '', module: 'foundation', parent: 'Record', definition: '' });
    if (pendingSelection.kind === 'disconnect') {
      setPendingSelection(null);
      void disconnect(true);
      return;
    }
    if (pendingSelection.kind === 'workspace-switch') {
      const id = pendingSelection.workspaceId;
      setPendingSelection(null);
      switchWorkspace(id, true);
      return;
    }
    setSelected(pendingSelection.item); setDefinition(pendingSelection.item.definition);
    if (pendingSelection.focusView) { focusViewRoot(pendingSelection.item.name); setEditorDocument('diagram'); }
    else if (window.matchMedia('(min-width: 901px) and (max-width: 1399px)').matches) setHideInspector(false);
    if (window.matchMedia('(max-width: 900px)').matches) setCompactSurface(pendingSelection.focusView ? 'diagram' : 'inspector');
    setPendingSelection(null);
  }
  function startFieldEdit(item, trigger) {
    fieldEditTrigger.current = trigger;
    const range = item.values ? `{${item.values.join(',')}}` : item.range;
    setFieldEdit({ name: item.property, expectedRange: range, expectedCardinality: item.cardinality, range, cardinality: item.cardinality });
  }
  function startValueConstraint(item, trigger) {
    if (snapshot.changeSet && snapshot.changeSet.status !== 'draft') return;
    valueConstraintTrigger.current = trigger;
    setValueConstraint({ name: item.property, owner: selected.name, original: [...item.values], values: [...item.values], expectedRange: `{${item.values.join(',')}}`, expectedCardinality: item.cardinality, revision: snapshot.revision, eventSequence: snapshot.eventSequence, workspaceId: connection.workspaceId, changeSetId: snapshot.changeSet?.id ?? null, changeSetUpdatedAt: snapshot.changeSet?.updatedAt ?? null });
  }
  function cancelValueConstraint() {
    const name = valueConstraint?.name;
    setValueConstraint(null);
    requestAnimationFrame(() => {
      const trigger = valueConstraintTrigger.current?.isConnected ? valueConstraintTrigger.current : [...document.querySelectorAll('.studio-field-table button')].find(button => button.textContent === `Narrow values for ${name}`);
      trigger?.focus();
    });
  }
  async function applyValueConstraint() {
    const draft = valueConstraint;
    if (!draft || !entityInfo || entityRevision !== snapshot.revision || entityInfo.name !== draft.owner || draft.workspaceId !== connection.workspaceId || draft.revision !== snapshot.revision || draft.changeSetId !== (snapshot.changeSet?.id ?? null) || draft.changeSetUpdatedAt !== (snapshot.changeSet?.updatedAt ?? null) || (snapshot.changeSet && snapshot.changeSet.status !== 'draft') || draft.values.length < 2 || draft.values.length >= draft.original.length) return;
    if (await applyCommand({ type: 'constraint.add', template: 'allowed-values', owner: draft.owner, name: draft.name, expectedRange: draft.expectedRange, expectedCardinality: draft.expectedCardinality, values: draft.values }, draft.revision, draft.eventSequence)) setValueConstraint(null);
  }
  function cancelFieldEdit() {
    const name = fieldEdit?.name;
    setFieldEdit(null);
    requestAnimationFrame(() => {
      const trigger = fieldEditTrigger.current?.isConnected ? fieldEditTrigger.current : [...document.querySelectorAll('.studio-field-table button')].find(button => button.textContent === `Edit ${name}`);
      trigger?.focus();
    });
  }
  async function updateField(event) {
    event.preventDefault();
    if (!entityInfo || fieldEditConflict || entityRevision !== snapshot.revision || entityInfo.name !== selected?.name) return;
    if (await applyCommand({ type: 'property.update', owner: selected.name, ...fieldEdit })) setFieldEdit(null);
  }

  async function inspectImpact() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_change_impact_get', arguments: { workspaceId: connection.workspaceId, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) setImpact(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  async function inspectIncoming(offset = 0) {
    if (!connection || !snapshot || !selected) return;
    const request = ++incomingRequest.current;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_incoming_get', arguments: { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision, offset, limit: 50 } });
      const page = response.structuredContent;
      if (request !== incomingRequest.current || page.revision !== currentRevision.current) return;
      setIncoming(previous => offset && previous?.workspaceId === page.workspaceId && previous.root === page.root && previous.revision === page.revision && previous.nextOffset === offset ? { ...page, results: [...previous.results, ...page.results] } : page);
    } catch (problem) { if (request === incomingRequest.current) setError(problem.message); }
  }
  async function inspectPublication() {
    setError('');
    const request = ++publicationRequest.current;
    const signal = connectionAbort.current?.signal;
    const workspaceId = connection.workspaceId;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_preflight', arguments: { workspaceId, expectedRevision: snapshot.revision } }, signal);
      if (!signal?.aborted && request === publicationRequest.current && response.structuredContent.workspaceId === workspaceId && response.structuredContent.revision === currentRevision.current) setPublication(response.structuredContent);
    } catch (problem) { if (!signal?.aborted && request === publicationRequest.current) setError(problem.message); }
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
        const selected = selectConcept(response.structuredContent.entity);
        if (selected) setEditorDocument('diagram');
        if (selected && window.matchMedia('(max-width: 900px)').matches) openCompactPane('studio-editor-pane');
        return selected;
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
    if (hasUnsavedInspectorEdits()) { pauseFollowing(); return; }
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
        selectConcept(response.structuredContent.entity);
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
  async function selectPerspectiveConcept(name, { focusView = true } = {}) {
    pauseFollowing(); setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name, expectedRevision: snapshot.revision } });
      if (response.structuredContent.revision === currentRevision.current) {
        const selected = selectConcept(response.structuredContent.entity, { focusView });
        if (selected && focusView) setEditorDocument('diagram');
        if (selected && window.matchMedia('(max-width: 900px)').matches) openCompactPane(focusView ? 'studio-editor-pane' : 'studio-inspector-pane');
        return selected;
      }
    } catch (problem) { setError(problem.message); }
    return false;
  }
  async function saveLayout() {
    if (viewReadyKey !== activeViewKey) return;
    const context = viewContext.current;
    const version = viewChangeVersion.current;
    if (viewOperation.current?.context === context) return;
    const operation = { context, kind: 'save' };
    setPendingViewOps(previous => ({ ...previous, [activeViewKey]: (previous[activeViewKey] || 0) + 1 }));
    viewOperation.current = operation; setViewBusy(operation); setViewNotice('');
    try {
      const positions = readCanvasPositions(sessionStorage, connection.workspaceId, viewId, { strict: true });
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_save', arguments: { workspaceId: connection.workspaceId, viewId, operationId: crypto.randomUUID(), expectedViewRevision: savedViewRevision, definition: { root: viewRoot, positions, ...viewMetadata, groups: viewGroups, annotations: viewAnnotations } } });
      if (context !== viewContext.current) return;
      setSavedViewRevision(response.structuredContent.viewRevision); if (version === viewChangeVersion.current) { changedViews.current.delete(activeViewKey); localViewDrafts.current.delete(activeViewKey); setViewDirty(false); } setViewNotice('Shared view saved.');
      const listRequest = ++savedViewsRequest.current;
      try {
        const listing = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_list', arguments: { workspaceId: connection.workspaceId } });
        if (context === viewContext.current && listRequest === savedViewsRequest.current && listing.structuredContent.workspaceId === connection.workspaceId) { setSavedViews(listing.structuredContent.views); setSavedViewsState({ workspaceId: connection.workspaceId, status: 'ready', truncated: listing.structuredContent.truncated }); }
      } catch (problem) {
        if (context === viewContext.current && listRequest === savedViewsRequest.current) { setSavedViewsState({ workspaceId: connection.workspaceId, status: 'error', truncated: false }); setViewNotice(`Shared view saved, but the view list could not be refreshed: ${problem.message}`); }
      }
    } catch (problem) { if (context === viewContext.current) setViewNotice(`Could not save view: ${problem.message}. Load the shared view to refresh its revision.`); }
    finally { setPendingViewOps(previous => ({ ...previous, [activeViewKey]: Math.max(0, (previous[activeViewKey] || 1) - 1) })); if (viewOperation.current === operation) { viewOperation.current = null; setViewBusy(null); } }
  }
  async function loadLayout() {
    if (viewReadyKey !== activeViewKey) return;
    if (viewDirty && !window.confirm('Loading the shared view will replace local changes to this view. Continue?')) return;
    const context = viewContext.current;
    const version = viewChangeVersion.current;
    if (viewOperation.current?.context === context) return;
    const operation = { context, kind: 'load' };
    setPendingViewOps(previous => ({ ...previous, [activeViewKey]: (previous[activeViewKey] || 0) + 1 }));
    viewOperation.current = operation; setViewBusy(operation); setViewNotice('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_saved_get', arguments: { workspaceId: connection.workspaceId, viewId } });
      if (context !== viewContext.current) return;
      const saved = response.structuredContent;
      if (!saved.definition) { setViewNotice('No shared view has been saved.'); return; }
      const entity = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_entity_get', arguments: { workspaceId: connection.workspaceId, name: saved.definition.root, expectedRevision: snapshot.revision } });
      if (context !== viewContext.current || entity.structuredContent.revision !== currentRevision.current) return;
      if (version !== viewChangeVersion.current) { setViewNotice('The shared view was not loaded because this view changed while it was loading.'); return; }
      pauseFollowing();
      if (selectConcept(entity.structuredContent.entity)) { writeCanvasPositions(sessionStorage, connection.workspaceId, viewId, saved.definition.positions); setViewGroups(saved.definition.groups ?? []); setViewAnnotations(saved.definition.annotations ?? []); setViewMetadata(Object.fromEntries(['mappingVersion', 'viewpoint', 'filter'].filter(key => Object.hasOwn(saved.definition, key)).map(key => [key, saved.definition[key]]))); setSavedViewRevision(saved.viewRevision); setViewLoaded(true); changedViews.current.delete(activeViewKey); localViewDrafts.current.delete(activeViewKey); setViewDirty(false); viewChangeVersion.current += 1; setCanvasVersion(version => version + 1); setViewNotice('Shared view loaded.'); }
      else setViewNotice('The saved view was not loaded. Resolve any unapplied inspector edits and try again.');
    } catch (problem) { if (context === viewContext.current) setViewNotice(`Could not load view: ${problem.message}`); }
    finally { setPendingViewOps(previous => ({ ...previous, [activeViewKey]: Math.max(0, (previous[activeViewKey] || 1) - 1) })); if (viewOperation.current === operation) { viewOperation.current = null; setViewBusy(null); } }
  }
  useEffect(() => {
    if (!pendingSavedView) return;
    if (!connection || pendingSavedView.workspaceId !== connection.workspaceId || pendingSavedView.viewId !== viewId) { setPendingSavedView(null); return; }
    if (viewReadyKey !== activeViewKey || savedViewRevision === null || pendingViewOps[activeViewKey]) return;
    setPendingSavedView(null);
    if (viewDirty) { setViewNotice('Local view changes were retained. Use Load shared view to replace them after review.'); return; }
    void loadLayout();
  }, [pendingSavedView, connection, viewId, viewReadyKey, activeViewKey, savedViewRevision, viewDirty, pendingViewOps]);
  async function exportView() {
    setViewNotice('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_view_manifest_get', arguments: { workspaceId: connection.workspaceId, viewId } });
      const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(response.structuredContent, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = objectUrl; link.download = `chargeweave-view-${viewId}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setViewNotice('Saved view exported.');
    } catch (problem) { setViewNotice(`Could not export view: ${problem.message}`); }
  }
  function openRelationshipAuthoring() {
    if (!window.matchMedia('(max-width: 900px)').matches) setHideInspector(false);
    setCompactSurface('inspector');
    requestAnimationFrame(() => {
      const details = document.getElementById('studio-add-field');
      if (details) { details.open = true; details.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); details.querySelector('input')?.focus(); }
    });
  }

  async function inspectTemporal() {
    setError('');
    if (temporalBaseline && temporalBaseline.root === selected?.name && temporalPolicy !== (temporalBaseline.policy ?? 'snapshot-versioned')) { setError('Apply or discard the temporal policy edit before refreshing the perspective.'); return; }
    const request = ++temporalRequest.current;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_temporal_view_get', arguments: { workspaceId: connection.workspaceId, root: selected.name, expectedRevision: snapshot.revision } });
      if (request === temporalRequest.current && response.structuredContent.revision === currentRevision.current && response.structuredContent.root === selected.name) {
        setTemporal(response.structuredContent);
        setTemporalBaseline({ root: selected.name, policy: response.structuredContent.policy });
        setTemporalPolicy(response.structuredContent.policy ?? 'snapshot-versioned');
      }
    } catch (problem) { if (request === temporalRequest.current) setError(problem.message); }
  }
  async function saveTemporalPolicy(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'temporal.policy_set', className: selected.name, expectedPolicy: temporal.policy, policy: temporalPolicy })) setTemporalBaseline({ root: selected.name, policy: temporalPolicy });
  }

  async function runSearch(searchQuery, sequence, signal) {
    setSearchPending(true);
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_context_search', arguments: { workspaceId: connection.workspaceId, query: searchQuery, expectedRevision: snapshot.revision } }, signal);
      if (sequence === searchSequence.current && response.structuredContent.revision === currentRevision.current) { setResults(response.structuredContent.results); setSearchDone(true); }
    } catch (problem) { if (!signal?.aborted && sequence === searchSequence.current) setError(problem.message); }
    finally { if (sequence === searchSequence.current) setSearchPending(false); }
  }
  function search(event) {
    event.preventDefault(); setError('');
    lastSearch.current = { workspaceId: connection.workspaceId, query };
    const sequence = ++searchSequence.current;
    void runSearch(query, sequence);
  }
  async function saveDefinition(event) {
    event.preventDefault();
    if (definitionConflict || entityRevision !== snapshot.revision || entityInfo?.name !== selected?.name) return;
    if (await applyCommand({ type: 'class.describe', name: selected.name, definition })) setSelected({ ...selected, definition });
  }
  async function applyCommand(command, expectedRevision = snapshot.revision, expectedEventSequence) {
    if (commandInFlight.current) return false;
    commandInFlight.current = true; setCommandPending(true);
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_apply', arguments: {
        workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision, ...(expectedEventSequence === undefined ? {} : { expectedEventSequence }), ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), ...(rationale.trim() ? { rationale: rationale.trim() } : {}), commands: [command],
      } });
      setStatus('Saved; awaiting workspace update');
      setRationale('');
      return true;
    } catch (problem) { setError(problem.message); return false; }
    finally { commandInFlight.current = false; setCommandPending(false); setError(current => current === 'Wait for the model change to finish before selecting another concept.' ? '' : current); }
  }
  async function addClass(event) {
    event.preventDefault();
    if (/[|\r\n]/.test(newClass.definition)) { setError('Class definitions must be a single line and cannot contain |.'); return; }
    const pending = { name: newClass.name, workspaceId: connection.workspaceId, minimumRevision: snapshot.revision + 1, selectionGeneration: selectionGeneration.current };
    if (await applyCommand({ type: 'class.add', ...newClass })) {
      setNewClass({ name: '', module: newClass.module, parent: 'Record', definition: '' });
      setPendingCreatedConcept(pending);
    }
  }
  async function addField(event) {
    event.preventDefault();
    if (await applyCommand({ type: 'property.add', owner: selected.name, ...field })) setField({ name: '', range: 'string', cardinality: '?' });
  }
  function startRelationship(source, target) {
    if (commandInFlight.current || !source || !target || graph?.revision !== snapshot.revision) return;
    pauseFollowing();
    relationshipOrigin.current = document.activeElement;
    setRelationshipDraft({ source, target, name: '', description: '', cardinality: '?', revision: snapshot.revision });
  }
  function cancelRelationship() {
    if (commandInFlight.current) return;
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
  async function undoLatest(candidate) {
    if (commandInFlight.current) return;
    if (!candidate || candidate.revision !== currentRevision.current || candidate.workspaceId !== connection?.workspaceId) {
      setUndoCandidate(null);
      setError('The draft changed before undo. Review the latest change and try again.');
      return;
    }
    commandInFlight.current = true; setCommandPending(true);
    setError('');
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_undo', arguments: { workspaceId: candidate.workspaceId, operationId: crypto.randomUUID(), expectedRevision: candidate.revision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), targetRevision: candidate.revision } });
      setUndoCandidate(null);
      setStatus('Saved; awaiting workspace update');
    } catch (problem) { setError(problem.message); }
    finally { commandInFlight.current = false; setCommandPending(false); setError(current => current === 'Wait for the model change to finish before selecting another concept.' ? '' : current); }
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
    const request = ++historyRequest.current;
    setHistoryPending(true);
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_history_detail', arguments: { workspaceId: connection.workspaceId, revision } });
      if (request === historyRequest.current) setHistoryDetail(response.structuredContent);
    } catch (problem) { if (request === historyRequest.current) setError(problem.message); }
    finally { if (request === historyRequest.current) setHistoryPending(false); }
  }
  function closeHistory() { historyRequest.current += 1; setHistoryDetail(null); setHistoryPending(false); }
  async function inspectChanges() {
    setError('');
    const request = ++diffRequest.current;
    const signal = connectionAbort.current?.signal;
    const workspaceId = connection.workspaceId;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_diff', arguments: { workspaceId } }, signal);
      if (signal?.aborted || request !== diffRequest.current) return false;
      if (response.structuredContent.workspaceId !== workspaceId || response.structuredContent.revision !== currentRevision.current) {
        setError('The draft changed while changes were loading. Open changes again for the current revision.');
        return false;
      }
      setDiff(response.structuredContent);
      return true;
    } catch (problem) { if (!signal?.aborted && request === diffRequest.current) setError(problem.message); return false; }
  }
  async function reviewDraftChanges() {
    if (await inspectChanges()) { setEditorDocument('changes'); setCompactSurface('diagram'); setWorkspaceFocus({ kind: 'review' }); }
  }
  async function inspectReadiness() {
    setError('');
    const request = ++readinessRequest.current;
    const signal = connectionAbort.current?.signal;
    const workspaceId = connection.workspaceId;
    const epoch = readinessEpoch.current;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_readiness', arguments: { workspaceId } }, signal);
      const readiness = response.structuredContent;
      if (signal?.aborted || request !== readinessRequest.current) return;
      if (readiness.workspaceId !== workspaceId || readiness.revision !== currentRevision.current) {
        setError('The draft changed while review gates were loading. Inspect the current revision again.');
        return;
      }
      if (epoch !== readinessEpoch.current) { setError('Review evidence changed while gates were loading. Inspect them again.'); return; }
      const decisionsRequest = ++reviewDecisionsRequest.current;
      const history = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_decisions', arguments: { workspaceId } }, signal);
      if (signal?.aborted || request !== readinessRequest.current) return;
      if (readiness.revision !== currentRevision.current) {
        setError('The draft changed while review gates were loading. Inspect the current revision again.');
        return;
      }
      if (epoch !== readinessEpoch.current) { setError('Review evidence changed while gates were loading. Inspect them again.'); return; }
      setReadiness(readiness);
      if (decisionsRequest === reviewDecisionsRequest.current) { setReviews(history.structuredContent.decisions); setDecisionsLoaded(true); }
    } catch (problem) { if (!signal?.aborted && request === readinessRequest.current) setError(`Unable to inspect review gates: ${problem.message}`); }
  }
  async function submitReview(event) {
    event.preventDefault(); setError('');
    const signal = connectionAbort.current?.signal;
    const workspaceId = connection.workspaceId;
    reviewDecisionsRequest.current += 1;
    setDecisionsLoaded(false);
    try {
      await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_changeset_review', arguments: { workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, ...(snapshot.changeSet ? { changeSetId: snapshot.changeSet.id } : {}), sourceDigest: snapshot.sourceDigest, decision: reviewDecision, reason: reviewReason } }, signal);
      if (signal?.aborted) return;
      setReviewReason('');
      const request = ++reviewDecisionsRequest.current;
      setDecisionsLoaded(false);
      const history = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_review_decisions', arguments: { workspaceId } }, signal);
      if (!signal?.aborted && request === reviewDecisionsRequest.current) { setReviews(history.structuredContent.decisions); setDecisionsLoaded(true); }
    } catch (problem) { if (!signal?.aborted) setError(problem.message); }
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
    const request = ++commitChecksRequest.current;
    const signal = connectionAbort.current?.signal;
    const sha = commitSha;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_github_commit_workflows', arguments: { workspaceId: connection.workspaceId, commitSha: sha } }, signal);
      if (!signal?.aborted && request === commitChecksRequest.current && response.structuredContent.sha === sha) setCommitWorkflows(response.structuredContent);
    } catch (problem) { if (!signal?.aborted && request === commitChecksRequest.current) setError(problem.message); }
  }
  async function inspectRequiredChecks() {
    setError('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_github_required_checks', arguments: { workspaceId: connection.workspaceId, commitSha } });
      setRequiredChecks(response.structuredContent);
    } catch (problem) { setError(problem.message); }
  }
  async function runChecks(profile) {
    if (checkInFlight.current) return;
    const epoch = ++jobEpoch.current, signal = connectionAbort.current?.signal;
    const valid = () => !signal?.aborted && epoch === jobEpoch.current;
    checkInFlight.current = true;
    invalidateReadiness();
    setCheckStarting(true);
    setError('');
    try {
      let response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_validation_start', arguments: { workspaceId: connection.workspaceId, operationId: crypto.randomUUID(), expectedRevision: snapshot.revision, sourceDigest: snapshot.sourceDigest, profile } }, signal);
      if (!valid()) return;
      let current = response.structuredContent;
      setJob(current);
      while (['queued', 'running', 'cancelling'].includes(current.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!valid()) return;
        response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_job_get', arguments: { workspaceId: connection.workspaceId, jobId: current.id } }, signal);
        if (!valid()) return;
        current = response.structuredContent; setJob(current);
      }
    } catch (problem) { if (valid()) setError(problem.message); }
    finally { if (valid()) { invalidateReadiness(); checkInFlight.current = false; setCheckStarting(false); } }
  }
  async function inspectPublicationHistory() {
    const signal = connectionAbort.current?.signal;
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_history', arguments: { workspaceId: connection.workspaceId } }, signal);
      if (signal?.aborted) return;
      const capabilities = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_publication_capabilities', arguments: { workspaceId: connection.workspaceId } }, signal);
      if (signal?.aborted) return;
      setPublicationHistory(response.structuredContent.publications);
      setCanPush(capabilities.structuredContent.canPush);
    } catch (problem) { if (!signal?.aborted) throw problem; }
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
      let current = response.structuredContent; jobEpoch.current += 1; checkInFlight.current = false; setCheckStarting(false); setJob(current);
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
      let current = response.structuredContent; jobEpoch.current += 1; checkInFlight.current = false; setCheckStarting(false); setJob(current);
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
      let current = response.structuredContent; jobEpoch.current += 1; checkInFlight.current = false; setCheckStarting(false); setJob(current);
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
    invalidateReadiness();
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
      if (!/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|0{8}-0{4}-0{4}-0{4}-0{12}|f{8}-f{4}-f{4}-f{4}-f{12})$/i.test(workspaceId.trim())) throw new Error('Workspace ID must be a UUID, such as 12345678-1234-4123-8123-123456789abc. The draft token is a separate value.');
      setConnection({ endpoint: url.origin, token, workspaceId: workspaceId.trim() });
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
  async function disconnect(discardUnsaved = false) {
    if (commandInFlight.current) { setError('Wait for the model change to finish before disconnecting.'); return; }
    if (!discardUnsaved && hasUnsavedWorkspaceEdits()) {
      setPendingSelection({ kind: 'disconnect', name: 'disconnect' });
      return;
    }
    cacheCurrentView();
    connectionAbort.current?.abort();
    setWorkspaceFocus(null);
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
  function switchWorkspace(id, discardUnsaved = false) {
    if (commandInFlight.current) { setError('Wait for the model change to finish before switching workspaces.'); return; }
    if (!connection || id === connection.workspaceId) return;
    if (!discardUnsaved && hasUnsavedWorkspaceEdits()) {
      const workspace = workspaces.find(item => item.workspaceId === id);
      setPendingSelection({ kind: 'workspace-switch', workspaceId: id, name: workspace?.title ?? 'the selected workspace' });
      return;
    }
    cacheCurrentView();
    connectionAbort.current?.abort();
    setWorkspaceFocus(null);
    followGeneration.current += 1; currentRevision.current = null; cursor.current = 0;
    setSnapshot(null); setSelected(null); setGraph(null); setEntityInfo(null); setTemporal(null); setResponsibility(null); setImpact(null);
    setResults([]); setSearchDone(false); setHistory([]); setHistoryDetail(null); setDiff(null); setJob(null); setReadiness(null); setReviews([]); setPublication(null); setPublicationHistory([]); setCommitWorkflows(null); setRequiredChecks(null); setRequirements([]); setViewId('default'); setViewIdInput('default'); setError('');
    setWorkspaceId(id); setConnection({ ...connection, workspaceId: id });
  }
  async function createWorkspace(event) {
    event.preventDefault();
    const creationPanel = event.currentTarget.closest('details');
    if (commandInFlight.current) { setError('Wait for the model change to finish before creating a workspace.'); return; }
    setError(''); setCreatingWorkspace(true);
    const title = workspaceTitle.trim(), baselineCommit = workspaceBaseline.trim();
    const key = JSON.stringify({ title, baselineCommit });
    if (creationOperation.current?.key !== key) creationOperation.current = { key, id: crypto.randomUUID() };
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_workspace_create', arguments: { title, baselineCommit, operationId: creationOperation.current.id } });
      const created = response.structuredContent;
      setWorkspaces(current => [...current.filter(item => item.workspaceId !== created.workspaceId), created]);
      if (creationPanel) creationPanel.open = false;
      creationOperation.current = null; setWorkspaceTitle(''); switchWorkspace(created.workspaceId);
    } catch (problem) { setError(problem.message); } finally { setCreatingWorkspace(false); }
  }
  async function copyConnectionValue(value, label) {
    try { await navigator.clipboard.writeText(value); setConnectionCopyMessage(`${label} copied.`); }
    catch { setConnectionCopyMessage(`Clipboard unavailable; copy the ${label.toLowerCase()} shown below.`); }
  }
  const latestChange = history.filter(event => event.payload.commands?.length && eventConcept(event)).at(-1);
  const explorerScope = connection ? JSON.stringify([connection.endpoint, connection.workspaceId]) : '';
  const undoEvent = [...history].reverse().find(event => event.revision === snapshot?.revision && event.payload.commands?.length);
  const currentField = fieldEdit && entityInfo?.fields.find(item => !item.inherited && item.property === fieldEdit.name);
  const currentFieldRange = currentField?.values ? `{${currentField.values.join(',')}}` : currentField?.range;
  const fieldEditConflict = Boolean(fieldEdit && entityInfo && (!currentField || currentFieldRange !== fieldEdit.expectedRange || currentField.cardinality !== fieldEdit.expectedCardinality));
  function showValidation(event) {
    event?.preventDefault();
    setCompactSurface('results');
    const toggle = document.querySelector('button[aria-controls="studio-validation-content"]');
    if (toggle?.getAttribute('aria-expanded') === 'false') toggle.click();
    setDockPanel('checks');
    setWorkspaceFocus({ kind: 'validation' });
  }
  return <main id="main" className="container modelling-studio">
    <header className="studio-app-bar"><a href={import.meta.env.BASE_URL} className="studio-home-link">ChargeWeave</a><h1>Ontology modelling studio</h1><StudioThemeControl />{connection && <div className="studio-workspaces"><label>Current workspace <select value={connection.workspaceId} disabled={commandPending} onChange={event => switchWorkspace(event.target.value)}>{workspaces.map(item => <option key={item.workspaceId} value={item.workspaceId}>{item.title}</option>)}</select></label>{canCreateWorkspace && <details><summary>Create a workspace</summary><form onSubmit={createWorkspace}><label>New workspace title <input value={workspaceTitle} onChange={event => setWorkspaceTitle(event.target.value)} maxLength={120} required /></label><label>Baseline commit SHA <input value={workspaceBaseline} onChange={event => setWorkspaceBaseline(event.target.value)} pattern="[a-f0-9]{40}" required /></label><button disabled={creatingWorkspace || commandPending}>{creatingWorkspace ? 'Creating workspace…' : 'Create workspace'}</button></form></details>}</div>}{snapshot && <button ref={commandTrigger} type="button" disabled={!online} onClick={() => setCommandsOpen(true)} title="Ctrl+Shift+P">Commands</button>}</header>
    {commandsOpen && snapshot && online && <CommandPalette onClose={() => setCommandsOpen(false)} commands={[
      { label: 'Search model', run: focusModelSearch },
      { label: 'Add a concept', run: openConceptCreator },
      { label: 'Focus diagram', run: () => openCompactPane('studio-editor-pane') },
      { label: 'Open inspector', run: () => openCompactPane('studio-inspector-pane') },
      ...(!checkStarting && !['queued', 'running', 'cancelling'].includes(job?.status) ? [{ label: 'Check draft', run: () => runChecks(checkProfile) }] : []),
      { label: 'Show check details', run: showValidation },
      { label: 'Review draft changes', run: () => openWorkspaceTask(null, 'studio-review-workflow-heading') },
    ]} />}
    {!connection && <p>Use Codex to propose changes; inspect and refine them here.</p>}
    <form className="studio-connect" onSubmit={pair} hidden={Boolean(connection)}>
      <label>Pairing code <input type="password" value={pairingCode} onChange={event => setPairingCode(event.target.value)} required autoComplete="off" /></label>
      <button type="submit">Pair local studio</button>
    </form>
    <details className="studio-advanced-connection" hidden={Boolean(connection)}><summary>Advanced connection with workspace ID and token</summary>
    <form className="studio-connect" onSubmit={connect}>
      <label>Local service <input value={endpoint} onChange={event => setEndpoint(event.target.value)} required /></label>
      <label>Workspace ID <input value={workspaceId} onChange={event => setWorkspaceId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required /></label>
      <label>Draft token <input type="password" value={token} onChange={event => setToken(event.target.value)} required autoComplete="off" /></label>
      <button type="submit">Connect</button>
    </form></details>
    <p role="status" aria-label="Studio connection status" className={snapshot ? "studio-sr-status" : undefined}>{status}{snapshot && ` · revision ${snapshot.revision} · baseline ${snapshot.baselineCommit}`}</p>

    {error && <p role="alert">{error}</p>}{jobRestoreNotice && <p role="status">{jobRestoreNotice}</p>}
    {pendingSelection && <dialog ref={unsavedDialog} aria-labelledby="studio-unsaved-heading" className="studio-unsaved-dialog" onCancel={event => { event.preventDefault(); setPendingSelection(null); }}><h2 id="studio-unsaved-heading">Unapplied edits</h2><p>You have unapplied edits. Stay to apply them, or discard them and {pendingSelection.kind === 'disconnect' ? 'disconnect' : `open ${pendingSelection.name}`}.</p><button type="button" onClick={() => setPendingSelection(null)}>Stay and keep editing</button><button type="button" onClick={discardDefinitionAndSelect}>{pendingSelection.kind === 'disconnect' ? 'Discard and disconnect' : `Discard and open ${pendingSelection.name}`}</button></dialog>}
    {snapshot && <fieldset className="studio-workspace" data-compact-surface={compactSurface} disabled={!online} onFocusCapture={event => { if (event.target.matches('input:not([type=checkbox]), textarea, select, [contenteditable=true]')) pauseFollowing(); }}><legend className="sr-only">Modelling workspace</legend><div className="studio-primary-actions">{commandPending && <span aria-live="polite">Saving model change…</span>}<div className="studio-check-action"><button type="button" onClick={() => runChecks(checkProfile)} disabled={checkStarting || ['queued', 'running', 'cancelling'].includes(job?.status)}>Check draft</button><label className="sr-only" htmlFor="studio-check-profile">Check profile</label><select id="studio-check-profile" value={checkProfile} onChange={event => setCheckProfile(event.target.value)} disabled={checkStarting || ['queued', 'running', 'cancelling'].includes(job?.status)} title="Choose the scope of checks"><option value="structural">Structural generation</option><option value="reference">Reference and negative fixtures</option><option value="audit">Business traceability audit</option><option value="acceptance">Release gates</option><option value="maintenance-demo">Synthetic maintenance fixture</option></select></div><button type="button" onClick={event => openWorkspaceTask(event, 'studio-review-workflow-heading')}>Review draft changes</button>{job && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) && <button type="button" onClick={showValidation}>View check details</button>}{job && <span>Latest {job.profile} operation: {job.status}{job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' · out of date' : ''}</span>}</div><nav className="studio-destinations" aria-label="Workspace destinations"><a href="#studio-navigator-pane" onClick={event => { event.preventDefault(); openCompactPane('studio-navigator-pane'); }}>Model</a><a href="#studio-validation-heading" onClick={showValidation}>Checks</a><a href="#studio-activity-heading" onClick={event => openWorkspaceTask(event, 'studio-activity-heading')}>Activity</a><a href="#studio-review-workflow-heading" onClick={event => openWorkspaceTask(event, 'studio-review-workflow-heading')}>Review</a></nav><nav className="studio-mobile-navigation" aria-label="Workspace sections"><button type="button" aria-pressed={compactSurface === 'model'} onClick={() => openCompactPane('studio-navigator-pane')}>Model</button><button type="button" aria-pressed={compactSurface === 'diagram'} onClick={() => openCompactPane('studio-editor-pane')}>Diagram</button><button type="button" aria-pressed={compactSurface === 'inspector'} onClick={() => openCompactPane('studio-inspector-pane')}>Inspector</button><button type="button" aria-pressed={compactSurface === 'results'} onClick={showValidation} aria-controls="studio-bottom-content">Results</button></nav><div className="studio-panel-controls"><button type="button" aria-pressed={!hideNavigator} onClick={() => setHideNavigator(!hideNavigator)}>{hideNavigator ? 'Show navigator' : 'Hide navigator'}</button><button type="button" aria-pressed={!hideInspector} onClick={() => setHideInspector(!hideInspector)}>{hideInspector ? 'Show inspector' : 'Hide inspector'}</button><details className="studio-panel-sizing"><summary>Panel sizes</summary><label>Navigator width <input type="range" min="200" max="360" step="10" value={navigatorWidth} onChange={event => setNavigatorWidth(Number(event.target.value))} /><output>{navigatorWidth} px</output></label><label>Inspector width <input type="range" min="280" max="440" step="10" value={inspectorWidth} onChange={event => setInspectorWidth(Number(event.target.value))} /><output>{inspectorWidth} px</output></label><button type="button" onClick={() => { setNavigatorWidth(240); setInspectorWidth(320); }}>Reset panel sizes</button><button type="button" onClick={() => { setNavigatorWidth(240); setInspectorWidth(320); setDockHeight(Math.min(184, dockLimit)); setHideNavigator(false); setHideInspector(window.matchMedia('(min-width: 901px) and (max-width: 1399px)').matches); }}>Reset layout</button></details></div><div className="studio-panels" data-results-open={Boolean(dockPanel)} data-hide-navigator={hideNavigator} data-hide-inspector={hideInspector} style={{ '--navigator-width': navigatorWidth + 'px', '--inspector-width': inspectorWidth + 'px', '--results-height': dockHeight + 'px' }}><div className="studio-splitter studio-splitter-navigator" role="separator" aria-label="Resize navigator" aria-orientation="vertical" aria-controls="studio-navigator-pane" aria-valuemin={200} aria-valuemax={360} aria-valuenow={navigatorWidth} tabIndex={online ? 0 : -1} hidden={hideNavigator} onPointerDown={event => panePointerDown(event, 'navigator')} onPointerMove={panePointerMove} onPointerUp={() => { paneDrag.current = null; }} onPointerCancel={() => { paneDrag.current = null; }} onKeyDown={event => paneKeyDown(event, 'navigator')} /><div className="studio-splitter studio-splitter-inspector" role="separator" aria-label="Resize inspector" aria-orientation="vertical" aria-controls="studio-inspector-pane" aria-valuemin={280} aria-valuemax={440} aria-valuenow={inspectorWidth} tabIndex={online ? 0 : -1} hidden={hideInspector} onPointerDown={event => panePointerDown(event, 'inspector')} onPointerMove={panePointerMove} onPointerUp={() => { paneDrag.current = null; }} onPointerCancel={() => { paneDrag.current = null; }} onKeyDown={event => paneKeyDown(event, 'inspector')} />
      <section id="studio-navigator-pane" hidden={!isCompact && hideNavigator}><h2 tabIndex={-1}>Discover concepts</h2><form onSubmit={search}><label>Search model <input ref={searchInput} value={query} onChange={event => { searchSequence.current += 1; lastSearch.current = null; setQuery(event.target.value); setResults([]); setSearchDone(false); setSearchPending(false); }} /></label><button>Search</button></form>
        {!searchDone && !query && <div className="studio-browse"><h3>Browse concepts</h3>{!browse ? <p>Loading concepts…</p> : browse.error ? <p role="status">Browse unavailable: {browse.error}. Search remains available.</p> : <><label>Filter by module <select value={browse.module ?? ""} disabled={browsePending} onChange={event => browseModule(event.target.value)}><option value="">All modules</option>{browse.modules.map(item => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}</select></label><p>Showing {browse.results.length} of {browse.total} concepts.</p><BrowseConceptTree browse={browse} connection={connection} revision={snapshot.revision} expandedNames={explorerExpansion[explorerScope] || []} onToggle={toggleExplorerConcept} pending={browsePending} selectedName={selected?.name} onBrowseModule={browseModule} onSelect={inspectFromNavigator} onOpen={openConceptView} />{browsePending && <p aria-live="polite">Loading concepts…</p>}{browse.nextCursor && <button type="button" disabled={browsePending} onClick={loadMoreConcepts}>Load more concepts</button>}</>}</div>}
        {query && <button type="button" onClick={() => { searchSequence.current += 1; lastSearch.current = null; setQuery(''); setResults([]); setSearchDone(false); setSearchPending(false); searchInput.current?.focus(); }}>Clear search</button>}{searchPending && <p aria-live="polite">Searching the current draft…</p>}{searchDone && <><p aria-live="polite">{results.length} matching concept{results.length === 1 ? '' : 's'} shown.</p><p>Search shows up to 25 matches. Refine the query or browse modules to explore more.</p></>}{searchDone && !results.length && <div className="studio-search-empty"><p>No matching concepts. Try a shorter or related term before creating a concept.</p><button type="button" onClick={openConceptCreator}>Create a new concept</button></div>}<ul>{results.map(item => <li key={item.name}><button type="button" title="Select to inspect; double-click or press Enter to focus its neighbourhood" aria-current={item.name === selected?.name ? 'true' : undefined} onClick={() => inspectFromNavigator(item)} onDoubleClick={() => openConceptView(item)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); openConceptView(item); } }}>{item.name}</button> <small>Class · {item.module}</small><p>{item.definition}</p></li>)}</ul><RequirementExplorer connection={connection} snapshot={snapshot} selected={selected} available={availableTools.includes('ontology_requirement_search')} canLink={availableTools.includes('ontology_changeset_apply') && snapshot.editableSources?.includes('requirements/business-requirements.json') && (!snapshot.changeSet || snapshot.changeSet.status === 'draft')} commandPending={commandPending} onInspect={name => selectPerspectiveConcept(name, { focusView: false })} onLink={linkRequirement} /><details className="studio-saved-views"><summary>Saved views</summary><p>Open a shared view without changing the ontology.</p>{savedViewsState.workspaceId !== connection.workspaceId || savedViewsState.status === 'loading' ? <p role="status">Loading saved views?</p> : savedViewsState.status === 'error' ? <><p role="status">Saved views are unavailable.</p><button type="button" onClick={() => setSavedViewsReload(value => value + 1)}>Retry saved views</button></> : savedViews.length ? <><ul>{savedViews.map(view => <li key={view.viewId}><button type="button" aria-current={view.viewId === viewId ? 'true' : undefined} onClick={() => openSavedView(view.viewId)}>Open shared view {view.viewId}</button> <small>revision {view.viewRevision}</small></li>)}</ul>{savedViewsState.truncated && <p>Only the first 100 saved views are shown.</p>}</> : <p>No shared views have been saved.</p>}</details></section>
      <section id="studio-editor-pane" className="studio-editor"><h2 tabIndex={-1}>Workspace</h2><nav className="studio-document-tabs" aria-label="Editor documents"><button type="button" aria-pressed={editorDocument === 'diagram'} aria-controls="studio-diagram-document" onClick={() => setEditorDocument('diagram')}>Diagram view</button><button type="button" aria-pressed={editorDocument === 'changes'} aria-controls="studio-changes-document" onClick={() => { if (diff) setEditorDocument('changes'); else void reviewDraftChanges(); }}>Changes</button><button type="button" aria-pressed={editorDocument === 'review'} aria-controls="studio-review-document" onClick={() => setEditorDocument('review')}>Review</button></nav><div id="studio-diagram-document" hidden={editorDocument !== 'diagram'}><nav className="studio-view-tabs" aria-label="Open diagram views">{openViewIds.map(id => { const changed = changedViews.current.has(JSON.stringify([connection?.endpoint, connection?.workspaceId, id])); return <span className="studio-view-tab" key={id}><button type="button" data-view-id={id} aria-current={id === viewId ? "page" : undefined} aria-label={`${id}${changed ? ", local changes" : ""}`} onClick={() => { switchView(id); setEditorDocument('diagram'); }}>{id}{changed && <span aria-hidden="true"> •</span>}</button><button type="button" className="studio-view-close" aria-label={`Close ${id} view`} disabled={openViewIds.length < 2 || Boolean(pendingViewOps[JSON.stringify([connection?.endpoint, connection?.workspaceId, id])])} title={openViewIds.length < 2 ? "Keep at least one view open" : pendingViewOps[JSON.stringify([connection?.endpoint, connection?.workspaceId, id])] ? "Wait for the view operation to finish" : changed ? "Close and discard local changes" : "Close view"} onClick={() => closeView(id)}>×</button></span>; })}</nav><details id="studio-concept-creator" onToggle={event => setConceptFormOpen(event.currentTarget.open)}><summary>Add a concept</summary><form onSubmit={addClass}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Class name <input pattern="[A-Za-z][A-Za-z0-9]*" maxLength={128} value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required /></label><label>Module {browse?.modules?.length ? <select aria-label="Concept module" value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required><option value="">Choose a module</option>{browse.modules.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select> : <input aria-label="Concept module" value={newClass.module} onChange={e => setNewClass({ ...newClass, module: e.target.value })} required />}</label><label>Parent class <input list="studio-parent-suggestions" value={newClass.parent} onChange={e => setNewClass({ ...newClass, parent: e.target.value })} required /></label><datalist id="studio-parent-suggestions">{[...new Set([...(browse?.results || []).map(item => item.name), ...results.map(item => item.name), ...parentSuggestions.map(item => item.name)])].map(name => <option key={name} value={name} />)}</datalist><p>Live search shows up to 25 matches; already loaded concepts may also appear.</p>{parentSearchError && <p role="status">{parentSearchError}</p>}<label>Class definition <textarea value={newClass.definition} onChange={e => setNewClass({ ...newClass, definition: e.target.value })} required /></label><button disabled={commandPending}>Add concept</button></fieldset></form></details>{!graph && <div className="studio-editor-empty"><h3>Explore your model</h3><p>Select a concept in the navigator to open its relationships here.</p><div className="studio-empty-actions"><button type="button" onClick={focusModelSearch}>Search concepts</button><button type="button" onClick={openConceptCreator}>Create a concept</button></div></div>}{graph && <div className="studio-graph"><h3>Concept neighbourhood</h3><p>View: <strong>{graph.root}</strong></p><div className="studio-diagram-toolbar"><nav className="studio-view-history" aria-label="Diagram navigation"><button type="button" disabled={rootHistory.index <= 0} onClick={() => navigateViewHistory(-1)}>Previous view</button><button type="button" disabled={rootHistory.index >= rootHistory.entries.length - 1} onClick={() => navigateViewHistory(1)}>Next view</button></nav><div className="studio-view-controls"><label>Graph viewpoint <select value={viewMetadata.viewpoint ?? 'information'} onChange={event => updateViewMetadata('viewpoint', event.target.value)}><option value="information">Information</option><option value="responsibility">Responsibility</option><option value="temporal">Temporal</option></select></label><label>Filter graph relationships <input value={viewMetadata.filter ?? ''} maxLength={200} onChange={event => updateViewMetadata('filter', event.target.value)} /></label></div></div>{compactListFirst && <RelationshipList graph={graph} onSelect={item => { pauseFollowing(); selectConcept(item); }} />}<ModellingCanvas key={`${graph.workspaceId}-${viewId}-${canvasVersion}`} graph={graph} viewId={viewId} onLayoutChange={markViewEdited} onManualInteraction={pauseFollowing} onConnect={({ source, target }) => startRelationship(source, target)} selectedName={selected?.name} onSelect={item => selectConcept(item, { focusView: false })} />{(viewMetadata.viewpoint ?? 'information') === 'information' && <label className="studio-incoming-toggle"><input type="checkbox" checked={showIncoming} onChange={event => setShowIncoming(event.target.checked)} /> Show incoming references</label>}{graph.incomingOmitted > 0 && <p>{graph.incomingOmitted} additional incoming references are not shown. {incomingLimit < 100 ? <button type="button" onClick={() => setIncomingLimit(limit => Math.min(100, limit + 20))}>Show more incoming</button> : 'Use Referenced by in the inspector to browse them.'}</p>}<details><summary>Diagram legend</summary><p>Concept card borders show draft changes: dashed green means added; amber means changed.</p><dl className="studio-diagram-legend"><dt>1</dt><dd>Exactly one</dd><dt>0..1</dt><dd>Optional, at most one</dd><dt>1..*</dt><dd>One or more</dd><dt>0..*</dt><dd>Zero or more</dd></dl><p>Relationship labels are shown where the source specifies cardinality.</p></details><details><summary>About viewpoints</summary><p>Filters and viewpoints affect presentation only. Responsibility uses explicit mappings; temporal edges show explicit window references.</p></details><>{(graph.revision !== snapshot.revision || graph.root !== viewRoot || graph.viewpoint !== (viewMetadata.viewpoint ?? 'information')) && <p aria-live="polite">Updating graph for the current selection and revision.</p>}</><p>Shared view: <strong>{viewId}</strong>; revision: {savedViewRevision ?? 'loading'}.</p><label>View ID <input value={viewIdInput} onChange={event => setViewIdInput(event.target.value)} maxLength={64} /></label><button type="button" disabled={!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(viewIdInput)} onClick={() => switchView(viewIdInput)}>Choose view ID</button>{savedViews.length > 0 && <label>Existing shared views <select value={savedViews.some(view => view.viewId === viewId) ? viewId : ''} onChange={event => { if (event.target.value) { switchView(event.target.value); } }}><option value="">Choose saved view</option>{savedViews.map(view => <option key={view.viewId} value={view.viewId}>{view.viewId} (revision {view.viewRevision})</option>)}</select></label>}{savedViewRevision > 0 && !viewLoaded && <p>Load this view before saving so its notes and groups are preserved.</p>}<details><summary>View groups and annotations</summary><p>These are presentation notes, not ontology relationships.</p><label>Group name <input value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={100} /></label><label>Group concepts (comma separated) <input value={groupMembers} onChange={event => setGroupMembers(event.target.value)} /></label><button type="button" disabled={!groupName.trim() || !groupMembers.trim()} onClick={() => { markViewEdited(); setViewGroups([...viewGroups, { name: groupName.trim(), members: groupMembers.split(',').map(name => name.trim()).filter(Boolean) }]); setGroupName(''); setGroupMembers(''); }}>Add view group</button><ul>{viewGroups.map((group, index) => <li key={`${group.name}-${index}`}>{group.name}: {group.members.join(', ')} <button type="button" onClick={() => { markViewEdited(); setViewGroups(viewGroups.filter((_, i) => i !== index)); }}>Remove group {group.name}</button></li>)}</ul><label>Note for selected concept <textarea value={annotationText} onChange={event => setAnnotationText(event.target.value)} maxLength={1000} /></label><button type="button" disabled={!annotationText.trim()} onClick={() => { markViewEdited(); setViewAnnotations([...viewAnnotations, { target: selected.name, text: annotationText.trim() }]); setAnnotationText(''); }}>Add view note</button><ul>{viewAnnotations.map((note, index) => <li key={`${note.target}-${index}`}>{note.target}: {note.text} <button type="button" onClick={() => { markViewEdited(); setViewAnnotations(viewAnnotations.filter((_, i) => i !== index)); }}>Remove note {index + 1}</button></li>)}</ul></details><button type="button" disabled={viewReadyKey !== activeViewKey || savedViewRevision === null || !viewLoaded || graph.root !== viewRoot || viewBusy?.context === viewContext.current} onClick={saveLayout}>Save shared view</button><button type="button" disabled={viewReadyKey !== activeViewKey || savedViewRevision === null || viewBusy?.context === viewContext.current} onClick={loadLayout}>Load shared view</button>{viewBusy?.context === viewContext.current && <span aria-live="polite">{viewBusy.kind === 'save' ? 'Saving shared view…' : 'Loading shared view…'}</span>}{graph && savedViewRevision > 0 && <button type="button" onClick={exportView}>Export saved view</button>}{viewNotice && <p aria-live="polite">{viewNotice}</p>}{!compactListFirst && <RelationshipList graph={graph} onSelect={item => { pauseFollowing(); selectConcept(item); }} />}{graph.remainingOutgoing > 0 && <p>{graph.remainingOutgoing} additional outgoing relationships are not shown. {outgoingLimit < 50 ? <button type="button" onClick={() => setOutgoingLimit(limit => Math.min(50, limit + 12))}>Show more outgoing</button> : 'Inspect the concept fields for the full declaration.'}</p>}{graph.omitted > graph.remainingOutgoing && <p>{graph.omitted - graph.remainingOutgoing} relationships hidden by the current filter.</p>}<details><summary>Create a relationship using the keyboard</summary><p>Select a target from this neighbourhood.</p>{graph.nodes.filter(node => node.name !== graph.root).map(node => <button type="button" key={node.name} onClick={() => startRelationship(graph.root, node.name)}>Relate {graph.root} to {node.name}</button>)}</details>{relationshipDraft && <form onSubmit={addRelationship} aria-label="New relationship" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancelRelationship(); } }}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Relationship change</legend><h4>New relationship</h4><p>{relationshipDraft.source} → {relationshipDraft.target}</p><p>Opening or cancelling this form does not change the model.</p><label>Predicate name <input value={relationshipDraft.name} onChange={event => setRelationshipDraft({ ...relationshipDraft, name: event.target.value })} pattern="[A-Za-z][A-Za-z0-9]*" maxLength={128} required /></label><label>Relationship description <textarea value={relationshipDraft.description} onChange={event => setRelationshipDraft({ ...relationshipDraft, description: event.target.value })} maxLength={4000} required /></label><label>Relationship cardinality <select value={relationshipDraft.cardinality} onChange={event => setRelationshipDraft({ ...relationshipDraft, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label>{relationshipDraft.revision !== snapshot.revision && <p role="alert">The draft changed. Cancel and start this relationship again.</p>}<button disabled={relationshipSubmitting || relationshipDraft.revision !== snapshot.revision}>Create relationship</button><button type="button" onClick={cancelRelationship}>Cancel relationship</button></fieldset></form>}</div>}<p>{snapshot.title}</p><label>Reason for next edit (optional) <input value={rationale} disabled={commandPending} maxLength={2000} onChange={event => setRationale(event.target.value)} /></label><p>The reason is recorded with the next submitted ontology edit.</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision and refresh the current search results.</p><button type="button" onClick={() => runChecks('structural')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run reference checks</button><button type="button" onClick={() => runChecks('audit')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run independent audit</button><button type="button" onClick={() => runChecks('maintenance-demo')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run maintenance fixtures</button><button type="button" onClick={() => runChecks('acceptance')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run release gates</button>{job && <div>{['queued', 'running'].includes(job.status) && <button type="button" onClick={cancelCheck}>Cancel check</button>}{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest || job.revision !== snapshot.revision ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.steps?.length > 0 && <ul>{job.steps.map(step => <li key={step.ordinal}>{step.checkName}: {step.status}</li>)}</ul>} {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={reviewDraftChanges}>Inspect changes</button></div><div id="studio-changes-document" hidden={editorDocument !== 'changes'}>{diff && <DraftChangeReview diff={diff} snapshot={snapshot} onFocus={selectPerspectiveConcept} onRefresh={reviewDraftChanges} />}</div><div id="studio-review-document" hidden={editorDocument !== 'review'}>
    <ReviewWorkflow snapshot={snapshot} diff={diff} readiness={readiness} reviews={reviews} decisionsLoaded={decisionsLoaded} publication={publication} canPush={canPush} commitWorkflows={commitWorkflows} publisherAvailable={availableTools.includes('ontology_publication_capabilities')} canReview={availableTools.includes('ontology_changeset_review')} onInspect={reviewDraftChanges} onChecks={showValidation} onGo={openWorkspaceTask} />
    <section className="studio-activity"><h2>Change impact</h2><button type="button" onClick={inspectImpact}>Inspect explicit impact references</button>{impact && impact.revision === snapshot.revision && <><p>{impact.note}</p><p>Changed classes: {impact.changedClasses.join(', ') || 'none'}; changed properties: {impact.changedProperties.join(', ') || 'none'}.</p>{impact.references.length ? <ul>{impact.references.map(item => <li key={`${item.kind}-${item.id}`}>{item.kind} {item.id}: {item.title} · {item.source} · references {item.terms.join(', ')}</li>)}</ul> : <p>No indexed baseline references matched.</p>}{impact.omitted > 0 && <p>{impact.omitted} additional references omitted.</p>}</>}</section>
    <div className="studio-review-tools" role="region" aria-labelledby="studio-review-tools-heading">
    <header className="studio-review-tools-header"><h2 id="studio-review-tools-heading">Review and publication</h2><p>Inspect evidence, record a decision, and follow the publication stages for this draft.</p></header>
    <section className="studio-activity"><h2 id="studio-review-heading" tabIndex={-1}>Review readiness</h2><button type="button" disabled={!availableTools.includes('ontology_review_readiness')} onClick={inspectReadiness}>Inspect review gates</button>{!availableTools.includes('ontology_review_readiness') && <p>Review gates require reviewer access.</p>}{readiness && <><p>Revision {readiness.revision}, digest <code>{readiness.sourceDigest}</code></p><p>{readiness.canAccept ? 'Ready for a reviewer decision.' : 'Review gates are incomplete.'} {readiness.note}</p><ul>{readiness.evidence.map(item => <li key={item.profile}>{item.profile}: {item.job ? `${item.job.status} at revision ${item.job.revision}` : 'not run for this draft'}</li>)}</ul><ul>{readiness.missing.map(item => <li key={item}>Missing: {item}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2 id="studio-publication-heading" tabIndex={-1}>Publication preflight</h2><p>Check the target and available evidence before review. Publication requires a current review and explicit publisher permission.</p><button type="button" disabled={!availableTools.includes('ontology_publication_preflight')} onClick={inspectPublication}>Check publication target</button>{!availableTools.includes('ontology_publication_preflight') && <p>Publication preflight is unavailable for this connection.</p>}{publication && publication.revision === snapshot.revision && <><p>Target: {publication.target.repository} · {publication.target.branch} · {publication.target.status}.</p><p>Baseline: <code>{publication.baselineCommit}</code>; target head: <code>{publication.target.head ?? 'unavailable'}</code>.</p><p>Changed source files: {publication.sourceFiles.join(', ') || 'none'}.</p>{publication.comparison && <><p>Remote comparison: {publication.comparison.status}. {publication.comparison.note}</p><p>Overlapping files: {publication.comparison.overlap.join(', ') || 'none identified'}.</p><details><summary>Files changed on target</summary><ul>{publication.comparison.changedFiles.map(path => <li key={path}>{path}</li>)}</ul></details></>}<p>Generated comparison: {publication.generatedEvidence ? `${publication.generatedEvidence.summary.changedCount} byte-different files from ${publication.generatedEvidence.profile} checks` : 'not available for this revision'}.</p><ul>{publication.limitations.map(item => <li key={item}>{item}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Prepare reviewed candidate</h2><p>Stage the exact accepted source and generated files in a disposable checkout. This does not publish or recheck the remote.</p><button type="button" disabled={!availableTools.includes('ontology_publication_prepare') || !reviews[0] || reviews[0].decision !== 'accept' || reviews[0].revision !== snapshot.revision || reviews[0].sourceDigest !== snapshot.sourceDigest || Boolean(snapshot.changeSet && (snapshot.changeSet.status !== 'accepted' || snapshot.changeSet.reviewId !== reviews[0].id))} onClick={() => preparePublication(reviews[0].id)}>Prepare staged preview</button>{!availableTools.includes('ontology_publication_prepare') && <p>Preparing publication is unavailable for this connection.</p>}{job?.profile === 'publication-preview' && <><p>Preview: {job.status}{job.stale ? ' ? stale' : ''}.</p>{job.output && <pre>{job.output}</pre>}{job.artifactSummary?.files && <><p>{job.artifactSummary.note}</p><ul>{job.artifactSummary.files.map(file => <li key={file.path}>{file.kind}: {file.path} ? {file.sha256 ?? 'removed'}</li>)}</ul><form onSubmit={reservePublication}><label>Commit subject <input value={publicationSubject} onChange={event => setPublicationSubject(event.target.value)} maxLength={120} required /></label><label>Commit description <textarea value={publicationBody} onChange={event => setPublicationBody(event.target.value)} maxLength={10000} required /></label><button disabled={job.stale}>Save publication intent</button></form></>}</>}</section>
    <section className="studio-activity">
      <h2>Publication history</h2>
      <button type="button" disabled={!availableTools.includes('ontology_publication_history')} onClick={() => inspectPublicationHistory().catch(problem => setError(problem.message))}>Inspect publication history</button>{!availableTools.includes('ontology_publication_history') && <p>Publication history requires reviewer access.</p>}
      <p>A saved intent is local. Publisher permission: {canPush === null ? (availableTools.includes('ontology_publication_capabilities') ? 'not checked' : 'unavailable for this connection') : canPush ? 'enabled' : 'not enabled'}.</p>
      {['publication-commit', 'publication-push', 'publication-pr'].includes(job?.profile) && <p>Publication operation: {job.status}. {job.output} {job.artifactSummary?.note}</p>}
      <ol>{publicationHistory.map(item => <li key={item.id}>
        {item.state} - {item.branch} - revision {item.revision}{item.stale ? ' - stale' : ''}{item.commitSha && <> - <code>{item.commitSha}</code></>}
        <p>{item.subject}</p>
        {item.state === 'prepared' && <button type="button" disabled={item.stale} onClick={() => createLocalCommit(item.id)}>Create local commit</button>}
        {['commit_created', 'push_unknown'].includes(item.state) && <button type="button" disabled={!canPush || (item.stale && item.state !== 'push_unknown')} onClick={() => runPublicationAction(item.id, 'ontology_publication_push')}>{item.state === 'push_unknown' ? 'Reconcile push' : 'Push isolated branch'}</button>}
        {['pushed', 'pr_unknown'].includes(item.state) && <button type="button" disabled={!canPush || (item.stale && item.state !== 'pr_unknown')} onClick={() => runPublicationAction(item.id, 'ontology_publication_pull_request')}>{item.state === 'pr_unknown' ? 'Reconcile pull request' : 'Create draft pull request'}</button>}
        {item.prNumber && <p>{item.prUrl ? <a href={item.prUrl} target="_blank" rel="noreferrer">Pull request #{item.prNumber}</a> : `Pull request #${item.prNumber}`} - {item.prStatus} when recorded</p>}
      </li>)}</ol>
    </section>
    <section className="studio-activity"><h2 id="studio-commit-checks-heading" tabIndex={-1}>GitHub commit checks</h2><p>Look up workflow runs for a full commit SHA. This does not check branch-protection requirements or deployment.</p>{!availableTools.includes('ontology_github_commit_workflows') && <p>Commit workflow lookup is unavailable for this connection.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_github_commit_workflows')}><form onSubmit={inspectCommitWorkflows}><label>Commit SHA <input value={commitSha} onChange={event => setCommitSha(event.target.value)} pattern="[a-f0-9]{40}" required /></label><button>Check commit workflows</button></form></fieldset>{commitWorkflows && <><p>Commit <code>{commitWorkflows.sha}</code>: {commitWorkflows.status}. {commitWorkflows.reason || commitWorkflows.note}</p><ul>{commitWorkflows.workflows.map(run => <li key={run.id}><a href={run.url} target="_blank" rel="noreferrer">{run.name}</a>: {run.status}{run.conclusion ? ` ? ${run.conclusion}` : ''}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Required status checks</h2><p>Use the commit SHA above. Missing policy access or incomplete results remain unknown.</p><button type="button" disabled={!availableTools.includes('ontology_github_required_checks')} onClick={inspectRequiredChecks}>Check required status checks</button>{!availableTools.includes('ontology_github_required_checks') && <p>Required-check lookup is unavailable for this connection.</p>}{requiredChecks && <><p>Commit <code>{requiredChecks.sha}</code>: {requiredChecks.status}. {requiredChecks.note}</p><ul>{requiredChecks.checks.map(check => <li key={`${check.context}-${check.appId}`}>{check.context}: {check.status}{check.appId != null && ` (app ${check.appId})`}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Reviewer interval case</h2><p>Write a separate synthetic example and expected outcome. Review whether it is independent and relevant; saving it does not run validation.</p>{!availableTools.includes('ontology_reviewer_interval_case_add') && <p>Reviewer case editing is unavailable for this connection. Connect with reviewer access.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_reviewer_interval_case_add')}><form onSubmit={submitReviewCase}><label>Requirement ID <input value={reviewCase.requirementId} onChange={event => setReviewCase({ ...reviewCase, requirementId: event.target.value })} pattern="BR-[0-9]+" required /></label><label>Rule ID <input value={reviewCase.ruleId} onChange={event => setReviewCase({ ...reviewCase, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><label>Unique case ID <input value={reviewCase.caseId} onChange={event => setReviewCase({ ...reviewCase, caseId: event.target.value })} pattern="[A-Za-z0-9][A-Za-z0-9-]*" maxLength={128} required /></label><label>Start (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.start} onChange={event => setReviewCase({ ...reviewCase, start: event.target.value })} required /></label><label>End (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.end} onChange={event => setReviewCase({ ...reviewCase, end: event.target.value })} required /></label><label>Expected outcome <select value={reviewCase.expectedConformance} onChange={event => setReviewCase({ ...reviewCase, expectedConformance: event.target.value })}><option value="true">Conforms</option><option value="false">Violates rule</option></select></label><label>Business scenario and expected result <textarea value={reviewCase.scenario} onChange={event => setReviewCase({ ...reviewCase, scenario: event.target.value })} minLength={12} maxLength={1000} required /></label><button>Save reviewer case</button></form></fieldset></section>
    <section className="studio-activity"><h2 id="studio-review-decision-heading" tabIndex={-1}>Reviewer decision</h2><p>Acceptance records a reviewer decision for this exact draft; it does not publish or establish business completeness. A rejection does not erase the draft.</p>{!availableTools.includes('ontology_changeset_review') && <p>Reviewer decisions are unavailable for this connection. Connect with reviewer access.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_changeset_review')}><form onSubmit={submitReview}><label>Decision <select value={reviewDecision} onChange={event => setReviewDecision(event.target.value)}><option value="request_changes">Request changes</option><option value="reject">Reject draft</option><option value="accept">Accept draft</option></select></label><label>Reason <textarea value={reviewReason} onChange={event => setReviewReason(event.target.value)} maxLength={4000} required /></label><button>Record reviewer decision</button></form></fieldset>{reviews.length > 0 && <ol>{reviews.map(review => <li key={review.id}>{review.decision === 'reject' ? 'Rejected' : review.decision === 'accept' ? 'Accepted' : 'Changes requested'} · revision {review.revision} · {review.actor} · {review.revision !== snapshot.revision || review.sourceDigest !== snapshot.sourceDigest || Boolean(review.decision === 'accept' && snapshot.changeSet && (snapshot.changeSet.reviewId !== review.id || !['accepted', 'published'].includes(snapshot.changeSet.status))) ? 'stale' : 'current'}<p>{review.reason}</p></li>)}</ol>}</section>
    </div>
</div></section>
      <section id="studio-inspector-pane" hidden={!isCompact && hideInspector}><h2 tabIndex={-1}>Inspector</h2><datalist id="studio-field-type-suggestions">{scalarTypes.map(type => <option key={type} value={type} label="Datatype" />)}{[...new Set([...(browse?.results || []).map(item => item.name), ...results.map(item => item.name), ...(graph?.nodes || []).map(item => item.name), ...rangeSuggestions.map(item => item.name)])].filter(name => !scalarTypes.includes(name)).map(name => <option key={name} value={name} label="Concept" />)}</datalist>{selected ? <><h3>{selected.name}</h3>{viewRoot !== selected.name && <button type="button" onClick={() => { focusViewRoot(selected.name); setEditorDocument('diagram'); if (window.matchMedia('(max-width: 900px)').matches) openCompactPane('studio-editor-pane'); }}>Focus neighbourhood</button>}<form onSubmit={saveDefinition}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Definition <textarea value={definition} onChange={event => setDefinition(event.target.value)} maxLength={4000} required /></label>{definitionConflict && <div role="alert" className="studio-conflict"><p>This definition changed in another client while you were editing.</p><p>Previous: {definitionConflict.before}</p><p>Latest: {definitionConflict.latest}</p><p>Your text is retained above. Review the latest definition before choosing what to do.</p><button type="button" onClick={() => { setDefinition(definitionConflict.latest); setDefinitionConflict(null); }}>Use latest definition</button><button type="button" onClick={() => setDefinitionConflict(null)}>Keep my text</button></div>}<button disabled={commandPending || Boolean(definitionConflict) || entityRevision !== snapshot.revision || entityInfo?.name !== selected.name || definition === selected.definition}>Save definition</button><button type="button" onClick={() => { setDefinition(selected.definition); setDefinitionConflict(null); }}>Cancel</button></fieldset></form><p>Parent: {selected.parent} {selected.parent && !['root', '-'].includes(selected.parent) && <button type="button" onClick={() => selectPerspectiveConcept(selected.parent, { focusView: false })}>Inspect parent {selected.parent}</button>}</p><details><summary>Referenced by</summary><p>Direct declared relationships and direct subclasses only; this is not a complete impact analysis.</p><button type="button" onClick={() => inspectIncoming()}>Find references</button>{incoming && <><p>Showing {incoming.results.length} of {incoming.total} references.</p><ul>{incoming.results.map((item, index) => <li key={item.source + '-' + item.predicate + '-' + index}><strong>{item.source}</strong> · {item.predicate}{item.cardinality ? ' (' + item.cardinality + ')' : ''} <button type="button" onClick={() => selectPerspectiveConcept(item.source)}>Inspect {item.source}</button></li>)}</ul>{incoming.nextOffset !== null && <button type="button" onClick={() => inspectIncoming(incoming.nextOffset)}>Load more references</button>}</>}</details>{entityInfo && <><InspectorIdentifier key={selected.name} iri={entityInfo.iri} /><ContextHandoff snapshot={snapshot} entity={entityInfo.name === selected.name ? entityInfo : null} entityRevision={entityRevision} job={job} connection={connection} availableTools={availableTools} /><p>Source: {entityInfo.source.path}:{entityInfo.source.line}</p><h4>Fields</h4><InspectorFields key={selected.name} fields={entityInfo.fields} commandPending={commandPending} narrowing={Boolean(valueConstraint)} editingLocked={Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onNarrowValues={startValueConstraint} onInspectOwner={name => selectPerspectiveConcept(name, { focusView: false })} onEdit={startFieldEdit} onRequire={item => applyCommand({ type: 'constraint.add', template: 'required-relationship', owner: selected.name, name: item.property, expectedRange: item.range, expectedCardinality: item.cardinality })} /></>}{valueConstraint && selected && <AllowedValuesEditor draft={valueConstraint} onChange={values => setValueConstraint(current => current && ({ ...current, values }))} onCancel={cancelValueConstraint} onApply={applyValueConstraint} pending={commandPending} stale={!entityInfo || entityRevision !== snapshot.revision || entityInfo.name !== valueConstraint.owner || valueConstraint.workspaceId !== connection.workspaceId || valueConstraint.revision !== snapshot.revision || valueConstraint.changeSetId !== (snapshot.changeSet?.id ?? null) || valueConstraint.changeSetUpdatedAt !== (snapshot.changeSet?.updatedAt ?? null) || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} />}{fieldEdit && selected && <section className="studio-activity"><h2>Edit field contract</h2><p>Changing a range or tightening cardinality can break existing data and consumers. Review affected requirements and rerun checks.</p><p>Current contract: {fieldEdit.name}: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}).</p><form onSubmit={updateField}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>New datatype or target class <input list="studio-field-type-suggestions" ref={fieldEditInput} onFocus={() => setRangeSource('edit')} value={fieldEdit.range} onChange={event => setFieldEdit({ ...fieldEdit, range: event.target.value })} required /></label>{rangeSearchError && <p role="status">{rangeSearchError}</p>}<label>New cardinality <select value={fieldEdit.cardinality} onChange={event => setFieldEdit({ ...fieldEdit, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label>{fieldEditConflict && <div role="alert" className="studio-conflict"><p>This field changed in another client. Your input is retained; cancel and reopen the field to review its current contract.</p><p>Previous: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}). Current: {currentField ? currentFieldRange + ' (' + currentField.cardinality + ')' : 'field unavailable'}.</p></div>}<button disabled={commandPending || !entityInfo || fieldEditConflict || entityRevision !== snapshot.revision || entityInfo?.name !== selected?.name}>Update field contract</button><button type="button" onClick={cancelFieldEdit}>Cancel field edit</button></fieldset></form></section>}<details id="studio-add-field" onToggle={event => setFieldFormOpen(event.currentTarget.open)}><summary>Add a field or relationship</summary><form onSubmit={addField}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Field name <input value={field.name} onChange={e => setField({ ...field, name: e.target.value })} required /></label><p>Use a datatype, class name, or controlled values such as &#123;Draft,Confirmed,Cancelled&#125;. Suggestions include known datatypes, loaded concepts and up to 25 live search matches; other class names can be entered.</p>{rangeSearchError && <p role="status">{rangeSearchError}</p>}<label>Datatype or target class <input list="studio-field-type-suggestions" onFocus={() => setRangeSource('add')} value={field.range} onChange={e => setField({ ...field, range: e.target.value })} required /></label><label>Cardinality <select value={field.cardinality} onChange={e => setField({ ...field, cardinality: e.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button disabled={commandPending}>Add field</button></fieldset></form></details></> : <div className="studio-inspector-empty"><p>Select a concept to inspect its definition, fields and references.</p><button type="button" onClick={focusModelSearch}>Find a concept</button></div>}</section>
    </div>
    <div className="studio-compact-results"><WorkspaceDock panel={dockPanel} onPanelChange={setDockPanel} height={dockHeight} heightLimit={dockLimit} onHeightChange={setDockHeight} disabled={!online} job={job} snapshot={snapshot} history={history} historyDetail={historyDetail} historyPending={historyPending} onInspectRevision={inspectHistory} onCloseHistory={closeHistory} onRetry={runChecks} onFocusConcept={selectPerspectiveConcept} onDownloadEvidence={downloadEvidence} onShowChecks={showValidation} activityConcept={eventConcept} />
    <section className="studio-activity"><h2>Change set</h2>{snapshot.changeSet ? <><p>{snapshot.changeSet.intent} · {snapshot.changeSet.status} · <code>{snapshot.changeSet.id}</code></p><p>Requirement references: {snapshot.changeSet.requirements.join(', ') || 'none'}.</p>{['accepted', 'rejected'].includes(snapshot.changeSet.status) && <><p>Editing is locked until a reviewer reopens this change set. Reopening invalidates its acceptance.</p><button type="button" disabled={!availableTools.includes('ontology_changeset_reopen')} onClick={reopenChangeSet}>Reopen change set</button>{!availableTools.includes('ontology_changeset_reopen') && <p>Reopening a reviewed change set requires reviewer access.</p>}</>}{snapshot.changeSet.status === 'published' && <p>This change set was pushed. Start a new workspace from the reviewed target before another proposal.</p>}</> : <><p>Opening a change set records intent for the whole current draft, including any edits already made.</p><form onSubmit={openChangeSet}><label>Change-set intent <input value={changeSetIntent} onChange={event => setChangeSetIntent(event.target.value)} maxLength={1000} required /></label><label>Requirement IDs (comma separated, optional) <input value={changeSetRequirements} onChange={event => setChangeSetRequirements(event.target.value)} /></label><button>Open change set</button></form></>}</section>
    <PerspectivePanels temporalDirty={Boolean(temporalBaseline && temporalBaseline.root === selected?.name && temporalPolicy !== (temporalBaseline.policy ?? 'snapshot-versioned'))} discardTemporal={() => { setTemporalPolicy(temporalBaseline?.policy ?? 'snapshot-versioned'); setError(''); }} binding={binding} setBinding={setBinding} commandPending={commandPending} selected={selected} snapshot={snapshot} entityInfo={entityInfo} responsibility={responsibility} temporal={temporal} temporalPolicy={temporalPolicy} setTemporalPolicy={value => { temporalRequest.current += 1; setTemporalPolicy(value); }} inspectResponsibility={inspectResponsibility} inspectTemporal={inspectTemporal} saveTemporalPolicy={saveTemporalPolicy} selectConcept={selectPerspectiveConcept} addRelationship={openRelationshipAuthoring} addBinding={applyCommand} />
    <section className="studio-activity"><h2>Requirement links</h2>{snapshot.digestVersion === 4 ? <><p>Linking a concept records a relationship in the requirement register; it does not prove coverage or acceptance.</p><form onSubmit={searchRequirements}><label>Search requirements <input value={requirementQuery} onChange={event => setRequirementQuery(event.target.value)} /></label><button>Search requirements</button></form><ul>{requirements.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <button type="button" disabled={!selected || item.classes.includes(selected.name)} onClick={() => linkRequirement(item)}>Link selected concept</button>{selected && item.classes.includes(selected.name) && ['model/audit-rules.json', 'model/authoring-example-overrides.json', 'tests/business-acceptance.json', 'tests/negative-cases.json'].every(path => snapshot.editableSources?.includes(path)) && <details><summary>Add interval rule for {item.id}</summary><p>Only a new class with two new, declared date-time fields is supported. The generated cases are draft examples and require independent review.</p><form onSubmit={event => addIntervalRule(event, item)}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Interval rule change</legend><label>Interval start <select value={intervalRule.startProperty} onChange={event => setIntervalRule({ ...intervalRule, startProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>Interval end <select value={intervalRule.endProperty} onChange={event => setIntervalRule({ ...intervalRule, endProperty: event.target.value })} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>New rule ID <input value={intervalRule.ruleId} onChange={event => setIntervalRule({ ...intervalRule, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><button>Add interval constraint</button></fieldset></form></details>}</li>)}</ul></> : <p>Create a version-four workspace to edit requirement links.</p>}</section>
    {job?.artifactSummary && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) && <section className="studio-activity"><h2>Generated artifact comparison</h2><p>Revision {job.revision} · {job.artifactSummary.changedCount} files differ in exact bytes{job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' · stale' : ''}.</p><p>{job.artifactSummary.note}</p><p>Baseline manifest: <code>{job.artifactSummary.baselineManifestSha256}</code>; candidate manifest: <code>{job.artifactSummary.candidateManifestSha256}</code>.</p>{job.artifactSummary.changes.length > 0 && <ul>{job.artifactSummary.changes.map(item => <li key={item.path}>{item.kind}: {item.path}</li>)}</ul>}{job.artifactSummary.omitted > 0 && <p>{job.artifactSummary.omitted} additional changes omitted.</p>}</section>}
    <section className="studio-activity"><h2>Suggested views</h2><p>Suggestions never change the model. Follow new changes and suggestions to select their concepts automatically; your interaction pauses following.</p><label><input type="checkbox" checked={followSuggestions} onChange={event => setFollowing(event.target.checked)} /> Follow new changes and suggestions</label>{followSuggestions && <p aria-live="polite">{followPaused ? 'Following paused after interaction.' : 'Following new changes and suggestions.'}</p>}{followSuggestions && followPaused && <button type="button" onClick={resumeFollowing}>Resume following</button>}<ul>{history.filter(event => event.payload.type === 'view_suggestion').slice(-10).reverse().map(event => <li key={event.sequence}><strong>{event.payload.root}</strong> · {event.payload.viewpoint} · {event.actor} · revision {event.revision}<p>{event.payload.explanation}</p><button type="button" disabled={event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest} onClick={() => { pauseFollowing(); focusSuggestion(event); }}>Focus {event.payload.root}</button>{(event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest) && <small> Suggestion refers to an older draft.</small>}</li>)}</ul></section>
    <section className="studio-activity"><h2 id="studio-activity-heading" tabIndex={-1}>Activity</h2>{latestChange && <p>Latest change: {latestChange.actor} updated {eventConcept(latestChange)} at revision {latestChange.revision}. <button type="button" onClick={() => selectPerspectiveConcept(eventConcept(latestChange))}>Show latest change</button></p>}<button type="button" onClick={() => setUndoCandidate({ workspaceId: connection.workspaceId, revision: undoEvent.revision, actor: undoEvent.actor, commands: undoEvent.payload.commands.map(command => [command.type, command.owner ?? command.className ?? command.name].filter(Boolean).join(' ')) })} disabled={commandPending || !undoEvent || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Undo latest command group</button>{undoCandidate && <section aria-label="Confirm undo" className="studio-undo-confirmation"><h3>Undo revision {undoCandidate.revision}?</h3><p>This reverses {undoCandidate.actor}'s command group: {undoCandidate.commands.join(', ')}. The reversal creates a new revision.</p>{(undoCandidate.revision !== snapshot.revision || undoCandidate.workspaceId !== connection.workspaceId) && <p role="status">The draft changed. Cancel and review the latest revision before undoing.</p>}<button type="button" disabled={commandPending || undoCandidate.revision !== snapshot.revision || undoCandidate.workspaceId !== connection.workspaceId} onClick={() => undoLatest(undoCandidate)}>Confirm undo revision {undoCandidate.revision}</button><button type="button" onClick={() => setUndoCandidate(null)}>Cancel undo</button></section>}<ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} · {event.actor} · {event.createdAt ?? 'time not recorded'} · {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : event.payload.type === 'review' ? event.payload.decision : event.payload.type === 'publication' ? `publication ${event.payload.state}` : event.payload.type === 'view_suggestion' ? 'suggested ' + event.payload.root : event.payload.type === 'changeset_opened' ? 'opened change set: ' + event.payload.intent : event.payload.type === 'changeset_reopened' ? 'reopened change set' : (event.payload.commands || []).map(command => command.type).join(', ')}{event.payload.rationale && <p>Reason: {event.payload.rationale}</p>}{event.payload.commands?.length > 0 && <button type="button" onClick={() => inspectHistory(event.revision)}>Inspect revision {event.revision}</button>}</li>)}</ol>{historyDetail && <section aria-label="Historical comparison"><h3>Historical revision {historyDetail.revision}</h3><p>Read-only comparison; the current draft is unchanged.</p>{historyDetail.available ? <><p>Actor: {historyDetail.actor}; source digest: <code>{historyDetail.sourceDigest}</code>.</p>{historyDetail.commandGroupId && <p>Command group: <code>{historyDetail.commandGroupId}</code>; operation: <code>{historyDetail.operationId}</code>.</p>}{historyDetail.rationale && <p>Reason: {historyDetail.rationale}</p>}<details open><summary>Command group patch</summary><pre>{historyDetail.patch}</pre></details><details><summary>Compare historical revision with baseline</summary><pre>{historyDetail.baselinePatch}</pre></details>{historyDetail.additionalSources.map(source => <details key={source.path}><summary>Historical source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}</> : <p>{historyDetail.reason}</p>}<button type="button" onClick={closeHistory}>Return to current draft</button></section>}</section></div></fieldset>}
    <section className="studio-connection-settings" aria-label="Connection settings">
    {connection && <><button type="button" disabled={commandPending} onClick={() => disconnect()}>Disconnect</button><p>Workspace ID: <code>{connection.workspaceId}</code> <button type="button" onClick={() => copyConnectionValue(connection.workspaceId, 'Workspace ID')}>Copy workspace ID</button></p><details><summary>Connect an MCP client</summary><p>Use this local endpoint and workspace ID with the separately configured draft token. The token is not included below.</p><pre>{`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`}</pre><button type="button" onClick={() => copyConnectionValue(`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`, 'Connection details')}>Copy connection details</button></details>{connectionCopyMessage && <p aria-live="polite">{connectionCopyMessage}</p>}</>}
    <details><summary>Connection diagnostics</summary><p>Connection: {status}; event stream: {online ? 'live' : 'not live'}.</p><p>Server: {serverInfo ? `${serverInfo.name} ${serverInfo.version}` : 'not initialized'}; negotiated MCP protocol: {serverInfo?.protocolVersion ?? 'unknown'}.</p><p>Workspace: {connection?.workspaceId ?? 'none'}; revision: {snapshot?.revision ?? 'unknown'}; last event cursor: {cursor.current}.</p><p>Latest job: {job ? `${job.profile}, ${job.status}, revision ${job.revision}` : 'none'}.</p><button type="button" onClick={copyDiagnostics}>Copy redacted diagnostics</button>{diagnosticMessage && <p aria-live="polite">{diagnosticMessage}</p>}<p>Reconnect by opening the local studio and pairing again. Diagnostics exclude credentials and check output.</p></details>
    </section>
    {snapshot && <section className="studio-status-bar" aria-label="Workspace status">
      <span>{online ? 'Connected' : status}</span>
      <span>Revision {snapshot.revision}</span>
      {viewDirty && <span>View changed locally</span>}
      <span>{selected ? `Selected: ${selected.name}` : 'No concept selected'}</span>
      <a href="#studio-validation-heading" onClick={showValidation}>{!job || ['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) ? 'Checks: no result displayed' : `Check: ${job.status}${job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' (out of date)' : ''}`}</a>
    </section>}
  </main>;
}
