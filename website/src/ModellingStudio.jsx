Warning: truncated output (original token count: 66562)
Total output lines: 2364

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Boxes, CircleCheck, GitPullRequest } from 'lucide-react';
import { classifyEvent } from './model/event-cursor.js';
import { takeEventFrames } from './model/event-stream.js';
import ModellingCanvas from './ModellingCanvas.jsx';
import WorkspaceDock from './WorkspaceDock.jsx';
import PerspectivePanels from './PerspectivePanels.jsx';
import StudioThemeControl from './StudioThemeControl.jsx';
import FieldExplorer from './FieldExplorer.jsx';
import AllowedValuesEditor from './AllowedValuesEditor.jsx';
import ControlledValuesBuilder, { validFieldRangeDraft } from './ControlledValuesBuilder.jsx';
import RequireRelationshipReview from './RequireRelationshipReview.jsx';
import StudioScrollableText from './StudioScrollableText.jsx';
import { contextCheckSummary } from './model/context-checks.js';
import { projectView } from './model/project-view.js';
import { mergeIncoming } from './model/incoming-view.js';
import { authHeaders, call } from './model/mcp-transport.js';
import { canvasPositionKey, readCanvasPositions, writeCanvasPositions } from './model/canvas-positions.js';
import './modelling-studio.css';

function BrowseSubtypeBranch({ parent, connection, revision, selectedName, onSelect, onOpen }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(null);
  const [failure, setFailure] = useState('');
  const [cursor, setCursor] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { setPage(null); setCursor(''); setFailure(''); }, [connection.endpoint, connection.token, connection.workspaceId, revision, parent]);
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setFailure('');
    call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_explorer_list', arguments: { workspaceId: connection.workspaceId, expectedRevision: revision, parent, limit: 50, ...(cursor ? { cursor } : {}) } }, controller.signal)
      .then(response => {
        const result = response.structuredContent;
        if (!controller.signal.aborted && result.revision === revision) setPage(previous => cursor ? previous?.revision === revision && previous.nextCursor === cursor ? { ...result, results: [...previous.results, ...result.results] } : previous : result);
      })
      .catch(error => { if (!controller.signal.aborted) setFailure(error.message); });
    return () => controller.abort();
  }, [open, connection.endpoint, connection.token, connection.workspaceId, revision, parent, cursor, retry]);
  const current = page?.revision === revision && page.workspaceId === connection.workspaceId && page.parent === parent ? page : null;
  return <div className="studio-subtypes"><button type="button" className="studio-subtypes-toggle" aria-label={`${open ? 'Hide' : 'Show'} inline subtypes of ${parent}`} aria-expanded={open} onClick={() => { if (open) { setPage(null); setCursor(''); } setOpen(value => !value); }}><span aria-hidden="true">{open ? 'â–¾' : 'â–¸'}</span> Subtypes</button>
    {open && <>{failure ? <p role="status">Subtypes unavailable: {failure} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry subtypes of {parent}</button></p> : !current ? <p role="status">Loading subtypes of {parent}â€¦</p> : <><p>{current.total ? `${current.results.length} of ${current.total} direct subtypes` : 'No direct subtypes.'}</p><ul aria-label={`Direct subtypes of ${parent}`}>{current.results.map(item => <li key={item.name}><button type="button" aria-current={item.name === selectedName ? 'true' : undefined} title="Select to inspect; double-click or press Enter to focus its neighbourhood" onClick={() => onSelect(item)} onDoubleClick={() => onOpen(item)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onOpen(item); } }}>{item.name} <small>Â· {item.module}</small></button><BrowseSubtypeBranch parent={item.name} connection={connection} revision={revision} selectedName={selectedName} onSelect={onSelect} onOpen={onOpen} /></li>)}</ul>{current.nextCursor && <button type="button" onClick={() => setCursor(current.nextCursor)}>Load more subtypes of {parent}</button>}</>}</>}
  </div>;
}

function BrowseConceptRow({ item, selectedName, onSelect, onOpen, onInspectOwner, onBrowseChildren, pending, connection, revision, expanded, onToggle }) {
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
  const fieldList = entries => <ul>{entries.map((field, index) => <li key={`${field.owner}-${field.property}-${index}`}><span>{field.property}</span> <small>{field.range} Â· {cardinalityLabels[field.cardinality] ?? field.cardinality}{field.inherited ? ` Â· from ${field.owner}` : ''}</small>{field.inherited && <button type="button" onClick={() => onInspectOwner(field.owner)}>Inspect declaration of {field.property}</button>}</li>)}</ul>;
  return <li><div className="studio-explorer-concept"><button type="button" className="studio-explorer-expand" aria-label={`${expanded ? 'Hide' : 'Show'} fields for ${item.name}`} aria-expanded={expanded} onClick={() => onToggle(item.name)}>{expanded ? 'âˆ’' : '+'}</button><button type="button" title={`Select ${item.name} to inspect; double-click or press Enter to focus its neighbourhood`} aria-current={item.name === selectedName ? 'true' : undefined} onClick={() => onSelect(item)} onDoubleClick={() => onOpen(item)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onOpen(item); } }}>{item.name}</button></div>
    {expanded && <div className="studio-explorer-fields"><BrowseSubtypeBranch parent={item.name} connection={connection} revision={revision} selectedName={selectedName} onSelect={onSelect} onOpen={onOpen} /><button type="button" disabled={pending} onClick={() => onBrowseChildren(item.name)}>Browse direct subtypes of {item.name}</button>{failure ? <><p role="status">Fields unavailable: {failure}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry fields for {item.name}</button></> : !entity ? <p role="status">Loading fields for {item.name}â€¦</p> : <><p>Declared fields</p>{declared.length ? fieldList(declared) : <p>No declared fields.</p>}{inherited.length > 0 && <details><summary>Inherited fields ({inherited.length})</summary>{fieldList(inherited)}</details>}</>}</div>}
  </li>;
}

function BrowseConceptTree({ browse, selectedName, onSelect, onOpen, onInspectOwner, onBrowseModule, onBrowseChildren, pending, connection, revision, expandedNames, onToggle }) {
  const groups = new Map();
  for (const item of browse.results) {
    if (!groups.has(item.module)) groups.set(item.module, []);
    groups.get(item.module).push(item);
  }
  return <ul className="studio-module-tree" aria-label="Loaded concepts by module">{browse.modules.map(({ name: module, count }) => <li key={module}>
    <details open={groups.has(module)}><summary>{module} <span>({groups.get(module)?.length || 0} loaded{browse.changedOnly || browse.parent ? `; ${count} total in module` : ` of ${count}`})</span></summary>
      <button type="button" disabled={pending} onClick={() => onBrowseModule(module)}>Browse {module}</button>
      <ul>{(groups.get(module) || []).map(item => <BrowseConceptRow key={item.name} item={item} selectedName={selectedName} onSelect={onSelect} onOpen={onOpen} onInspectOwner={onInspectOwner} onBrowseChildren={onBrowseChildren} pending={pending} connection={connection} revision={revision} expanded={expandedNames.includes(item.name)} onToggle={onToggle} />)}</ul>
    </details>
  </li>)}</ul>;
}

function SourcePreview({ connection, snapshot, name, available }) {
  const [version, setVersion] = useState('candidate');
  const [excerpt, setExcerpt] = useState(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const request = useRef(0), controller = useRef(null);
  useEffect(() => {
    request.current += 1; controller.current?.abort(); setExcerpt(null); setPending(false); setFailure('');
    return () => controller.current?.abort();
  }, [connection, snapshot.revision, snapshot.sourceDigest, name]);
  const current = excerpt && excerpt.workspaceId === connection.workspaceId && excerpt.revision === snapshot.revision && excerpt.sourceDigest === snapshot.sourceDigest && excerpt.name === name && excerpt.version === version;
  async function load() {
    const sequence = ++request.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setExcerpt(null); setFailure('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_source_excerpt', arguments: { workspaceId: connection.workspaceId, name, expectedRevision: snapshot.revision, version } }, abort.signal);
      const value = response.structuredContent;
      if (!abort.signal.aborted && sequence === request.current && value.workspaceId === connection.workspaceId && value.revision === snapshot.revision && value.sourceDigest === snapshot.sourceDigest && value.name === name && value.version === version) setExcerpt(value);
    } catch (problem) { if (!abort.signal.aborted && sequence === request.current) setFailure(problem.message); }
    finally { if (!abort.signal.aborted && sequence === request.current) setPending(false); }
  }
  return <details className="studio-source-preview"><summary>Source preview</summary><p>Read-only excerpt from the selected concept's domain schema; long lines may be truncated.</p>
    {!available ? <p>Source preview is unavailable for this connection.</p> : <><label>Source version <select value={version} onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setExcerpt(null); setFailure(''); setVersion(event.target.value); }}><option value="candidate">Current draft</option><option value="baseline">Baseline</option></select></label><button type="button" disabled={pending} onClick={load}>Load source preview</button>{pending && <p role="status">Loading source previewâ€¦</p>}{failure && <p role="status">Source preview unavailable: {failure}</p>}{current && <><p>{excerpt.path} Â· {version === 'baseline' ? `baseline ${excerpt.baselineCommit}` : `draft revision ${excerpt.revision}`}{excerpt.found ? ` Â· line ${excerpt.declarationLine}` : ' Â· concept not present'}.</p>{excerpt.found && <StudioScrollableText label={`Source excerpt for ${name}`}>{excerpt.lines.map(line => `${line.number}: ${line.text}${line.truncated ? ' â€¦ [truncated]' : ''}`).join('\n')}</StudioScrollableText>}</>}</>}
  </details>;
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
  async function search(event, offset = 0) {
    event?.preventDefault();
    const sequence = ++request.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); if (!offset) setResult(null); setFailure('');
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_requirement_search', arguments: { workspaceId: snapshot.workspaceId, expectedRevision: snapshot.revision, query, limit: 20, offset } }, abort.signal);
      const value = response.structuredContent;
      if (!abort.signal.aborted && sequence === request.current && value.workspaceId === snapshot.workspaceId && value.revision === snapshot.revision && value.sourceDigest === snapshot.sourceDigest) setResult(previous => offset ? previous && previous.query === query && previous.revision === value.revision && previous.sourceDigest === value.sourceDigest && previous.nextOffset === offset ? { ...value, query, results: [...previous.results, ...value.results] } : previous : { ...value, query });
    } catch (problem) { if (!abort.signal.aborted && sequence === request.current) setFailure(problem.message); }
    finally { if (!abort.signal.aborted && sequence === request.current) setPending(false); }
  }
  return <details className="studio-requirement-explorer"><summary>Requirements</summary>
    <p>Search the existing requirement register. A recorded link does not establish coverage or acceptance.</p>
    {!available || snapshot.digestVersion !== 4 ? <p>Requirement search is unavailable for this workspace or connection.</p> : <><form onSubmit={search}><label>Find requirements <input value={query} maxLength={200} onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setFailure(''); setQuery(event.target.value); }} /></label><button type="submit" disabled={pending}>Find requirements</button></form>
      {pending && <p role="status">Searching requirementsâ€¦</p>}{failure && <p role="status">Requirement search unavailable: {failure}</p>}
      {current && <><p aria-live="polite">Showing {result.results.length} of {result.total} matching requirements.</p>{!canLink && <p>Linking is unavailable for this workspace, role or change-set state.</p>}{result.results.length ? <ul>{result.results.map(item => <li key={item.id}><strong>{item.id}</strong><p>{item.statement}</p><p>Linked concepts: {item.classes.length ? item.classes.join(', ') : 'none recorded'}.</p>{item.classes.map(name => <button key={name} type="button" onClick={() => onInspect(name)}>Inspect {name}</button>)}<button type="button" disabled={!canLink || !selected || commandPending || item.classes.includes(selected.name)} onClick={() => onLink(item)}>{selected && item.classes.includes(selected.name) ? `Linked to ${selected.name}` : selected ? `Link ${selected.name}` : 'Select a concept to link'}</button></li>)}</ul> : <p>No requirements match this search.</p>}{result.nextOffset != null && <button type="button" disabled={pending} onClick={() => search(null, result.nextOffset)}>Load more requirements</button>}</>}
    </>}
  </details>;
}

