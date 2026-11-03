import React, { useEffect, useRef, useState } from 'react';

const cardinality = { '!': 'exactly one', '?': 'optional', '+': 'one or more', '*': 'zero or more' };

// Search is pinned to the current workspace revision and can include a concept's ancestors.
export default function FieldExplorer({ connection, snapshot, available, call, onInspect }) {
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0), controller = useRef(null);
  useEffect(() => {
    request.current += 1; controller.current?.abort(); setResult(null); setPending(false); setError('');
    return () => controller.current?.abort();
  }, [connection, snapshot.revision, snapshot.sourceDigest]);
  const current = result && result.workspaceId === snapshot.workspaceId && result.revision === snapshot.revision && result.sourceDigest === snapshot.sourceDigest && result.query === query && result.context === (context.trim() || null);
  async function search(event, offset = 0) {
    event?.preventDefault();
    const sequence = ++request.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setError('');
    if (!offset) setResult(null);
    try {
      const requestedContext = context.trim() || undefined;
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_field_search', arguments: { workspaceId: snapshot.workspaceId, expectedRevision: snapshot.revision, query, ...(requestedContext ? { context: requestedContext } : {}), offset, limit: 25 } }, abort.signal);
      const page = response.structuredContent;
      if (abort.signal.aborted || sequence !== request.current) return;
      if (page.workspaceId !== snapshot.workspaceId || page.revision !== snapshot.revision || page.sourceDigest !== snapshot.sourceDigest || page.query !== query || page.context !== (requestedContext ?? null) || page.offset !== offset || !Array.isArray(page.results)) throw new Error('Invalid field search response');
      setResult(previous => offset ? { ...page, results: [...(previous?.results || []), ...page.results] } : page);
    } catch (problem) { if (!abort.signal.aborted && sequence === request.current) setError(problem.message); }
    finally { if (!abort.signal.aborted && sequence === request.current) setPending(false); }
  }
  return <details><summary>Properties and relationships</summary>
    <p>Search declarations by name, owner or type. Optionally enter a concept to include fields from its recorded ancestors.</p>
    {!available ? <p>Field search is unavailable for this connection.</p> : <><form onSubmit={search}><label>Find properties or relationships <input value={query} maxLength={200} onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setResult(null); setError(''); setQuery(event.target.value); }} /></label><label>Concept context (optional) <input value={context} maxLength={128} pattern="[A-Za-z][A-Za-z0-9]*" onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setResult(null); setError(''); setContext(event.target.value); }} /></label><button disabled={pending}>Search fields</button></form>
      {pending && <p role="status">Searching fields…</p>}{error && <p role="alert">{error}</p>}
      {current && <><p>Showing {result.results.length} of {result.total} {result.context ? `fields for ${result.context}` : 'declared fields'}.</p><ul>{result.results.map(item => <li key={`${item.owner}.${item.name}`}><strong>{item.name}</strong> · {item.kind} · {item.inherited ? `inherited from ${item.owner}` : `declared by ${item.owner}`} · {item.range} ({cardinality[item.cardinality] ?? item.cardinality}) <button type="button" onClick={() => onInspect(item.owner)}>Inspect owner {item.owner}</button></li>)}</ul>{result.nextOffset !== null && <button type="button" disabled={pending} onClick={() => search(null, result.nextOffset)}>Load more fields</button>}</>}
    </>}
  </details>;
}
