import React, { useEffect, useRef, useState } from 'react';

const cardinality = { '!': 'exactly one', '?': 'optional', '+': 'one or more', '*': 'zero or more' };

// Search is scoped to declared fields and pinned to the current workspace revision.
export default function FieldExplorer({ connection, snapshot, available, call, onInspect }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0), controller = useRef(null);
  useEffect(() => {
    request.current += 1; controller.current?.abort(); setResult(null); setPending(false); setError('');
    return () => controller.current?.abort();
  }, [connection, snapshot.revision, snapshot.sourceDigest]);
  const current = result && result.workspaceId === snapshot.workspaceId && result.revision === snapshot.revision && result.sourceDigest === snapshot.sourceDigest && result.query === query;
  async function search(event, offset = 0) {
    event?.preventDefault();
    const sequence = ++request.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setError('');
    if (!offset) setResult(null);
    try {
      const response = await call(connection.endpoint, connection.token, 'tools/call', { name: 'ontology_field_search', arguments: { workspaceId: snapshot.workspaceId, expectedRevision: snapshot.revision, query, offset, limit: 25 } }, abort.signal);
      const page = response.structuredContent;
      if (abort.signal.aborted || sequence !== request.current) return;
      if (page.workspaceId !== snapshot.workspaceId || page.revision !== snapshot.revision || page.sourceDigest !== snapshot.sourceDigest || page.query !== query || page.offset !== offset || !Array.isArray(page.results)) throw new Error('Invalid field search response');
      setResult(previous => offset ? { ...page, results: [...(previous?.results || []), ...page.results] } : page);
    } catch (problem) { if (!abort.signal.aborted && sequence === request.current) setError(problem.message); }
    finally { if (!abort.signal.aborted && sequence === request.current) setPending(false); }
  }
  return <details><summary>Properties and relationships</summary>
    <p>Search declared fields by name, owner or type. Inherited appearances are not listed; open the declaring concept to inspect them.</p>
    {!available ? <p>Field search is unavailable for this connection.</p> : <><form onSubmit={search}><label>Find properties or relationships <input value={query} maxLength={200} onChange={event => { request.current += 1; controller.current?.abort(); setPending(false); setResult(null); setError(''); setQuery(event.target.value); }} /></label><button disabled={pending}>Search fields</button></form>
      {pending && <p role="status">Searching fields…</p>}{error && <p role="alert">{error}</p>}
      {current && <><p>Showing {result.results.length} of {result.total} declared fields.</p><ul>{result.results.map(item => <li key={`${item.owner}.${item.name}`}><strong>{item.name}</strong> · {item.kind} · {item.owner} · {item.range} ({cardinality[item.cardinality] ?? item.cardinality}) <button type="button" onClick={() => onInspect(item.owner)}>Inspect owner {item.owner}</button></li>)}</ul>{result.nextOffset !== null && <button type="button" disabled={pending} onClick={() => search(null, result.nextOffset)}>Load more fields</button>}</>}
    </>}
  </details>;
}