const relationshipCardinalities = { '!': '1', '?': '0..1', '+': '1..*', '*': '0..*' };
function RelationshipList({ graph, onSelect, onEditRelationship, pendingEdgeEdit }) {
  return <div className="studio-relationship-list" role="region" aria-label={`Relationship list for ${graph.root}`}>
    {graph.edges.length ? <ul>{graph.edges.map((edge, index) => <li key={`${edge.predicate}-${index}`}><span>{edge.source === graph.root ? edge.predicate + ' â†’ ' : 'â† ' + edge.predicate + ' from '}</span><button type="button" aria-label={`Open related concept ${edge.source === graph.root ? edge.target : edge.source}`} onClick={() => { const name = edge.source === graph.root ? edge.target : edge.source; onSelect(graph.nodes.find(item => item.name === name)); }}>{edge.source === graph.root ? edge.target : edge.source}</button> <small>{edge.cardinality ? ' (' + (relationshipCardinalities[edge.cardinality] ?? edge.cardinality) + ')' : ''} Â· {edge.changeStatus} Â· {edge.sourceRef.path}:{edge.sourceRef.line}</small>{edge.predicate !== 'subClassOf' && <button type="button" disabled={Boolean(pendingEdgeEdit)} onClick={event => onEditRelationship(edge, event.currentTarget)} aria-label={`Edit relationship ${edge.source} ${edge.predicate} ${edge.target}`}>Edit relationship</button>}</li>)}</ul> : <p>{graph.omitted > 0 || graph.incomingFiltered > 0 || graph.incomingOmitted > 0 ? 'No relationships match the current view.' : 'No explicit class relationships in this view.'}</p>}
  </div>;
}

