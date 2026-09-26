import React, { useState } from "react";
import { model } from "./model-utils";
import { selectFixture } from "./temporal-utils";

const day = value => value ? value.slice(0, 10) : "open";
const interval = (a, b) => `${day(a)} ≤ time < ${day(b)}`;
export default function TemporalFixture() {
  const example = model.temporalExample;
  const [validAt, setValidAt] = useState("2026-05-02");
  const [knownAt, setKnownAt] = useState("2026-05-02");
  const result = selectFixture(example, validAt, knownAt);
  const { commit, slice } = result;
  return <div className="inspector-section temporal-lab">
    <span className="explorer-chip">Executable reference fixture · synthetic tariff</span>
    <h3>Two questions. Two times.</h3>
    <p className="inspector-copy">Inspect a tariff's original price, corrections and withdrawal. These are committed example graphs, independent of the selected class.</p>
    <label>Effective on<input type="date" value={validAt} onChange={e => setValidAt(e.target.value)} /></label>
    <label>Known on<input type="date" max={day(example.knownThrough)} value={knownAt} onChange={e => setKnownAt(e.target.value)} /></label>
    <div className="temporal-result" aria-live="polite">
      <span>{result.state === "Present" ? "Selected snapshot · energy rate" : result.state}</span>
      <strong>{result.price !== null ? <>€{Number(result.price).toFixed(2)}<small> / kWh</small></> : result.state === "Retracted" ? "Explicitly withdrawn" : "No example value"}</strong>
    </div>
    {commit && <div className="snapshot-evidence">
      <p><b>{commit.reason}</b></p>
      <p>Valid interval: {interval(slice.validFrom, slice.validUntil)}</p>
      <p>System interval: {interval(commit.recordedAt, commit.systemUntil)}</p>
      <p>{commit.validation}</p>
      <details><summary>Selected snapshot evidence</summary>
        <p>Commit #{commit.sequence}</p><code>{commit.id}</code>
        <p>Slice</p><code>{slice.id}</code>
        {slice.graph && <><p>Payload graph</p><code>{slice.graph}</code><p>Content digest</p><code>{slice.digest}</code></>}
        <p>Schema and writer contract</p><code>{example.schemaDigest}</code>
        <p>Scope</p><code>{example.scope}</code>
        {commit.watermarks.map(w => <p key={w.source + w.partition}>{w.source}, partition {w.partition}, offset {w.offset}; complete through {day(w.completeThrough)} UTC.</p>)}
      </details>
      {slice.triples.length > 0 && <details><summary>Selected payload triples ({slice.triples.length})</summary><pre>{slice.triples.join("\n")}</pre></details>}
    </div>}
    <details className="temporal-timeline"><summary>Business time × knowledge history</summary>
      <p className="inspector-hint">Choose a recorded version, then an effective interval. Interval ends are exclusive. All dates below are UTC.</p>
      <table><thead><tr><th>Known from</th><th>Effective intervals</th></tr></thead><tbody>
        {example.commits.map(c => <tr key={c.id} className={c.id === commit?.id ? "is-selected" : ""}>
          <th><button onClick={() => setKnownAt(day(c.recordedAt))}>{day(c.recordedAt)}</button></th>
          <td>{c.slices.map(s => <button key={s.id} aria-pressed={s.id === slice?.id} onClick={() => { setKnownAt(day(c.recordedAt)); setValidAt(day(s.validFrom)); }}>
            {day(s.validFrom).slice(5)}–{day(s.validUntil).slice(5)} · {s.price === null ? "withdrawn" : `€${Number(s.price).toFixed(2)}`}
          </button>)}</td>
        </tr>)}
      </tbody></table>
    </details>
    <details className="temporal-query"><summary>Reproduce with SPARQL</summary><pre>{example.query + "\n" + example.priceQuery}</pre></details>
    <p className="inspector-hint">The browser selects from this published fixture. CI compares {example.expectedCases.length} date pairs with standard SPARQL results from the reference writer. This page has no live endpoint. Knowledge is bounded by {day(example.knownThrough)} UTC.</p>
    <a className="inspector-link" href="https://github.com/pli-poc/charge-weave/blob/main/examples/temporal/tariff-history.trig" target="_blank" rel="noreferrer">Open the complete RDF history ↗</a>
  </div>;
}
