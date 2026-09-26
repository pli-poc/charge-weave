"""Executable reference writer for immutable, bitemporal RDF validation scopes.

This is an in-process reference adapter with TriG export, not a deployed database
or authorization service. Callers authorize tenant/scope before constructing it.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
from threading import RLock
from rdflib import Dataset, Graph, Literal, Namespace, RDF, URIRef, XSD
from temporal_integrity import aggregate_digest, canonical_bytes, contract_digest, digest, immutable_roots, instant
from runtime import C, P, check


class TemporalError(ValueError):
    pass


@dataclass(frozen=True)
class Checkpoint:
    source: str
    partition: str
    offset: int
    complete_through: datetime
    observed_at: datetime
    complete: bool = True
    allowed_lateness_seconds: int = 0


@dataclass(frozen=True)
class Slice:
    start: datetime
    end: datetime | None
    graph: URIRef | None
    digest: str | None


@dataclass(frozen=True)
class Snapshot:
    commit: URIRef
    slice: URIRef
    valid_at: datetime
    known_at: datetime
    system_from: datetime
    system_until: datetime | None
    payload_digest: str | None
    graph: Graph | None
    state: str
    source_offsets: tuple
    schema_digest: str


@dataclass(frozen=True)
class StreamDecision:
    action: str
    reason: str


def classify_event(occurred_at, received_at, complete_through, allowed_lateness_seconds, replay_horizon_seconds, late_action='Correct'):
    occurred, received, complete = map(instant, (occurred_at, received_at, complete_through))
    if allowed_lateness_seconds < 0 or replay_horizon_seconds <= 0 or late_action not in ('Correct', 'Quarantine'):
        raise TemporalError('Invalid stream policy')
    if occurred > received:
        return StreamDecision('Quarantine', 'Clock assessment required before projecting future source time')
    if (received - occurred).total_seconds() > replay_horizon_seconds:
        return StreamDecision('Quarantine', 'Event lies beyond retained replay horizon; preserve original evidence')
    if occurred <= complete or (received - occurred).total_seconds() > allowed_lateness_seconds:
        return StreamDecision(late_action, 'Late event requires a correction commit or quarantine, never silent overwrite')
    return StreamDecision('Accept', 'Within admission window')


def interval_union_seconds(intervals):
    """Union prevents double counting overlapping downtime/usage populations."""
    ranges = sorted((instant(a), instant(b)) for a, b in intervals)
    if any(b <= a for a, b in ranges):
        raise TemporalError('Intervals must have positive duration')
    merged = []
    for a, b in ranges:
        if merged and a <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(b, merged[-1][1]))
        else:
            merged.append((a, b))
    return sum((b-a).total_seconds() for a, b in merged)


class TemporalStore:
    def __init__(self, tenant, scope, *, clock=None, validator=check, mapping_version='chargeweave-1.2.0'):
        self.tenant, self.scope = URIRef(tenant), URIRef(scope)
        if not all(re.match(r'^https?://', str(x)) for x in (self.tenant, self.scope)):
            raise TemporalError('Tenant and scope require absolute HTTP(S) IRIs')
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._validator, self.mapping_version = validator, mapping_version
        self.schema_digest = contract_digest()
        self._data = Dataset(default_union=False)
        self._head, self._time, self._sequence = None, None, 0
        self._slices, self._frozen, self._offsets, self._receipts = [], {}, {}, {}
        self._lock = RLock()

    @property
    def head(self):
        return self._head

    def _validate_payload(self, graph):
        if not isinstance(graph, Graph) or isinstance(graph, Dataset):
            raise TemporalError('Submit one explicit payload graph')
        if set(graph.objects(None, C.tenant)) != {self.tenant} or (self.tenant, RDF.type, C.Tenant) not in graph:
            raise TemporalError('Payload must be a complete scope for the authorized tenant')
        metadata = {C[x] for x in ('TemporalCommit', 'TemporalSlice', 'TemporalSnapshotSelection', 'ProjectionWatermark', 'TemporalStreamPolicy')}
        if any(t in metadata for t in graph.objects(None, RDF.type)):
            raise TemporalError('Payload cannot insert trusted history metadata')
        conforms, _, detail = self._validator(graph)
        if not conforms:
            raise TemporalError('Payload validation failed: ' + detail)
        frozen = dict(self._frozen)
        current_roots=set(immutable_roots(graph))
        for root in current_roots | {r for r in frozen if list(graph.predicate_objects(r))}:
            if root in frozen and root not in current_roots:
                raise TemporalError(f'Immutable aggregate cannot return to draft or change type: {root}')
            value = aggregate_digest(graph, root)
            if root in frozen and frozen[root] != value:
                raise TemporalError(f'Immutable aggregate changed under existing identity: {root}')
            frozen[root] = value
        return frozen

    def commit(self, graph, *, valid_from, valid_until=None, expected_head, checkpoints, reason, event_key=None):
        """Atomically replace a valid-time interval; None is an explicit retraction.

        The trusted clock supplies recording time. expected_head provides compare
        and swap. Every checkpoint partition remains present and cannot regress.
        """
        with self._lock:
            start = instant(valid_from)
            end = instant(valid_until) if valid_until is not None else None
            if end is not None and end <= start:
                raise TemporalError('Empty or reversed valid-time interval')
            if not str(reason).strip() or not checkpoints:
                raise TemporalError('Commit requires reason and complete source checkpoints')
            if graph is None and self._head is None:
                raise TemporalError('Initial commit requires a payload establishing tenant context')
            if graph is not None and (not isinstance(graph, Graph) or isinstance(graph, Dataset)):
                raise TemporalError('Submit one explicit payload graph')
            payload = graph + Graph() if graph is not None else None
            content_hash = digest(payload) if payload is not None else None
            cp_rows = []
            for cp in checkpoints:
                if not cp.source or not cp.partition or isinstance(cp.offset, bool) or not isinstance(cp.offset, int) or cp.offset < 0 or cp.allowed_lateness_seconds < 0 or not cp.complete:
                    raise TemporalError('Invalid/incomplete source checkpoint')
                through, observed = instant(cp.complete_through), instant(cp.observed_at)
                if through > observed:
                    raise TemporalError('Completeness exceeds observed watermark')
                cp_rows.append((cp.source, cp.partition, cp.offset, through, observed, cp.allowed_lateness_seconds))
            if len({x[:2] for x in cp_rows}) != len(cp_rows):
                raise TemporalError('Duplicate source partitions')
            cp_rows.sort()
            request_hash = sha256(json.dumps([content_hash, start.isoformat(), end.isoformat() if end else None,
                                             [[str(v) for v in x] for x in cp_rows], reason], sort_keys=True).encode()).hexdigest()
            if event_key is not None and event_key in self._receipts:
                old_hash, old_commit = self._receipts[event_key]
                if old_hash != request_hash:
                    raise TemporalError('Conflicting duplicate event')
                return old_commit
            if expected_head != self._head:
                raise TemporalError('Stale expected head')
            now = instant(self._clock())
            if self._time is not None and now <= self._time:
                raise TemporalError('Recording time must increase; equal-instant writes require retry')
            offsets = {x[:2]: x[2:] for x in cp_rows}
            if not set(self._offsets) <= set(offsets):
                raise TemporalError('Source checkpoint set cannot lose partitions')
            for key, (offset, through, observed, lateness) in offsets.items():
                if observed > now:
                    raise TemporalError('Source watermark cannot be from the future')
                if key in self._offsets and (offset < self._offsets[key][0] or through < self._offsets[key][1]):
                    raise TemporalError('Source checkpoint regression')
            if payload is not None and any(instant(t)>now for p in (C.createdAt,C.receivedAt) for t in payload.objects(None,p)):
                raise TemporalError('Payload contains records not yet known at recording time')
            frozen = self._validate_payload(payload) if payload is not None else dict(self._frozen)
            graph_id = URIRef('urn:chargeweave:payload:' + content_hash.split(':')[1]) if payload is not None else None
            # All checks above precede any mutation; rejected writes leave history intact.
            pieces = []
            for old in self._slices:
                if (old.end is not None and old.end <= start) or (end is not None and old.start >= end):
                    pieces.append(old)
                else:
                    if old.start < start:
                        pieces.append(Slice(old.start, start, old.graph, old.digest))
                    if end is not None and (old.end is None or end < old.end):
                        pieces.append(Slice(end, old.end, old.graph, old.digest))
            pieces.append(Slice(start, end, graph_id, content_hash))
            pieces.sort(key=lambda s: s.start)
            coalesced = []
            for piece in pieces:
                if coalesced and coalesced[-1].end == piece.start and (coalesced[-1].graph, coalesced[-1].digest) == (piece.graph, piece.digest):
                    prior = coalesced.pop()
                    coalesced.append(Slice(prior.start, piece.end, piece.graph, piece.digest))
                else:
                    coalesced.append(piece)
            seq = self._sequence + 1
            key = sha256(json.dumps([str(self.tenant), str(self.scope), str(self._head), now.isoformat(), request_hash]).encode()).hexdigest()
            commit = URIRef('urn:chargeweave:commit:' + key)
            meta = Graph()
            def record(node, cls, label):
                for tr in [(node,RDF.type,C[cls]), (node,C.tenant,self.tenant), (node,C.canonicalId,Literal(label,datatype=XSD.string)),
                           (node,C.createdAt,Literal(now,datatype=XSD.dateTime)), (node,C.revision,Literal(1,datatype=XSD.positiveInteger))]:
                    meta.add(tr)
            record(commit,'TemporalCommit',key)
            for p,v in [(C.snapshotScope,self.scope),(C.recordedAt,Literal(now,datatype=XSD.dateTime)),(C.commitSequence,Literal(seq,datatype=XSD.positiveInteger)),
                        (C.schemaDigest,Literal(self.schema_digest,datatype=XSD.string)),(C.mappingVersion,Literal(self.mapping_version,datatype=XSD.string)),(C.commitReason,Literal(reason,datatype=XSD.string))]:
                meta.add((commit,p,v))
            if self._head:
                meta.add((commit,C.previousCommit,self._head))
            for i, piece in enumerate(coalesced):
                node = URIRef(str(commit)+':slice:'+str(i))
                record(node,'TemporalSlice',key+':slice:'+str(i))
                meta.add((commit,C.temporalSlice,node));meta.add((node,C.validFrom,Literal(piece.start,datatype=XSD.dateTime)))
                if piece.end:
                    meta.add((node,C.validUntil,Literal(piece.end,datatype=XSD.dateTime)))
                meta.add((node,C.sliceState,C.sliceState_Present if piece.graph else C.sliceState_Retracted))
                if piece.graph:
                    meta.add((node,C.payloadGraph,piece.graph));meta.add((node,C.contentDigest,Literal(piece.digest,datatype=XSD.string)))
            for i,(source,part,offset,through,observed,lateness) in enumerate(cp_rows):
                node=URIRef(str(commit)+':watermark:'+str(i));record(node,'ProjectionWatermark',key+':watermark:'+str(i))
                meta.add((commit,C.sourceWatermark,node))
                for p,v in [(C.sourceSystem,Literal(source)),(C.sourcePartition,Literal(part)),(C.sourceOffset,Literal(offset,datatype=XSD.nonNegativeInteger)),
                            (C.completeThrough,Literal(through,datatype=XSD.dateTime)),(C.watermarkAt,Literal(observed,datatype=XSD.dateTime)),
                            (C.maximumLatenessSeconds,Literal(lateness,datatype=XSD.nonNegativeInteger)),(C.watermarkState,C.watermarkState_Complete)]:
                    meta.add((node,p,v))
            if payload is not None:
                for triple in payload:
                    self._data.graph(graph_id).add(triple)
                if self._head is None:
                    for triple in payload.triples((self.tenant,None,None)):
                        meta.add(triple)
            for triple in meta:
                self._data.default_context.add(triple)
            self._slices,self._frozen,self._offsets=coalesced,frozen,offsets
            self._head,self._time,self._sequence=commit,now,seq
            if event_key is not None:
                self._receipts[event_key]=(request_hash,commit)
            return commit

    def select(self, valid_at, known_at, *, required_offsets=None, complete_through=None):
        with self._lock:
            valid,known=instant(valid_at),instant(known_at)
            if known>instant(self._clock()):
                raise TemporalError('Known-time query cannot request knowledge from the future')
            query=(P/'queries/temporal/select-snapshot.rq').read_text()
            rows=list(self._data.query(query,initBindings={'tenant':self.tenant,'scope':self.scope,
                       'validAt':Literal(valid,datatype=XSD.dateTime),'knownAt':Literal(known,datatype=XSD.dateTime)}))
            if not rows:
                return None
            if len(rows)!=1:
                raise TemporalError('Ambiguous snapshot selection')
            row=rows[0].asdict();commit=row['commit'];node=row['slice']
            if str(row['schemaDigest'])!=self.schema_digest:
                raise TemporalError('Schema version requires its original validation adapter')
            meta=self._data.default_context
            cp=[]
            for w in meta.objects(commit,C.sourceWatermark):
                cp.append((str(meta.value(w,C.sourceSystem)),str(meta.value(w,C.sourcePartition)),int(meta.value(w,C.sourceOffset)),instant(meta.value(w,C.completeThrough))))
            for key,offset in (required_offsets or {}).items():
                if not any((a,b)==key and c>=offset for a,b,c,_ in cp):
                    raise TemporalError('Selected projection has not reached required source offset')
            if complete_through is not None and any(t<instant(complete_through) for *_,t in cp):
                raise TemporalError('Selected projection is not complete through the requested cutoff')
            graph=self._data.graph(row['graph'])+Graph() if row.get('graph') else None
            payload_digest=str(row['digest']) if row.get('digest') else None
            if graph is not None and digest(graph)!=payload_digest:
                raise TemporalError('Stored payload digest mismatch')
            return Snapshot(commit,node,valid,known,instant(row['systemFrom']),instant(row['systemUntil']) if row.get('systemUntil') else None,
                            payload_digest,graph,'Present' if graph is not None else 'Retracted',tuple(sorted(cp)),str(row['schemaDigest']))

    def query(self, query, valid_at, known_at, *, bindings=None, **consistency):
        # No network federation, external FROM clauses or caller-controlled history graph joins.
        local_query='\n'.join(line for line in query.splitlines() if not line.lstrip().startswith('#'))
        if re.search(r'\b(SERVICE|FROM|GRAPH|LOAD|INSERT|DELETE|CLEAR|CREATE|DROP|COPY|MOVE|ADD)\b',local_query,re.I):
            raise TemporalError('Queries must stay inside the selected snapshot graph')
        snapshot=self.select(valid_at,known_at,**consistency)
        if snapshot is None or snapshot.graph is None:
            return snapshot,[]
        bound={**(bindings or {}), 'validAt':Literal(snapshot.valid_at,datatype=XSD.dateTime),
               'knownAt':Literal(snapshot.known_at,datatype=XSD.dateTime)}
        return snapshot,list(snapshot.graph.query(query,initBindings=bound))

    def export_dataset(self):
        with self._lock:
            result=Dataset(default_union=False)
            for s,p,o,ctx in self._data.quads((None,None,None,None)):
                target=result.default_context if ctx==self._data.default_context.identifier else result.graph(ctx)
                target.add((s,p,o))
            return result

    def changes(self, valid_at, before, after):
        a,b=self.select(valid_at,before),self.select(valid_at,after)
        left=set(a.graph) if a and a.graph is not None else set()
        right=set(b.graph) if b and b.graph is not None else set()
        return {'removed':left-right,'added':right-left}