function ReviewWorkflow({ snapshot, canReview, publisherAvailable, diff, readiness, reviews, decisionsLoaded, publication, canPush, commitWorkflows, onInspect, onChecks, onGo }) {
  const comparison = !diff ? 'Comparison not opened' : diff.revision === snapshot.revision && diff.sourceDigest === snapshot.sourceDigest ? `Comparison current at revision ${diff.revision}` : `Comparison out of date (revision ${diff.revision})`;
  const gates = !readiness || readiness.revision !== snapshot.revision || readiness.sourceDigest !== snapshot.sourceDigest ? 'Review gates not inspected for this draft' : readiness.canAccept ? 'Last inspection: review gates complete for this draft' : `Last inspection: review gates incomplete: ${readiness.missing.length} missing`;
  const latestReview = decisionsLoaded ? reviews[0] : null;
  const reviewCurrent = latestReview && latestReview.revision === snapshot.revision && latestReview.sourceDigest === snapshot.sourceDigest && latestReview.baselineCommit === snapshot.baselineCommit && !(latestReview.decision === 'accept' && snapshot.changeSet && (snapshot.changeSet.reviewId !== latestReview.id || !['accepted', 'published'].includes(snapshot.changeSet.status)));
  const decision = latestReview ? `Latest decision: ${latestReview.decision} Â· revision ${latestReview.revision} Â· ${reviewCurrent ? 'current' : 'out of date'}` : decisionsLoaded ? 'No decision returned' : 'Decision not inspected';
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
    <p>{count('added')} added Â· {count('changed')} changed Â· {count('removed')} removed Â· {diff.additionalSources.length} additional source {diff.additionalSources.length === 1 ? 'file' : 'files'} changed</p>
    <details><summary>Comparison identity</summary><p>Baseline commit: <code>{diff.baselineCommit}</code></p><p>Draft source digest: <code>{diff.sourceDigest}</code></p></details>
    {diff.changes.length ? groups.map(([kind, title]) => {
      const items = diff.changes.filter(item => item.kind === kind);
      return items.length > 0 && <section key={kind} className="studio-change-group" aria-label={title}><h4>{title} ({items.length})</h4><ul>{items.map(item => <li key={item.name}><strong>{item.kind}: {item.name}</strong>{item.after && <button type="button" disabled={stale} onClick={() => onFocus(item.name)}>Focus changed {item.name}</button>}<div className="studio-change-comparison">{item.before && <p>Before: {item.before.definition} {item.before.fields}</p>}{item.after && <p>After: {item.after.definition} {item.after.fields}</p>}</div>{item.fieldChanges?.length > 0 && <ul>{item.fieldChanges.map(change => <li key={change.name}>{change.name}: {change.compatibility}{change.compatibility === 'potentially-breaking' ? ' â€” existing data or consumers may need migration and new tests' : ''}</li>)}</ul>}</li>)}</ul></section>;
    }) : <p>{diff.additionalSources.length ? 'No schema changes; additional source changes are shown below.' : 'No changes from the baseline.'}</p>}
    <details open><summary>Source patch</summary><StudioScrollableText label="Source patch">{diff.source.patch}</StudioScrollableText></details>
    <details><summary>Source before and after</summary><h4>Before</h4><StudioScrollableText label="Source before">{diff.source.before}</StudioScrollableText><h4>After</h4><StudioScrollableText label="Source after">{diff.source.after}</StudioScrollableText></details>
    {diff.additionalSources.map(source => <details key={source.path} open><summary>Source patch: {source.path}</summary><StudioScrollableText label={`Source patch: ${source.path}`}>{source.patch}</StudioScrollableText></details>)}
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
      if (!abort.signal.aborted && page.workspaceId === snapshot.workspaceId && page.revision === snapshot.revision && page.sourceDigest === snapshot.sourceDigest && page.name === entity.name) setLinks(previous => previous?.workspaceId === page.workspaceId && previous.revision === page.revision && previous.sourceDigest === page.sourceDigest && previous.name === page.name && previous.nextOffset === offset ? { ...page, startAt: previous.startAt, results: [...previous.results, ...page.results] } : previous);
    } catch { if (!abort.signal.aborted) setMoreError('Could not load more linked requirements. Try again.'); }
    finally { if (!abort.signal.aborted) setLoadingMore(false); }
  }
  const preview = current ? [
    'Use the connected ontology authoring tools to inspect this context before proposing changes.',
    `Workspace: ${snapshot.workspaceId}; revision: ${snapshot.revision}; source digest: ${snapshot.sourceDigest}.`,
    `Selected concept: ${entity.name}; module: ${entity.module}; parent: ${entity.parent}.`,
    `Definition: ${entity.definition}`,
    !canReadLinks ? 'Explicit concept requirement links are unavailable for this workspace or connection.' : !boundLinks ? 'Explicit concept requirement links are loading.' : boundLinks.error ? 'Explicit concept requirement links could not be loaded.' : `Explicit concept requirement links: ${boundLinks.results.map(item => item.id).join(', ') || 'none recorded'} (${boundLinks.results.length} of ${boundLinks.total} shown). These links do not establish coverage or acceptance.`,
    `Change-set requirement references (not necessarily linked to this concept): ${snapshot.changeSet?.requirements?.join(', ') || 'none recorded'}.`,
    ...contextCheckSummary(validation, snapshot),
    'Inspect the current model and check evidence before editing. This context is a starting point, not an instruction to publish.',
  ].join('\n') : '';
  async function copy() {
    const copiedPreview = preview;
    try { await navigator.clipboard.writeText(copiedPreview); setMessage({ preview: copiedPreview, text: 'Context copied. Paste it into your connected client.' }); }
    catch { setMessage({ preview: copiedPreview, text: 'Clipboard unavailable. Select and copy the preview.' }); }
  }
  useEffect(() => { setMessage(''); }, [preview]);
  return <><details className="studio-requirement-links" onToggle={event => setShowLinks(event.currentTarget.open)}><summary>Linked requirements</summary>
    <p>These are explicit links from the requirement register; they do not establish coverage or acceptance.</p>
    {!current ? <p role="status">Loading the selected concept for the current draft.</p> : !canReadLinks ? <p>Requirement links are unavailable for this workspace or connection.</p> : !boundLinks ? <p role="status">Loading linked requirementsâ€¦</p> : boundLinks.error ? <p role="status">Linked requirements could not be loaded.</p> : <><p>Showing {boundLinks.results.length} of {boundLinks.total} linked requirements.</p>{boundLinks.results.length ? <ul>{boundLinks.results.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <small>{item.source}</small></li>)}</ul> : <p>No explicit links are recorded for this concept.</p>}{boundLinks.nextOffset !== null && <button type="button" disabled={loadingMore} onClick={loadMoreLinks}>{loadingMore ? 'Loading requirementsâ€¦' : 'Load more requirements'}</button>}{moreError && <p role="status">{moreError}</p>}</>}
  </details><details className="studio-context-handoff" onToggle={event => setOpen(event.currentTarget.open)}><summary>Prepare context for Codex</summary>
    <p>Preview and copy this context to your existing client. It includes recorded check status and failed check names, but excludes raw check output and credentials. Nothing is sent automatically.</p>
    {current ? <><label>Context preview <textarea readOnly value={preview} rows={9} /></label><button type="button" onClick={copy}>Copy context</button></> : <p role="status">Loading the selected concept for the current draft.</p>}
    {message?.preview === preview && <p role="status">{message.text}</p>}
  </details></>;
}
function CommandPalette({ commands, onClose, initialQuery = '' }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const [recentIds, setRecentIds] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('chargeweave.studio.recent-commands.v1') || '[]');
      return Array.isArray(saved) ? saved.filter(id => typeof id === 'string').slice(0, 5) : [];
    } catch { return []; }
  });
  const term = query.trim().toLocaleLowerCase();
  const matching = commands.filter(command => `${command.label} ${command.group} ${command.description || ''} ${command.shortcut || ''} ${command.disabledReason || ''}`.toLocaleLowerCase().includes(term));
  const recent = recentIds.map(id => matching.find(command => command.id === id)).filter(Boolean).slice(0, 5);
  const recentSet = new Set(recent.map(command => command.id));
  const groups = [];
  if (recent.length) groups.push({ label: 'Recently used', commands: recent });
  for (const command of matching) {
    if (recentSet.has(command.id)) continue;
    let group = groups.find(item => item.label === command.group);
    if (!group) { group = { label: command.group, commands: [] }; groups.push(group); }
    group.commands.push(command);
  }
  const entries = groups.flatMap(group => group.commands);
  const selected = Math.min(active, entries.length - 1);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    input.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  function execute(command) {
    if (!command || command.disabledReason) return;
    const nextRecent = [command.id, ...recentIds.filter(id => id !== command.id)].slice(0, 5);
    setRecentIds(nextRecent);
    try { window.localStorage.setItem('chargeweave.studio.recent-commands.v1', JSON.stringify(nextRecent)); } catch { /* Recent commands are a convenience, not required state. */ }
    onClose();
    requestAnimationFrame(command.run);
  }
  function moveActive(direction) {
    if (!entries.length) return;
    for (let step = 1; step <= entries.length; step += 1) {
      const candidate = (selected + direction * step + entries.length * 2) % entries.length;
      if (!entries[candidate].disabledReason) { setActive(candidate); return; }
    }
  }
  return <dialog ref={dialog} className="studio-command-palette" aria-labelledby="studio-command-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="studio-command-header"><h2 id="studio-command-title">Commands</h2><button type="button" onClick={onClose} aria-label="Close commands">Close</button></div>
    <label>Find a command <input ref={input} value={query} role="combobox" aria-expanded="true" aria-controls="studio-command-results" aria-autocomplete="list" aria-activedescendant={selected >= 0 && !entries[selected]?.disabledReason ? `studio-command-${selected}` : undefined} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' && entries.length) { event.preventDefault(); moveActive(1); }
      else if (event.key === 'ArrowUp' && entries.length) { event.preventDefault(); moveActive(-1); }
      else if (event.key === 'Enter' && entries.length && !entries[selected]?.disabledReason) { event.preventDefault(); execute(entries[selected]); }
    }} /></label>
    <p className="studio-command-hint">Use arrow keys to choose, Enter to run, or Escape to close. Shortcut labels use Ctrl; use Command on macOS.</p>
    <div id="studio-command-results" role="listbox" aria-label="Available commands">{groups.map(group => <div className="studio-command-group" role="group" aria-label={group.label} key={group.label}><h3>{group.label}</h3><ul>{group.commands.map(command => { const index = entries.indexOf(command); return <li key={command.id}><button id={`studio-command-${index}`} type="button" role="option" aria-selected={index === selected} aria-disabled={Boolean(command.disabledReason)} onMouseDown={event => event.preventDefault()} onClick={() => execute(command)}><span className="studio-command-option-label">{command.label}</span>{command.shortcut && <kbd>{command.shortcut}</kbd>}<small className={command.disabledReason ? 'studio-command-unavailable' : 'studio-command-description'}>{command.disabledReason || command.description}</small></button></li>; })}</ul></div>)}</div>
    {!matching.length && <p role="status">No matching commands.</p>}
  </dialog>;
}
function ScopedSearchResults({ scope, results, total, nextOffset, done, pending, onLoadMore, onInspectField, onInspectConcept }) {
  if (!['properties', 'requirements'].includes(scope) || !done && !pending) return null;
  return <section className="studio-scoped-search" aria-label={`${scope} search results`}>
    <h3>{scope === 'properties' ? 'Properties and relationships' : 'Requirements'}</h3>
    <p aria-live="polite">{pending ? 'Searchingâ€¦' : `Showing ${results.length} of ${total} ${scope}.`}</p>
    {scope === 'properties' && <ul>{results.map(item => <li key={`${item.owner}.${item.name}`}><button type="button" onClick={() => onInspectField(item.owner, item.name)}>Inspect {item.owner}.{item.name}</button><small>{item.kind} Â· {item.owner} Â· {item.range} Â· {cardinalityLabels[item.cardinality] ?? item.cardinality}</small></li>)}</ul>}
    {scope === 'requirements' && <ul>{results.map(item => <li key={item.id}><strong>{item.id}</strong><p>{item.statement}</p>{item.classes?.length > 0 && <div className="studio-requirement-result-classes">{item.classes.map(name => <button type="button" key={name} onClick={() => onInspectConcept(name)}>Inspect {name}</button>)}</div>}</li>)}</ul>}
    {!pending && total === 0 && <p>No {scope} match this search in the current workspace.</p>}
    {nextOffset !== null && <button type="button" disabled={pending} onClick={onLoadMore}>Load more {scope}</button>}
  </section>;
}
function InspectorIdentifier({ iri }) {
  const [notice, setNotice] = useState(null);
  async function copy() {
    const copiedIri = iri;
    try { await navigator.clipboard.writeText(copiedIri); setNotice({ iri: copiedIri, text: 'Identifier copied.' }); }
    catch { setNotice({ iri: copiedIri, text: 'Clipboard unavailable; select and copy the identifier shown here.' }); }
  }
  return <div className="studio-identifier"><p>IRI: <code>{iri}</code></p><button type="button" onClick={copy}>Copy identifier</button>{notice?.iri === iri && <p aria-live="polite">{notice.text}</p>}</div>;
}
function InspectorFields({ fields, onEdit, onRequire, onNarrowValues, onInspectOwner, commandPending, narrowing, editingLocked, editingField, requiring, focusField, onFieldFocused }) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('source');
  const [origin, setOrigin] = useState('all');
  const table = useRef(null);
  useEffect(() => { if (focusField) { setFilter(''); setOrigin('all'); } }, [focusField]);
  useEffect(() => {
    if (!focusField || filter || origin !== 'all') return undefined;
    const frame = requestAnimationFrame(() => {
      const cell = [...(table.current?.querySelectorAll('[data-inspector-field]') || [])].find(element => element.dataset.inspectorField === focusField);
      if (cell) { cell.scrollIntoView({ block: 'nearest', inline: 'nearest' }); cell.focus({ preventScroll: true }); }
      onFieldFocused(Boolean(cell));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusField, filter, origin, fields, onFieldFocused]);
  if (!fields.length) return <p>No fields.</p>;
  const term = filter.trim().toLocaleLowerCase();
  const visible = fields.filter(item => (origin === 'all' || (origin === 'inherited') === item.inherited) && `${item.property} ${item.range} ${item.description || ''} ${item.owner}`.toLocaleLowerCase().includes(term));
  if (sort === 'name') visible.sort((a, b) => a.property.localeCompare(b.property));
  if (sort === 'type') visible.sort((a, b) => a.range.localeCompare(b.range) || a.property.localeCompare(b.property));
  return <><div className="studio-field-controls"><label>Filter fields <input value={filter} onChange={event => setFilter(event.target.value)} /></label><label>Field origin <select value={origin} onChange={event => setOrigin(event.target.value)}><option value="all">All fields</option><option value="declared">Declared here</option><option value="inherited">Inherited</option></select></label><label>Sort fields <select value={sort} onChange={event => setSort(event.target.value)}><option value="source">Source order</option><option value="name">Name</option><option value="type">Type</option></select></label></div><p aria-live="polite">Showing {visible.length} of {fields.length} fields.</p>{!visible.length && <p>No fields match these filters. Clear the text or change the origin.</p>}<p className="studio-field-table-hint">Scroll the field table horizontally to see all columns and actions.</p><div className="studio-field-table-wrap" role="region" aria-label="Fields table, scroll horizontally" tabIndex={0}><table ref={table} className="studio-field-table">
    <thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Cardinality</th><th scope="col">Origin</th><th scope="col">Actions</th></tr></thead>
    <tbody>{visible.map((item, index) => <tr key={`${item.owner}-${item.property}-${index}`}>
      <th scope="row" tabIndex={-1} data-inspector-field={item.property}>{item.property}<small>{item.source.path}:{item.source.line}</small>{item.description && <small>{item.description}</small>}</th>
      <td>{item.range}</td><td>{cardinalityLabels[item.cardinality] ?? item.cardinality}</td><td>{item.inherited ? `Inherited from ${item.owner}` : 'Declared here'}</td><td>
        {item.inherited && <button type="button" onClick={() => onInspectOwner(item.owner)}>Inspect owner {item.owner}</button>}
        {!item.inherited && <button type="button" disabled={Boolean(editingField) || requiring || commandPending || editingLocked} onClick={event => onEdit(item, event.currentTarget)}>Edit {item.property}</button>}
        {!item.inherited && item.values?.length >= 3 && <button type="button" disabled={commandPending || narrowing || requiring || editingLocked} title={editingLocked ? 'Reopen the change set before editing.' : undefined} onClick={event => onNarrowValues(item, event.currentTarget)}>Narrow values for {item.property}</button>}
        {!item.inherited && item.type === 'object' && ['?', '*'].includes(item.cardinality) && <button type="button" disabled={commandPending || narrowing || editingField || requiring || editingLocked} title="Requiring a relationship may break existing data." onClick={event => onRequire(item, event.currentTarget)}>Require {item.property}</button>}
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
  const [compactLayout, setCompactLayout] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [studioUtility, setStudioUtility] = useState(null);
  const [dockPanel, setDockPanel] = useState(null);
  const [undoCandidate, setUndoCandidate] = useState(null);
  const [explorerExpansion, setExplorerExpansion] = useState({});
  const [compactSurface, setCompactSurface] = useState('model');
  const [editorDocument, setEditorDocument] = useState('diagram');
  const [dockLimit, setDockLimit] = useState(resultsHeightLimit);
  const [dockHeight, setDockHeight] = useState(() => Math.min(resultsHeightLimit(), panelWidth('results-height', 184, 160, 600)));
  useEffect(() => {
    if (compactSurface === 'results') return;
    if (isCompact) setDockPanel(null);
    setStudioUtility(null);
    const context = document.querySelector('.studio-context-tools');
    if (context) context.open = false;
    const connectionTools = document.querySelector('.studio-connection-tools');
    if (connectionTools) connectionTools.open = false;
  }, [compactSurface, isCompact]);
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
  const [searchScope, setSearchScope] = useState('concepts');
  const [results, setResults] = useState([]);
  const [scopedSearchResults, setScopedSearchResults] = useState([]);
  const [scopedSearchDone, setScopedSearchDone] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchNextOffset, setSearchNextOffset] = useState(null);
  const [searchDone, setSearchDone] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const lastSearch = useRef(null);
  const [browse, setBrowse] = useState(null);
  const [browsePending, setBrowsePending] = useState(false);
  const [browsePageError, setBrowsePageError] = useState('');
  const [revealTarget, setRevealTarget] = useState('');
  const [browseChangedOnly, setBrowseChangedOnly] = useState(false);
  const [browseParent, setBrowseParent] = useState('');
  const browseParentInput = useRef(null);
  const browseRequest = useRef(0);
  const browseSelection = useRef({ endpoint: null, workspaceId: null, module: '', parent: '', changedOnly: false });
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
  const [compactListOpen, setCompactListOpen] = useState(true);
  const [incomingLimit, setIncomingLimit] = useState(20);
  const [outgoingLimit, setOutgoingLimit] = useState(12);
  const [groupName, setGroupName] = useState('');
  const [canvasGroupName, setCanvasGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const pendingViewInput = useRef(false);
  pendingViewInput.current = Boolean(annotationText.trim() || groupName.trim() || groupMembers.trim() || canvasGroupName.trim());
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [viewNotice, setViewNotice] = useState('');
  const [viewManifestDraft, setViewManifestDraft] = useState(null);
  const [viewImportNotice, setViewImportNotice] = useState('');
  const [hideNavigator, setHideNavigator] = useState(() => panelHidden('navigator-hidden', false));
  const [hideInspector, setHideInspector] = useState(() => panelHidden('inspector-hidden', window.matchMedia('(min-width: 901px) and (max-width: 1399px)').matches));
  const [navigatorWidth, setNavigatorWidth] = useState(() => panelWidth('navigator-width', 240, 200, 360));
  const [inspectorWidth, setInspectorWidth] = useState(() => panelWidth('inspector-width', 320, 280, 440));
  const [entityInfo, setEntityInfo] = useState(null);
  const [issueFieldTarget, setIssueFieldTarget] = useState(null);
  useEffect(() => { setIssueFieldTarget(target => target && (target.owner !== selected?.name || target.revision !== snapshot?.revision) ? null : target); }, [connection, selected?.name, snapshot?.revision]);
  const [entityReload, setEntityReload] = useState(0);
  const [pendingEdgeEdit, setPendingEdgeEdit] = useState(null);
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
  const [intervalBase, setIntervalBase] = useState(null);
  const [intervalLatest, setIntervalLatest] = useState(null);
  const [intervalReviewPending, setIntervalReviewPending] = useState(false);
  const [intervalReviewError, setIntervalReviewError] = useState('');
  const intervalReviewRequest = useRef(0);
  const intervalBaseRef = useRef(null);
  const intervalRuleRef = useRef(intervalRule);
  intervalBaseRef.current = intervalBase;
  intervalRuleRef.current = intervalRule;
  const [binding, setBinding] = useState({ property: '', label: '', category: 'ownership' });
  const [bindingBase, setBindingBase] = useState(null);
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
  const requiredChecksRequest = useRef(0);
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
  const [definitionBase, setDefinitionBase] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null);
  const definitionRef = useRef(definition);
  definitionRef.current = definition;
  const [rationale, setRationale] = useState('');
  const [changeSetIntent, setChangeSetIntent] = useState('');
  const [changeSetRequirements, setChangeSetRequirements] = useState('');
  const [newClass, setNewClass] = useState({ name: '', module: 'foundation', parent: 'Record', definition: '' });
  const [conceptDefaults, setConceptDefaults] = useState({ module: 'foundation', parent: 'Record' });
  const [conceptDraftBase, setConceptDraftBase] = useState(null);
  const [pendingCreatedConcept, setPendingCreatedConcept] = useState(null);
  const selectionGeneration = useRef(0);
  const initialViewChoice = useRef(null);
  const [conceptFormOpen, setConceptFormOpen] = useState(false);
  const [parentSuggestions, setParentSuggestions] = useState([]);
  const [parentSearchError, setParentSearchError] = useState('');
  const [fieldFormOpen, setFieldFormOpen] = useState(false);
  const [rangeSuggestions, setRangeSuggestions] = useState([]);
  const [rangeSearchError, setRangeSearchError] = useState('');
  const [rangeSource, setRangeSource] = useState('add');
  const [field, setField] = useState({ name: '', range: 'string', cardinality: '?' });
  const [fieldValueCandidate, setFieldValueCandidate] = useState('');
  const [fieldDraftBase, setFieldDraftBase] = useState(null);
  const [relationshipDraft, setRelationshipDraft] = useState(null);
  const relationshipDraftRef = useRef(null);
  relationshipDraftRef.current = relationshipDraft;
  const [relationshipReview, setRelationshipReview] = useState(null);
  const [relationshipReviewPending, setRelationshipReviewPending] = useState(false);
  const [relationshipReviewError, setRelationshipReviewError] = useState('');
  const relationshipReviewRequest = useRef(0);
  const [relationshipSubmitting, setRelationshipSubmitting] = useState(false);
  const [fieldEdit, setFieldEdit] = useState(null);
  const [valueConstraint, setValueConstraint] = useState(null);
  const [requiredDraft, setRequiredDraft] = useState(null);
  const requiredTrigger = useRef(null);
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
    const update = () => setCompactLayout(media.matches);
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
      l…36562 tokens truncated…iew-document" onClick={() => setEditorDocument('review')}>Review</button></nav><div id="studio-diagram-document" hidden={editorDocument !== 'diagram'}><nav className="studio-view-tabs" aria-label="Open diagram views">{openViewIds.map(id => { const changed = changedViews.current.has(JSON.stringify([connection?.endpoint, connection?.workspaceId, id])); return <span className="studio-view-tab" key={id}><button type="button" data-view-id={id} aria-current={id === viewId ? "page" : undefined} aria-label={`${id}${changed ? ", local changes" : ""}`} onClick={() => { switchView(id); setEditorDocument('diagram'); }}>{id}{changed && <span aria-hidden="true"> â€¢</span>}</button><button type="button" className="studio-view-close" aria-label={`Close ${id} view`} disabled={openViewIds.length < 2 || Boolean(pendingViewOps[JSON.stringify([connection?.endpoint, connection?.workspaceId, id])])} title={openViewIds.length < 2 ? "Keep at least one view open" : pendingViewOps[JSON.stringify([connection?.endpoint, connection?.workspaceId, id])] ? "Wait for the view operation to finish" : changed ? "Close and discard local changes" : "Close view"} onClick={() => closeView(id)}>Ã—</button></span>; })}</nav><details id="studio-concept-creator" onToggle={event => setConceptFormOpen(event.currentTarget.open)}><summary>Add a concept</summary><form onSubmit={addClass}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Class name <input pattern="[A-Za-z][A-Za-z0-9]*" maxLength={128} value={newClass.name} onChange={e => updateConceptDraft({ name: e.target.value })} required /></label><label>Module {browse?.modules?.length ? <select aria-label="Concept module" value={newClass.module} onChange={e => updateConceptDraft({ module: e.target.value })} required><option value="">Choose a module</option>{browse.modules.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select> : <input aria-label="Concept module" value={newClass.module} onChange={e => updateConceptDraft({ module: e.target.value })} required />}</label><label>Parent class <input list="studio-parent-suggestions" value={newClass.parent} onChange={e => updateConceptDraft({ parent: e.target.value })} required /></label><datalist id="studio-parent-suggestions">{[...new Set([...(browse?.results || []).map(item => item.name), ...results.map(item => item.name), ...parentSuggestions.map(item => item.name)])].map(name => <option key={name} value={name} />)}</datalist><p>Live search shows up to 25 matches; already loaded concepts may also appear.</p>{parentSearchError && <p role="status">{parentSearchError}</p>}<label>Class definition <textarea value={newClass.definition} onChange={e => updateConceptDraft({ definition: e.target.value })} required /></label><button disabled={commandPending || !conceptDraftBase || conceptDraftStale || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Add concept</button>{conceptDraftStale && <div role="alert"><p>The workspace changed since this concept draft began. Your input is retained; review the latest model and draft before continuing.</p><p>Draft: {newClass.name || '(unnamed)'}; module: {newClass.module || '(none)'}; parent: {newClass.parent || '(none)'}; definition: {newClass.definition || '(none)'}.</p><p>Concept search is bounded; the server checks name and parent validity when applying.</p><button type="button" disabled={commandPending || !browse || browse.error || browse.revision !== snapshot.revision || !browse.modules.some(item => item.name === newClass.module) || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={() => setConceptDraftBase(currentConceptDraftBase())}>Reviewed latest, continue concept draft</button></div>}</fieldset></form></details>{!graph && <div className="studio-editor-empty"><h3>Explore your model</h3><p>Select a concept in the navigator to open its relationships here.</p><div className="studio-empty-actions"><button type="button" onClick={focusModelSearch}>Search concepts</button><button type="button" onClick={openConceptCreator}>Create a concept</button></div></div>}{graph && <div className="studio-graph"><h3>Concept neighbourhood <button className="studio-quick-create" type="button" onClick={openConceptCreator}>Create a concept</button></h3><p>View: <strong>{graph.root}</strong></p><div className="studio-diagram-toolbar"><nav className="studio-view-history" aria-label="Diagram navigation"><button type="button" disabled={rootHistory.index <= 0} onClick={() => navigateViewHistory(-1)}>Previous view</button><button type="button" disabled={rootHistory.index >= rootHistory.entries.length - 1} onClick={() => navigateViewHistory(1)}>Next view</button></nav><div className="studio-view-controls"><label>Graph viewpoint <select value={viewMetadata.viewpoint ?? 'information'} onChange={event => updateViewMetadata('viewpoint', event.target.value)}><option value="information">Information</option><option value="responsibility">Responsibility</option><option value="temporal">Temporal</option></select></label><label>Filter graph relationships <input value={viewMetadata.filter ?? ''} maxLength={200} onChange={event => updateViewMetadata('filter', event.target.value)} /></label></div></div>{compactLayout && <details className="studio-compact-relationships" open={compactListOpen} onToggle={event => setCompactListOpen(event.currentTarget.open)}><summary>Relationship list ({graph.edges.length})</summary><RelationshipList graph={graph} onSelect={item => { pauseFollowing(); selectConcept(item); }} onEditRelationship={editDiagramRelationship} pendingEdgeEdit={pendingEdgeEdit} /></details>}<ModellingCanvas newGroupName={canvasGroupName} setNewGroupName={setCanvasGroupName} key={`${graph.workspaceId}-${viewId}-${canvasVersion}`} graph={graph} viewId={viewId} viewGroups={viewGroups} groupsEditable={viewReadyKey === activeViewKey && viewLoaded && savedViewRevision !== null && !pendingViewOps[activeViewKey]} onCreateGroup={group => { markViewEdited(); setViewGroups(previous => [...previous, group]); return true; }} onRemoveGroup={(index, expected) => { if (viewGroups[index] !== expected) return false; markViewEdited(); setViewGroups(previous => previous.filter(item => item !== expected)); return true; }} onLayoutChange={markViewEdited} onManualInteraction={() => { if (initialViewChoice.current?.key === activeViewKey) initialViewChoice.current.automatic = false; pauseFollowing(); }} onConnect={({ source, target }) => startRelationship(source, target)} onEditRelationship={editDiagramRelationship} pendingEdgeEdit={pendingEdgeEdit} selectedName={selected?.name} onSelect={inspectFromCanvas} />{(viewMetadata.viewpoint ?? 'information') === 'information' && <label className="studio-incoming-toggle"><input type="checkbox" checked={showIncoming} onChange={event => setShowIncoming(event.target.checked)} /> Show incoming references</label>}{graph.incomingFiltered > 0 && <p>{graph.incomingFiltered} loaded incoming references hidden by the current filter.</p>}{Boolean(viewMetadata.filter?.trim()) && (graph.incomingOmitted > 0 || graph.remainingOutgoing > 0) && <p role="status">The filter applies to loaded relationships only. Show more relationships to search further.</p>}{graph.incomingOmitted > 0 && <p>{graph.incomingOmitted} additional incoming references are not shown. {incomingLimit < 100 ? <button type="button" onClick={() => setIncomingLimit(limit => Math.min(100, limit + 20))}>Show more incoming</button> : 'Use Referenced by in the inspector to browse them.'}</p>}<details><summary>Diagram legend</summary><p>Concept card borders show draft changes: dashed green means added; amber means changed.</p><dl className="studio-diagram-legend"><dt>1</dt><dd>Exactly one</dd><dt>0..1</dt><dd>Optional, at most one</dd><dt>1..*</dt><dd>One or more</dd><dt>0..*</dt><dd>Zero or more</dd></dl><p>Relationship labels are shown where the source specifies cardinality.</p></details><details><summary>About viewpoints</summary><p>Filters and viewpoints affect presentation only. Responsibility uses explicit mappings; temporal edges show explicit window references.</p></details><>{(graph.revision !== snapshot.revision || graph.root !== viewRoot || graph.viewpoint !== (viewMetadata.viewpoint ?? 'information')) && <p aria-live="polite">Updating graph for the current selection and revision.</p>}</><p>Shared view: <strong>{viewId}</strong>; revision: {savedViewRevision ?? 'loading'}.</p><label>View ID <input value={viewIdInput} onChange={event => setViewIdInput(event.target.value)} maxLength={64} /></label><button type="button" disabled={!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(viewIdInput)} onClick={() => switchView(viewIdInput)}>Choose view ID</button>{savedViews.length > 0 && <label>Existing shared views <select value={savedViews.some(view => view.viewId === viewId) ? viewId : ''} onChange={event => { if (event.target.value) { switchView(event.target.value); } }}><option value="">Choose saved view</option>{savedViews.map(view => <option key={view.viewId} value={view.viewId}>{view.viewId} (revision {view.viewRevision})</option>)}</select></label>}{savedViewRevision > 0 && !viewLoaded && <p>Load this view before saving so its notes and groups are preserved.</p>}<details><summary>View groups and annotations</summary><p>These are presentation notes, not ontology relationships.</p><label>Group name <input value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={100} /></label><label>Group concepts (comma separated) <input value={groupMembers} onChange={event => setGroupMembers(event.target.value)} /></label><button type="button" disabled={!groupName.trim() || !groupMembers.trim()} onClick={() => { markViewEdited(); setViewGroups([...viewGroups, { name: groupName.trim(), members: groupMembers.split(',').map(name => name.trim()).filter(Boolean) }]); setGroupName(''); setGroupMembers(''); }}>Add view group</button><button type="button" disabled={!groupName && !groupMembers} onClick={() => { setGroupName(''); setGroupMembers(''); }}>Clear unfinished group</button><ul>{viewGroups.map((group, index) => <li key={`${group.name}-${index}`}>{group.name}: {group.members.join(', ')} <button type="button" onClick={() => { markViewEdited(); setViewGroups(viewGroups.filter((_, i) => i !== index)); }}>Remove group {group.name}</button></li>)}</ul><label>Note for selected concept <textarea value={annotationText} onChange={event => setAnnotationText(event.target.value)} maxLength={1000} /></label><button type="button" disabled={!annotationText.trim()} onClick={() => { markViewEdited(); setViewAnnotations([...viewAnnotations, { target: selected.name, text: annotationText.trim() }]); setAnnotationText(''); }}>Add view note</button><button type="button" disabled={!annotationText} onClick={() => setAnnotationText('')}>Clear unfinished note</button><ul>{viewAnnotations.map((note, index) => <li key={`${note.target}-${index}`}>{note.target}: {note.text} <button type="button" onClick={() => { markViewEdited(); setViewAnnotations(viewAnnotations.filter((_, i) => i !== index)); }}>Remove note {index + 1}</button></li>)}</ul></details><button type="button" disabled={viewReadyKey !== activeViewKey || savedViewRevision === null || !viewLoaded || graph.root !== viewRoot || viewBusy?.context === viewContext.current} onClick={saveLayout}>Save shared view</button><button type="button" disabled={viewReadyKey !== activeViewKey || savedViewRevision === null || viewBusy?.context === viewContext.current} onClick={loadLayout}>Load shared view</button>{viewBusy?.context === viewContext.current && <span aria-live="polite">{viewBusy.kind === 'save' ? 'Saving shared viewâ€¦' : 'Loading shared viewâ€¦'}</span>}{graph && savedViewRevision > 0 && <button type="button" onClick={exportView}>Export saved view</button>}{viewNotice && <p aria-live="polite">{viewNotice}</p>}{!compactLayout && <RelationshipList graph={graph} onSelect={item => { pauseFollowing(); selectConcept(item); }} onEditRelationship={editDiagramRelationship} pendingEdgeEdit={pendingEdgeEdit} />}{graph.remainingOutgoing > 0 && <p>{graph.remainingOutgoing} additional outgoing relationships are not shown. {outgoingLimit < 100 ? <button type="button" onClick={() => setOutgoingLimit(limit => Math.min(100, limit + 12))}>Show more outgoing</button> : 'Inspect the concept fields for the full declaration.'}</p>}{graph.omitted > graph.remainingOutgoing && <p>{graph.omitted - graph.remainingOutgoing} relationships hidden by the current filter.</p>}<details><summary>Create a relationship using the keyboard</summary><p>Select a target from this neighbourhood.</p>{graph.nodes.filter(node => node.name !== graph.root).map(node => <button type="button" key={node.name} onClick={() => startRelationship(graph.root, node.name)}>Relate {graph.root} to {node.name}</button>)}</details>{relationshipDraft && <form onSubmit={addRelationship} aria-label="New relationship" onKeyDown={event => { if (event.key === 'Escape' && !relationshipReviewPending) { event.preventDefault(); cancelRelationship(); } }}><fieldset className="studio-command-fields" disabled={commandPending || relationshipReviewPending}><legend className="sr-only">Relationship change</legend><h4>New relationship</h4><p>{relationshipDraft.source} â†’ {relationshipDraft.target}</p><p>Opening or cancelling this form does not change the model.</p><label>Predicate name <input value={relationshipDraft.name} onChange={event => setRelationshipDraft({ ...relationshipDraft, name: event.target.value })} pattern="[A-Za-z][A-Za-z0-9]*" maxLength={128} required /></label><label>Relationship description <textarea value={relationshipDraft.description} onChange={event => setRelationshipDraft({ ...relationshipDraft, description: event.target.value })} maxLength={4000} required /></label><label>Relationship cardinality <select value={relationshipDraft.cardinality} onChange={event => setRelationshipDraft({ ...relationshipDraft, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label>{relationshipDraftStale && <div role="alert"><p>The workspace changed while this relationship was being drafted. Your input is retained; inspect the latest endpoint concepts before continuing.</p><p>Draft: {relationshipDraft.source} ? {relationshipDraft.target}; predicate {relationshipDraft.name || '(not entered)'}; cardinality {cardinalityLabels[relationshipDraft.cardinality]}; description: {relationshipDraft.description || '(not entered)'}.</p><button type="button" disabled={relationshipReviewPending || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={inspectLatestRelationship}>Inspect latest relationship endpoints</button>{relationshipReviewPending && <p role="status">Loading current endpoints?</p>}{relationshipReviewError && <p role="status">{relationshipReviewError}</p>}{relationshipReview && <><p>Current source {relationshipReview.source.name}: {relationshipReview.source.definition}</p><p>Current target {relationshipReview.target.name}: {relationshipReview.target.definition}</p><p>The server checks predicate uniqueness and compatibility when applying.</p><button type="button" disabled={!relationshipReviewReady} onClick={useReviewedRelationship}>Reviewed latest, keep relationship input</button></>}</div>}<button disabled={relationshipSubmitting || relationshipDraftStale}>Create relationship</button><button type="button" onClick={cancelRelationship}>Cancel relationship</button></fieldset></form>}</div>}<p>{snapshot.title}</p><label>Reason for next edit (optional) <input value={rationale} disabled={commandPending} maxLength={2000} onChange={event => setRationale(event.target.value)} /></label><p>The reason is recorded with the next submitted ontology edit.</p><p>Source digest: <code>{snapshot.sourceDigest}</code></p><p>Live changes update the revision and refresh the current search results.</p><button type="button" onClick={() => runChecks('structural')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run structural generator</button><button type="button" onClick={() => runChecks('reference')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run reference checks</button><button type="button" onClick={() => runChecks('audit')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run independent audit</button><button type="button" onClick={() => runChecks('maintenance-demo')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run maintenance fixtures</button><button type="button" onClick={() => runChecks('acceptance')} disabled={['queued', 'running', 'cancelling'].includes(job?.status)}>Run release gates</button>{job && <div>{['queued', 'running'].includes(job.status) && <button type="button" onClick={cancelCheck}>Cancel check</button>}{job.profile} checks: {job.status} for revision {job.revision}{job.digest !== snapshot.sourceDigest || job.revision !== snapshot.revision ? ' (stale)' : ''}. Other required acceptance checks may still be missing. {job.steps?.length > 0 && <ul>{job.steps.map(step => <li key={step.ordinal}>{step.checkName}: {step.status}</li>)}</ul>} {job.output && <details><summary>Output</summary><pre>{job.output}</pre></details>}</div>}<button type="button" onClick={reviewDraftChanges}>Inspect changes</button></div><div id="studio-changes-document" hidden={editorDocument !== 'changes'}>{diff && <DraftChangeReview diff={diff} snapshot={snapshot} onFocus={selectPerspectiveConcept} onRefresh={reviewDraftChanges} />}</div><div id="studio-review-document" hidden={editorDocument !== 'review'}>
    <ReviewWorkflow snapshot={snapshot} diff={diff} readiness={readiness} reviews={reviews} decisionsLoaded={decisionsLoaded} publication={publication} canPush={canPush} commitWorkflows={commitWorkflows} publisherAvailable={availableTools.includes('ontology_publication_capabilities')} canReview={availableTools.includes('ontology_changeset_review')} onInspect={reviewDraftChanges} onChecks={showValidation} onGo={openWorkspaceTask} />
    <section className="studio-activity"><h2>Change impact</h2><button type="button" onClick={inspectImpact}>Inspect explicit impact references</button>{impact && impact.revision === snapshot.revision && <><p>{impact.note}</p><p>Changed classes: {impact.changedClasses.join(', ') || 'none'}; changed properties: {impact.changedProperties.join(', ') || 'none'}.</p>{impact.references.length ? <ul>{impact.references.map(item => <li key={`${item.kind}-${item.id}`}>{item.kind} {item.id}: {item.title} Â· {item.source} Â· references {item.terms.join(', ')}</li>)}</ul> : <p>No indexed baseline references matched.</p>}{impact.omitted > 0 && <p>{impact.omitted} additional references omitted.</p>}</>}</section>
    <div className="studio-review-tools" role="region" aria-labelledby="studio-review-tools-heading">
    <header className="studio-review-tools-header"><h2 id="studio-review-tools-heading">Review and publication</h2><p>Inspect evidence, record a decision, and follow the publication stages for this draft.</p></header>
    <section className="studio-activity"><h2 id="studio-review-heading" tabIndex={-1}>Review readiness</h2><button type="button" disabled={!availableTools.includes('ontology_review_readiness')} onClick={inspectReadiness}>Inspect review gates</button>{!availableTools.includes('ontology_review_readiness') && <p>Review gates require reviewer access.</p>}{readiness && <><p>Revision {readiness.revision}, digest <code>{readiness.sourceDigest}</code></p><p>{readiness.canAccept ? 'Ready for a reviewer decision.' : 'Review gates are incomplete.'} {readiness.note}</p><ul>{readiness.evidence.map(item => <li key={item.profile}>{item.profile}: {item.job ? `${item.job.status} at revision ${item.job.revision}` : 'not run for this draft'}</li>)}</ul><ul>{readiness.missing.map(item => <li key={item}>Missing: {item}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2 id="studio-publication-heading" tabIndex={-1}>Publication preflight</h2><p>Check the target and available evidence before review. Publication requires a current review and explicit publisher permission.</p><button type="button" disabled={!availableTools.includes('ontology_publication_preflight')} onClick={inspectPublication}>Check publication target</button>{!availableTools.includes('ontology_publication_preflight') && <p>Publication preflight is unavailable for this connection.</p>}{publication && publication.revision === snapshot.revision && <><p>Target: {publication.target.repository} Â· {publication.target.branch} Â· {publication.target.status}.</p><p>Baseline: <code>{publication.baselineCommit}</code>; target head: <code>{publication.target.head ?? 'unavailable'}</code>.</p><p>Changed source files: {publication.sourceFiles.join(', ') || 'none'}.</p>{publication.comparison && <><p>Remote comparison: {publication.comparison.status}. {publication.comparison.note}</p><p>Overlapping files: {publication.comparison.overlap.join(', ') || 'none identified'}.</p><details><summary>Files changed on target</summary><ul>{publication.comparison.changedFiles.map(path => <li key={path}>{path}</li>)}</ul></details></>}<p>Generated comparison: {publication.generatedEvidence ? `${publication.generatedEvidence.summary.changedCount} byte-different files from ${publication.generatedEvidence.profile} checks` : 'not available for this revision'}.</p><ul>{publication.limitations.map(item => <li key={item}>{item}</li>)}</ul></>}</section>
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
    <section className="studio-activity"><h2 id="studio-commit-checks-heading" tabIndex={-1}>GitHub commit checks</h2><p>Look up workflow runs for a full commit SHA. This does not check branch-protection requirements or deployment.</p>{!availableTools.includes('ontology_github_commit_workflows') && <p>Commit workflow lookup is unavailable for this connection.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_github_commit_workflows')}><form onSubmit={inspectCommitWorkflows}><label>Commit SHA <input value={commitSha} onChange={event => updateCommitSha(event.target.value)} pattern="[a-f0-9]{40}" required /></label><button>Check commit workflows</button></form></fieldset>{commitWorkflows && <><p>Commit <code>{commitWorkflows.sha}</code>: {commitWorkflows.status}. {commitWorkflows.reason || commitWorkflows.note}</p><ul>{commitWorkflows.workflows.map(run => <li key={run.id}><a href={run.url} target="_blank" rel="noreferrer">{run.name}</a>: {run.status}{run.conclusion ? ` ? ${run.conclusion}` : ''}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Required status checks</h2><p>Use the commit SHA above. Missing policy access or incomplete results remain unknown.</p><button type="button" disabled={!availableTools.includes('ontology_github_required_checks') || !/^[a-f0-9]{40}$/.test(commitSha)} onClick={inspectRequiredChecks}>Check required status checks</button>{!availableTools.includes('ontology_github_required_checks') && <p>Required-check lookup is unavailable for this connection.</p>}{requiredChecks && <><p>Commit <code>{requiredChecks.sha}</code>: {requiredChecks.status}. {requiredChecks.note}</p><ul>{requiredChecks.checks.map(check => <li key={`${check.context}-${check.appId}`}>{check.context}: {check.status}{check.appId != null && ` (app ${check.appId})`}</li>)}</ul></>}</section>
    <section className="studio-activity"><h2>Reviewer interval case</h2><p>Write a separate synthetic example and expected outcome. Review whether it is independent and relevant; saving it does not run validation.</p>{!availableTools.includes('ontology_reviewer_interval_case_add') && <p>Reviewer case editing is unavailable for this connection. Connect with reviewer access.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_reviewer_interval_case_add')}><form onSubmit={submitReviewCase}><label>Requirement ID <input value={reviewCase.requirementId} onChange={event => setReviewCase({ ...reviewCase, requirementId: event.target.value })} pattern="BR-[0-9]+" required /></label><label>Rule ID <input value={reviewCase.ruleId} onChange={event => setReviewCase({ ...reviewCase, ruleId: event.target.value })} pattern="B[0-9]{3,6}" required /></label><label>Unique case ID <input value={reviewCase.caseId} onChange={event => setReviewCase({ ...reviewCase, caseId: event.target.value })} pattern="[A-Za-z0-9][A-Za-z0-9-]*" maxLength={128} required /></label><label>Start (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.start} onChange={event => setReviewCase({ ...reviewCase, start: event.target.value })} required /></label><label>End (UTC, YYYY-MM-DDTHH:MM:SSZ) <input value={reviewCase.end} onChange={event => setReviewCase({ ...reviewCase, end: event.target.value })} required /></label><label>Expected outcome <select value={reviewCase.expectedConformance} onChange={event => setReviewCase({ ...reviewCase, expectedConformance: event.target.value })}><option value="true">Conforms</option><option value="false">Violates rule</option></select></label><label>Business scenario and expected result <textarea value={reviewCase.scenario} onChange={event => setReviewCase({ ...reviewCase, scenario: event.target.value })} minLength={12} maxLength={1000} required /></label><button>Save reviewer case</button></form></fieldset></section>
    <section className="studio-activity"><h2 id="studio-review-decision-heading" tabIndex={-1}>Reviewer decision</h2><p>Acceptance records a reviewer decision for this exact draft; it does not publish or establish business completeness. A rejection does not erase the draft.</p>{!availableTools.includes('ontology_changeset_review') && <p>Reviewer decisions are unavailable for this connection. Connect with reviewer access.</p>}<fieldset className="studio-command-fields" disabled={!availableTools.includes('ontology_changeset_review')}><form onSubmit={submitReview}><label>Decision <select value={reviewDecision} onChange={event => setReviewDecision(event.target.value)}><option value="request_changes">Request changes</option><option value="reject">Reject draft</option><option value="accept">Accept draft</option></select></label><label>Reason <textarea value={reviewReason} onChange={event => setReviewReason(event.target.value)} maxLength={4000} required /></label><button>Record reviewer decision</button></form></fieldset>{reviews.length > 0 && <ol>{reviews.map(review => <li key={review.id}>{review.decision === 'reject' ? 'Rejected' : review.decision === 'accept' ? 'Accepted' : 'Changes requested'} Â· revision {review.revision} Â· {review.actor} Â· {review.revision !== snapshot.revision || review.sourceDigest !== snapshot.sourceDigest || Boolean(review.decision === 'accept' && snapshot.changeSet && (snapshot.changeSet.reviewId !== review.id || !['accepted', 'published'].includes(snapshot.changeSet.status))) ? 'stale' : 'current'}<p>{review.reason}</p></li>)}</ol>}</section>
    </div>
</div></section>
      <section id="studio-inspector-pane" hidden={!isCompact && hideInspector}><h2 tabIndex={-1}>Inspector</h2>{pendingEdgeEdit && <div role="status">Loading {pendingEdgeEdit.owner}.{pendingEdgeEdit.name} for editingâ€¦ <button type="button" onClick={() => setPendingEdgeEdit(null)}>Cancel opening relationship editor</button></div>}<datalist id="studio-field-type-suggestions">{scalarTypes.map(type => <option key={type} value={type} label="Datatype" />)}{[...new Set([...(browse?.results || []).map(item => item.name), ...results.map(item => item.name), ...(graph?.nodes || []).map(item => item.name), ...rangeSuggestions.map(item => item.name)])].filter(name => !scalarTypes.includes(name)).map(name => <option key={name} value={name} label="Concept" />)}</datalist>{selected ? <><h3>{selected.name}</h3><p className="studio-inspector-context">Class{selected.module ? ` / ${selected.module}` : ''}</p><button type="button" onClick={focusModelSearch}>Find a concept</button>{viewRoot !== selected.name && <button type="button" onClick={() => { focusViewRoot(selected.name); setEditorDocument('diagram'); if (window.matchMedia('(max-width: 900px)').matches) openCompactPane('studio-editor-pane'); }}>Focus neighbourhood</button>}<form onSubmit={saveDefinition}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Definition <textarea value={definition} onChange={event => { const value = event.target.value; if (!definitionBase && value !== selected.definition) setDefinitionBase({ workspaceId: connection.workspaceId, name: selected.name, original: selected.definition, revision: snapshot.revision, eventSequence: snapshot.eventSequence }); if (value === selected.definition) { setDefinitionBase(null); setDefinitionConflict(null); } setDefinition(value); }} maxLength={4000} required /></label>{(definitionConflict || definitionStale) && <div role="alert" className="studio-conflict"><p>{definitionConflict ? 'This definition changed in another client while you were editing.' : 'The workspace changed while you were editing this definition.'}</p><p>Previous: {definitionBase?.original ?? definitionConflict?.before ?? selected.definition}</p><p>Latest: {entityInfo?.name === selected.name ? entityInfo.definition : selected.definition}</p><p>Your text: {definition}</p><p>Your text is retained above. Review the latest definition before choosing what to do.</p><button type="button" disabled={!entityInfo || entityInfo.name !== selected.name || entityRevision !== snapshot.revision || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={() => reviewDefinition(false)}>Use latest definition</button><button type="button" disabled={!entityInfo || entityInfo.name !== selected.name || entityRevision !== snapshot.revision || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={() => reviewDefinition(true)}>Keep my text</button></div>}<button disabled={commandPending || !definitionBase || definitionStale || Boolean(definitionConflict) || entityRevision !== snapshot.revision || entityInfo?.name !== selected.name || definition === selected.definition || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Save definition</button><button type="button" onClick={() => { setDefinition(selected.definition); setDefinitionBase(null); setDefinitionConflict(null); }}>Cancel</button></fieldset></form><p>Parent: {selected.parent} {selected.parent && !['root', '-'].includes(selected.parent) && <button type="button" onClick={() => selectPerspectiveConcept(selected.parent, { focusView: false })}>Inspect parent {selected.parent}</button>}</p>{(!entityInfo || entityInfo.name !== selected.name) && <p role="status">Loading {selected.name} details?</p>}{entityInfo?.name === selected.name && <><InspectorIdentifier key={selected.name} iri={entityInfo.iri} /><p>Source: {entityInfo.source.path}:{entityInfo.source.line}</p><h4>Fields</h4><InspectorFields key={selected.name} fields={entityInfo.fields} focusField={issueFieldTarget?.owner === selected.name && issueFieldTarget.revision === snapshot.revision && entityInfo.name === selected.name && entityRevision === snapshot.revision ? issueFieldTarget.property : null} onFieldFocused={found => { if (!found) setError("The mapped fixture field is not available in the current concept."); setIssueFieldTarget(null); }} commandPending={commandPending} narrowing={Boolean(valueConstraint)} editingField={Boolean(fieldEdit)} requiring={Boolean(requiredDraft)} editingLocked={Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onNarrowValues={startValueConstraint} onInspectOwner={name => selectPerspectiveConcept(name, { focusView: false })} onEdit={startFieldEdit} onRequire={startRequiredReview} /></>}{requiredDraft && selected && <RequireRelationshipReview draft={requiredDraft} pending={commandPending} stale={requiredDraftStale} ready={requiredDraftReady} onApply={applyRequiredReview} onCancel={cancelRequiredReview} />}{valueConstraint && selected && <AllowedValuesEditor draft={valueConstraint} onChange={values => setValueConstraint(current => current && ({ ...current, values }))} onCancel={cancelValueConstraint} onApply={applyValueConstraint} onReview={reviewValueConstraint} latest={currentValueField?.values ? { values: currentValueField.values, cardinality: currentValueField.cardinality } : null} latestReady={valueReviewReady} pending={commandPending} stale={!entityInfo || entityRevision !== snapshot.revision || entityInfo.name !== valueConstraint.owner || valueConstraint.workspaceId !== connection.workspaceId || valueConstraint.revision !== snapshot.revision || valueConstraint.changeSetId !== (snapshot.changeSet?.id ?? null) || valueConstraint.changeSetUpdatedAt !== (snapshot.changeSet?.updatedAt ?? null) || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} />}{fieldEdit && selected && <section className="studio-activity"><h2>Edit field contract</h2><p>Changing a range or tightening cardinality can break existing data and consumers. Review affected requirements and rerun checks.</p><p>Current contract: {fieldEdit.name}: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}).</p><form onSubmit={updateField}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>New datatype or target class <input list="studio-field-type-suggestions" ref={fieldEditInput} onFocus={() => setRangeSource('edit')} value={fieldEdit.range} onChange={event => setFieldEdit({ ...fieldEdit, range: event.target.value })} required /></label>{rangeSearchError && <p role="status">{rangeSearchError}</p>}<label>New cardinality <select value={fieldEdit.cardinality} onChange={event => setFieldEdit({ ...fieldEdit, cardinality: event.target.value })}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label>{(fieldEditConflict || fieldEditStale) && <div role="alert" className="studio-conflict"><p>{fieldEditConflict ? 'This field changed in another client.' : 'Workspace activity changed while this field was being edited.'} Your input is retained. Review the latest contract before continuing.</p><p>Previous: {fieldEdit.expectedRange} ({fieldEdit.expectedCardinality}). Current: {currentField ? currentFieldRange + ' (' + currentField.cardinality + ')' : 'field unavailable'}. Entered: {fieldEdit.range} ({fieldEdit.cardinality}).</p><button type="button" disabled={commandPending || !currentField || !entityInfo || entityRevision !== snapshot.revision || entityInfo.name !== selected?.name || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={reviewLatestField}>Reviewed latest, keep my field input</button></div>}<button disabled={commandPending || !entityInfo || fieldEditConflict || fieldEditStale || entityRevision !== snapshot.revision || entityInfo?.name !== selected?.name || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Update field contract</button><button type="button" onClick={cancelFieldEdit}>Cancel field edit</button></fieldset></form></section>}<details id="studio-add-field" onToggle={event => { const open = event.currentTarget.open; setFieldFormOpen(open); if (open) beginFieldDraft(); }}><summary>Add a field or relationship</summary><form onSubmit={addField}><fieldset className="studio-command-fields" disabled={commandPending}><legend className="sr-only">Model change</legend><label>Field name <input value={field.name} onChange={e => { beginFieldDraft(); setField({ ...field, name: e.target.value }); }} required /></label><p>Use a datatype, class name, or controlled values such as &#123;Draft,Confirmed,Cancelled&#125;. Suggestions include known datatypes, loaded concepts and up to 25 live search matches; other class names can be entered.</p>{rangeSearchError && <p role="status">{rangeSearchError}</p>}<label>Datatype or target class <input list="studio-field-type-suggestions" onFocus={() => setRangeSource('add')} value={field.range} onChange={e => { beginFieldDraft(); setField({ ...field, range: e.target.value }); }} required /></label><ControlledValuesBuilder range={field.range} candidate={fieldValueCandidate} onRangeChange={range => { beginFieldDraft(); setField(current => ({ ...current, range })); }} onCandidateChange={value => { beginFieldDraft(); setFieldValueCandidate(value); }} /><label>Cardinality <select value={field.cardinality} onChange={e => { beginFieldDraft(); setField({ ...field, cardinality: e.target.value }); }}><option value="?">Optional, at most one</option><option value="!">Exactly one</option><option value="*">Zero or more</option><option value="+">One or more</option></select></label><button disabled={commandPending || !validFieldRangeDraft(field.range, fieldValueCandidate) || !fieldDraftBase || fieldDraftStale || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Add field</button>{fieldDraftStale && <div role="alert"><p>The workspace changed since this field draft was opened. Your input is retained. Review the latest concept and field name before continuing.</p><p>Draft: {field.name || '(unnamed)'} ? {field.range} ? {cardinalityLabels[field.cardinality]}.</p><button type="button" disabled={commandPending || !entityInfo || entityInfo.name !== selected.name || entityRevision !== snapshot.revision || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={() => setFieldDraftBase(currentFieldDraftBase())}>Reviewed latest, continue field draft</button></div>}</fieldset></form></details><details><summary>Referenced by</summary><p>Direct declared relationships and direct subclasses only; this is not a complete impact analysis.</p><button type="button" onClick={() => inspectIncoming()}>Find references</button>{incoming && <><p>Showing {incoming.results.length} of {incoming.total} references.</p><ul>{incoming.results.map((item, index) => <li key={item.source + '-' + item.predicate + '-' + index}><strong>{item.source}</strong> Â· {item.predicate}{item.cardinality ? ' (' + item.cardinality + ')' : ''} <button type="button" onClick={() => selectPerspectiveConcept(item.source)}>Inspect {item.source}</button></li>)}</ul>{incoming.nextOffset !== null && <button type="button" onClick={() => inspectIncoming(incoming.nextOffset)}>Load more references</button>}</>}</details><SourcePreview key={`source-${selected.name}`} connection={connection} snapshot={snapshot} name={selected.name} available={availableTools.includes("ontology_source_excerpt")} /><ContextHandoff key={connection.workspaceId + selected.name} snapshot={snapshot} entity={entityInfo?.name === selected.name ? entityInfo : null} entityRevision={entityRevision} job={job} connection={connection} availableTools={availableTools} /></> : <div className="studio-inspector-empty"><p>Select a concept to inspect its definition, fields and references.</p>{graph && <p>Current view: <strong>{graph.root}</strong> / {graph.nodes.length} concepts / {graph.edges.length} relationships shown.</p>}<button type="button" onClick={focusModelSearch}>Find a concept</button>{graph && <button type="button" onClick={() => openCompactPane('studio-editor-pane')}>Focus diagram</button>}</div>}</section>
    </div>
    <div className="studio-compact-results" hidden={isCompact && compactSurface !== 'results'}><WorkspaceDock panel={dockPanel} onPanelChange={setDockPanel} height={dockHeight} heightLimit={dockLimit} onHeightChange={setDockHeight} disabled={!online} job={job} snapshot={snapshot} history={history} historyDetail={historyDetail} historyPending={historyPending} onInspectRevision={inspectHistory} onCloseHistory={closeHistory} onRetry={runChecks} onFocusConcept={selectPerspectiveConcept} onFocusIssue={inspectIssueField} onDownloadEvidence={downloadEvidence} onShowChecks={showValidation} activityConcept={eventConcept} />
    <details open={studioUtility === 'context'} onToggle={event => { if (!event.currentTarget.open && studioUtility === 'context') setStudioUtility(null); }} className="studio-workspace-details studio-context-tools"><summary>Draft context and history</summary><section className="studio-activity"><h2>Change set</h2>{snapshot.changeSet ? <><p>{snapshot.changeSet.intent} Â· {snapshot.changeSet.status} Â· <code>{snapshot.changeSet.id}</code></p><p>Requirement references: {snapshot.changeSet.requirements.join(', ') || 'none'}.</p>{['accepted', 'rejected'].includes(snapshot.changeSet.status) && <><p>Editing is locked until a reviewer reopens this change set. Reopening invalidates its acceptance.</p><button type="button" disabled={!availableTools.includes('ontology_changeset_reopen')} onClick={reopenChangeSet}>Reopen change set</button>{!availableTools.includes('ontology_changeset_reopen') && <p>Reopening a reviewed change set requires reviewer access.</p>}</>}{snapshot.changeSet.status === 'published' && <p>This change set was pushed. Start a new workspace from the reviewed target before another proposal.</p>}</> : <><p>Opening a change set records intent for the whole current draft, including any edits already made.</p><form onSubmit={openChangeSet}><label>Change-set intent <input value={changeSetIntent} onChange={event => setChangeSetIntent(event.target.value)} maxLength={1000} required /></label><label>Requirement IDs (comma separated, optional) <input value={changeSetRequirements} onChange={event => setChangeSetRequirements(event.target.value)} /></label><button>Open change set</button></form></>}</section>
    <PerspectivePanels temporalDirty={Boolean(temporalBaseline && temporalBaseline.root === selected?.name && temporalPolicy !== (temporalBaseline.policy ?? 'snapshot-versioned'))} discardTemporal={() => { setTemporalPolicy(temporalBaseline?.policy ?? 'snapshot-versioned'); setError(''); }} binding={binding} setBinding={updateBinding} bindingDirty={bindingDirty} bindingDraftStale={bindingDraftStale} bindingBeforeField={bindingBeforeField} bindingCurrentField={bindingCurrentField} bindingCurrentMapping={bindingCurrentMapping} bindingReviewReady={bindingReviewReady} reviewBinding={reviewBinding} commandPending={commandPending} selected={selected} snapshot={snapshot} entityInfo={entityInfo} responsibility={responsibility} temporal={temporal} temporalPolicy={temporalPolicy} setTemporalPolicy={value => { temporalRequest.current += 1; setTemporalPolicy(value); }} inspectResponsibility={inspectResponsibility} inspectTemporal={inspectTemporal} saveTemporalPolicy={saveTemporalPolicy} selectConcept={selectPerspectiveConcept} addRelationship={openRelationshipAuthoring} addBinding={applyBinding} />
    <section className="studio-activity"><h2>Requirement links</h2>{snapshot.digestVersion === 4 ? <><p>Linking a concept records a relationship in the requirement register; it does not prove coverage or acceptance.</p><form onSubmit={searchRequirements}><label>Search requirements <input value={requirementQuery} onChange={event => setRequirementQuery(event.target.value)} /></label><button>Search requirements</button></form><ul>{requirements.map(item => <li key={item.id}><strong>{item.id}</strong>: {item.statement} <button type="button" disabled={!selected || item.classes.includes(selected.name) || Boolean(intervalBase && intervalBase.item.id === item.id && intervalDraftStale)} onClick={() => linkRequirement(item)}>Link selected concept</button>{selected && item.classes.includes(selected.name) && ['model/audit-rules.json', 'model/authoring-example-overrides.json', 'tests/business-acceptance.json', 'tests/negative-cases.json'].every(path => snapshot.editableSources?.includes(path)) && <details onToggle={event => { if (event.currentTarget.open && !beginIntervalDraft(item)) event.currentTarget.open = false; }}><summary>Add interval rule for {item.id}</summary><p>Only a new class with two new, declared date-time fields is supported. The generated cases are draft examples and require independent review.</p><form onSubmit={event => addIntervalRule(event, item)}><fieldset className="studio-command-fields" disabled={commandPending || intervalReviewPending}><legend className="sr-only">Interval rule change</legend><label>Interval start <select value={intervalRule.startProperty} onChange={event => { if (beginIntervalDraft(item)) setIntervalRule({ ...intervalRule, startProperty: event.target.value }); }} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>Interval end <select value={intervalRule.endProperty} onChange={event => { if (beginIntervalDraft(item)) setIntervalRule({ ...intervalRule, endProperty: event.target.value }); }} required><option value="">Choose a field</option>{entityInfo?.fields.filter(field => !field.inherited && field.range === 'dateTime' && ['!', '?'].includes(field.cardinality)).map(field => <option key={field.property} value={field.property}>{field.property}</option>)}</select></label><label>New rule ID <input value={intervalRule.ruleId} onChange={event => { if (beginIntervalDraft(item)) setIntervalRule({ ...intervalRule, ruleId: event.target.value }); }} pattern="B[0-9]{3,6}" required /></label><button disabled={!intervalBase || intervalDraftStale || entityRevision !== snapshot.revision || entityInfo?.name !== selected?.name || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Add interval constraint</button><button type="button" onClick={cancelIntervalDraft}>Cancel interval draft</button>{intervalDraftStale && intervalBase?.item.id === item.id && <div role="alert"><p>The workspace changed since this interval draft began. Your input is retained; inspect the current requirement and review the field contracts before continuing.</p><p>Draft: {intervalRule.startProperty || '(start not selected)'} to {intervalRule.endProperty || '(end not selected)'}; rule {intervalRule.ruleId || '(not entered)'}; requirement {intervalBase.item.id}.</p><p>Previous requirement: {intervalBase.item.statement} Rules: {intervalBase.item.rules.join(', ') || 'none'}.</p><button type="button" disabled={intervalReviewPending || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')} onClick={inspectLatestIntervalRequirement}>Inspect latest interval requirement</button>{intervalReviewPending && <p role="status">Loading current requirement?</p>}{intervalReviewError && <p role="status">{intervalReviewError}</p>}{intervalLatest && <><p>Current requirement: {intervalLatest.item.statement} Rules: {intervalLatest.item.rules.join(', ') || 'none'}.</p><p>Current start: {intervalReviewFields.find(field => field.property === intervalRule.startProperty) ? intervalRule.startProperty + ' (' + intervalReviewFields.find(field => field.property === intervalRule.startProperty).cardinality + ')' : 'not available as a declared date-time field'}. Current end: {intervalReviewFields.find(field => field.property === intervalRule.endProperty) ? intervalRule.endProperty + ' (' + intervalReviewFields.find(field => field.property === intervalRule.endProperty).cardinality + ')' : 'not available as a declared date-time field'}.</p><button type="button" disabled={!intervalReviewReady} onClick={useReviewedIntervalRequirement}>Reviewed latest, keep interval input</button></>}</div>}</fieldset></form></details>}</li>)}</ul></> : <p>Create a version-four workspace to edit requirement links.</p>}</section>
    {job?.artifactSummary && !['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) && <section className="studio-activity"><h2>Generated artifact comparison</h2><p>Revision {job.revision} Â· {job.artifactSummary.changedCount} files differ in exact bytes{job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' Â· stale' : ''}.</p><p>{job.artifactSummary.note}</p><p>Baseline manifest: <code>{job.artifactSummary.baselineManifestSha256}</code>; candidate manifest: <code>{job.artifactSummary.candidateManifestSha256}</code>.</p>{job.artifactSummary.changes.length > 0 && <ul>{job.artifactSummary.changes.map(item => <li key={item.path}>{item.kind}: {item.path}</li>)}</ul>}{job.artifactSummary.omitted > 0 && <p>{job.artifactSummary.omitted} additional changes omitted.</p>}</section>}
    <section className="studio-activity"><h2>Suggested views</h2><p>Suggestions never change the model. Follow new changes and suggestions to select their concepts automatically; your interaction pauses following.</p><label><input type="checkbox" checked={followSuggestions} onChange={event => setFollowing(event.target.checked)} /> Follow new changes and suggestions</label>{followSuggestions && <p aria-live="polite">{followPaused ? 'Following paused after interaction.' : 'Following new changes and suggestions.'}</p>}{followSuggestions && followPaused && <button type="button" onClick={resumeFollowing}>Resume following</button>}<ul>{history.filter(event => event.payload.type === 'view_suggestion').slice(-10).reverse().map(event => <li key={event.sequence}><strong>{event.payload.root}</strong> Â· {event.payload.viewpoint} Â· {event.actor} Â· revision {event.revision}<p>{event.payload.explanation}</p><button type="button" disabled={event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest} onClick={() => { pauseFollowing(); focusSuggestion(event); }}>Focus {event.payload.root}</button>{(event.revision !== snapshot.revision || event.payload.sourceDigest !== snapshot.sourceDigest) && <small> Suggestion refers to an older draft.</small>}</li>)}</ul></section>
    <section className="studio-activity"><h2 id="studio-activity-heading" tabIndex={-1}>Activity</h2>{latestChange && <p>Latest change: {latestChange.actor} updated {eventConcept(latestChange)} at revision {latestChange.revision}. <button type="button" onClick={() => selectPerspectiveConcept(eventConcept(latestChange))}>Show latest change</button></p>}<button type="button" onClick={() => setUndoCandidate({ workspaceId: connection.workspaceId, revision: undoEvent.revision, actor: undoEvent.actor, commands: undoEvent.payload.commands.map(command => [command.type, command.owner ?? command.className ?? command.name].filter(Boolean).join(' ')) })} disabled={commandPending || !undoEvent || Boolean(snapshot.changeSet && snapshot.changeSet.status !== 'draft')}>Undo latest command group</button>{undoCandidate && <section aria-label="Confirm undo" className="studio-undo-confirmation"><h3>Undo revision {undoCandidate.revision}?</h3><p>This reverses {undoCandidate.actor}'s command group: {undoCandidate.commands.join(', ')}. The reversal creates a new revision.</p>{(undoCandidate.revision !== snapshot.revision || undoCandidate.workspaceId !== connection.workspaceId) && <p role="status">The draft changed. Cancel and review the latest revision before undoing.</p>}<button type="button" disabled={commandPending || undoCandidate.revision !== snapshot.revision || undoCandidate.workspaceId !== connection.workspaceId} onClick={() => undoLatest(undoCandidate)}>Confirm undo revision {undoCandidate.revision}</button><button type="button" onClick={() => setUndoCandidate(null)}>Cancel undo</button></section>}<ol>{history.map(event => <li key={event.sequence}>Revision {event.revision} Â· {event.actor} Â· {event.createdAt ?? 'time not recorded'} Â· {event.payload.type === 'undo' ? `undid revision ${event.payload.targetRevision}` : event.payload.type === 'review' ? event.payload.decision : event.payload.type === 'publication' ? `publication ${event.payload.state}` : event.payload.type === 'view_suggestion' ? 'suggested ' + event.payload.root : event.payload.type === 'changeset_opened' ? 'opened change set: ' + event.payload.intent : event.payload.type === 'changeset_reopened' ? 'reopened change set' : (event.payload.commands || []).map(command => command.type).join(', ')}{event.payload.rationale && <p>Reason: {event.payload.rationale}</p>}{event.payload.commands?.length > 0 && <button type="button" onClick={() => inspectHistory(event.revision)}>Inspect revision {event.revision}</button>}</li>)}</ol>{historyDetail && <section aria-label="Historical comparison"><h3>Historical revision {historyDetail.revision}</h3><p>Read-only comparison; the current draft is unchanged.</p>{historyDetail.available ? <><p>Actor: {historyDetail.actor}; source digest: <code>{historyDetail.sourceDigest}</code>.</p>{historyDetail.commandGroupId && <p>Command group: <code>{historyDetail.commandGroupId}</code>; operation: <code>{historyDetail.operationId}</code>.</p>}{historyDetail.rationale && <p>Reason: {historyDetail.rationale}</p>}<details open><summary>Command group patch</summary><pre>{historyDetail.patch}</pre></details><details><summary>Compare historical revision with baseline</summary><pre>{historyDetail.baselinePatch}</pre></details>{historyDetail.additionalSources.map(source => <details key={source.path}><summary>Historical source patch: {source.path}</summary><pre>{source.patch}</pre></details>)}</> : <p>{historyDetail.reason}</p>}<button type="button" onClick={closeHistory}>Return to current draft</button></section>}</section></details></div></fieldset>}
    <details open={studioUtility === 'connection'} onToggle={event => { if (!event.currentTarget.open && studioUtility === 'connection') setStudioUtility(null); }} className="studio-workspace-details studio-connection-tools"><summary>Connection and diagnostics</summary><section className="studio-connection-settings" aria-label="Connection settings">
    {connection && <><p>Workspace ID: <code>{connection.workspaceId}</code> <button type="button" onClick={() => copyConnectionValue(connection.workspaceId, 'Workspace ID')}>Copy workspace ID</button></p><details><summary>Connect an MCP client</summary><p>Use this local endpoint and workspace ID with the separately configured draft token. The token is not included below.</p><pre>{`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`}</pre><button type="button" onClick={() => copyConnectionValue(`MCP endpoint: ${connection.endpoint}/mcp\nWorkspace ID: ${connection.workspaceId}\nAuthorization: Bearer <your draft token>`, 'Connection details')}>Copy connection details</button></details>{connectionCopyMessage && <p aria-live="polite">{connectionCopyMessage}</p>}</>}
    <details><summary>Connection diagnostics</summary><p>Connection: {status}; event stream: {online ? 'live' : 'not live'}.</p><p>Server: {serverInfo ? `${serverInfo.name} ${serverInfo.version}` : 'not initialized'}; negotiated MCP protocol: {serverInfo?.protocolVersion ?? 'unknown'}.</p><p>Workspace: {connection?.workspaceId ?? 'none'}; revision: {snapshot?.revision ?? 'unknown'}; last event cursor: {cursor.current}.</p><p>Latest job: {job ? `${job.profile}, ${job.status}, revision ${job.revision}` : 'none'}.</p><button type="button" onClick={copyDiagnostics}>Copy redacted diagnostics</button>{diagnosticMessage && <p aria-live="polite">{diagnosticMessage}</p>}<p>Reconnect by opening the local studio and pairing again. Diagnostics exclude credentials and check output.</p></details>
    </section></details>
    {snapshot && <section className="studio-status-bar" aria-label="Workspace status">
      <span>{online ? 'Connected' : status}</span>
      <span>Revision {snapshot.revision}</span>
      {viewDirty && <span>View changed locally</span>}
      <span>{selected ? `Selected: ${selected.name}` : 'No concept selected'}</span>
      <a href="#studio-validation-heading" onClick={showValidation}>{!job || ['publication-preview', 'publication-commit', 'publication-push', 'publication-pr'].includes(job.profile) ? 'Checks: no result displayed' : `Check: ${job.status}${job.revision !== snapshot.revision || job.digest !== snapshot.sourceDigest ? ' (out of date)' : ''}`}</a>
    </section>}
  </main>;
}

