"""Deterministic payload/aggregate integrity and replayable calendar operations."""
from datetime import date, datetime, time, timedelta, timezone
from functools import lru_cache
from importlib import resources
import hashlib
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo
from rdflib import Graph, Namespace, RDF, URIRef, Literal, XSD
from decimal import Decimal, InvalidOperation
from rdflib.compare import to_canonical_graph

P = Path(__file__).resolve().parents[1]
C = Namespace('https://example.org/charge-domain#')
UTC = timezone.utc


def instant(value):
    if not isinstance(value, datetime) and not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})', str(value)):
        raise ValueError('Temporal instants require a timezone and at most microsecond precision')
    parsed = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError('Temporal instants require an explicit timezone')
    return parsed.astimezone(UTC)


def canonical_bytes(graph):
    # Pinned rdflib graph canonicalization; not a claim of W3C RDFC-1.0 compatibility.
    normalized = Graph()
    for subject, predicate, obj in graph:
        if isinstance(obj, Literal) and obj.datatype == XSD.decimal:
            try:
                number = Decimal(str(obj))
                if not number.is_finite():raise ValueError('Non-finite decimal')
                value = format(number, 'f') if number else '0'
                if '.' in value:value = value.rstrip('0').rstrip('.')
                obj = Literal(value if '.' in value else value+'.0', datatype=XSD.decimal, normalize=False)
            except InvalidOperation as exc:
                raise ValueError('Invalid decimal in canonical graph') from exc
        elif isinstance(obj, Literal) and obj.datatype is None and not obj.language:
            obj = Literal(str(obj), datatype=XSD.string)
        normalized.add((subject,predicate,obj))
    canonical = to_canonical_graph(normalized)
    return ('\n'.join(sorted(' '.join(term.n3() for term in triple) + ' .' for triple in canonical)) + '\n').encode()


def digest(graph):
    return 'sha256:' + hashlib.sha256(canonical_bytes(graph)).hexdigest()


@lru_cache(maxsize=1)
def policy():
    return json.loads((P / 'model/temporal-policy.json').read_text())


def aggregate_graph(graph, root):
    """Freeze scalar values and explicitly owned dependencies; other IRIs retain identity."""
    result, pending, seen = Graph(), [root], set()
    while pending:
        subject = pending.pop()
        if subject in seen:
            continue
        seen.add(subject)
        classes = [str(c).removeprefix(str(C)) for c in graph.objects(subject, RDF.type)]
        followed = {C[p] for cls in classes for p in policy()['ownedLinks'].get(cls, [])}
        ignored = {C[p] for cls in classes for p in policy()['mutableMetadata'].get(cls, [])}
        for s, p, o in graph.triples((subject, None, None)):
            if p == C.snapshotDigest or p in ignored:
                continue
            result.add((s, p, o))
            if p in followed:
                if not list(graph.predicate_objects(o)):
                    raise ValueError(f'Incomplete immutable aggregate dependency: {o}')
                pending.append(o)
    return result


def aggregate_digest(graph, root):
    return digest(aggregate_graph(graph, root))


def immutable_roots(graph):
    for cls, condition in policy()['immutableRoots'].items():
        for node in graph.subjects(RDF.type, C[cls]):
            if condition is None or any((node, C[condition['property']], C[v]) in graph for v in condition['states']):
                yield node


def stamp_digests(graph):
    """Fixture/writer utility only. Validation never silently rewrites a submitted digest."""
    from rdflib import Literal, XSD
    for node in list(graph.subjects(C.snapshotDigest, None)):
        graph.set((node, C.snapshotDigest, Literal(aggregate_digest(graph, node), datatype=XSD.string)))
    return graph


@lru_cache(maxsize=256)
def timezone_data(name):
    # Explicit package access avoids differing host tzdb versions and path traversal.
    if not name or any(part in ('', '.', '..') for part in name.split('/')) or name.startswith('/'):
        raise ValueError('Invalid IANA timezone key')
    path = resources.files('tzdata.zoneinfo').joinpath(*name.split('/'))
    try:
        with path.open('rb') as stream:
            return ZoneInfo.from_file(stream, key=name)
    except (OSError, ValueError) as exc:
        raise ValueError(f'Unknown timezone: {name}') from exc


def local_instant(local, timezone_name, fold_policy='earlier', gap_policy='reject'):
    """Resolve a local wall time by round-trip: folds are explicit, gaps never guessed."""
    if fold_policy not in ('earlier', 'later', 'reject') or gap_policy not in ('reject', 'skip'):
        raise ValueError('Unknown fold/gap policy')
    if local.tzinfo is not None:
        raise ValueError('Local recurring values must be timezone-naive')
    zone = timezone_data(timezone_name)
    candidates = sorted({local.replace(tzinfo=zone, fold=f).astimezone(UTC) for f in (0, 1)
                         if local.replace(tzinfo=zone, fold=f).astimezone(UTC).astimezone(zone).replace(tzinfo=None) == local})
    if not candidates:
        if gap_policy == 'skip':
            return None
        raise ValueError('Nonexistent local time in daylight-saving gap')
    if len(candidates) == 2 and fold_policy == 'reject':
        raise ValueError('Ambiguous local time in daylight-saving fold')
    return candidates[-1] if fold_policy == 'later' else candidates[0]


def expand_window(start_date, end_date, weekdays, local_start, local_end, timezone_name,
                  spans_midnight=False, fold_policy='earlier', gap_policy='reject', exclusions=()):
    """Inclusive local dates; resulting UTC intervals are half-open, with interval subtraction."""
    start_date, end_date = date.fromisoformat(str(start_date)), date.fromisoformat(str(end_date))
    if end_date < start_date or not set(weekdays) <= set(range(7)) or not weekdays:
        raise ValueError('Invalid recurrence date range or weekdays')
    start, end = time.fromisoformat(local_start), time.fromisoformat(local_end)
    if start.tzinfo or end.tzinfo or (not spans_midnight and end <= start) or (spans_midnight and end > start):
        raise ValueError('Local ordering disagrees with overnight flag')
    cuts = [(instant(a), instant(b)) for a, b in exclusions]
    if any(b <= a for a, b in cuts):
        raise ValueError('Invalid exclusion interval')
    rows, day = [], start_date
    while day <= end_date:
        if day.weekday() in weekdays:
            a = local_instant(datetime.combine(day, start), timezone_name, fold_policy, gap_policy)
            b = local_instant(datetime.combine(day + timedelta(days=int(spans_midnight)), end), timezone_name, fold_policy, gap_policy)
            if a is not None and b is not None:
                if b <= a:
                    raise ValueError('Resolved recurrence is not a positive interval')
                pieces = [(a, b)]
                for c, d in cuts:
                    pieces = [piece for x, y in pieces for piece in
                              ([(x, y)] if d <= x or c >= y else ([(x, c)] if x < c else []) + ([(d, y)] if d < y else []))]
                rows.extend(pieces)
        day += timedelta(days=1)
    return rows


def integrity_errors(graph):
    errors = []
    for node, claimed in graph.subject_objects(C.snapshotDigest):
        try:
            if str(claimed) != aggregate_digest(graph, node):
                errors.append((node, C.snapshotDigest, 'DigestIntegrity', 'Snapshot digest does not match immutable aggregate content.'))
        except ValueError as exc:
            errors.append((node, C.snapshotDigest, 'DigestIntegrity', str(exc)))
    for node, name in graph.subject_objects(C.timezoneName):
        try:
            timezone_data(str(name))
        except ValueError as exc:
            errors.append((node, C.timezoneName, 'CalendarIntegrity', str(exc)))
    return errors


def contract_digest():
    """Hash the semantic, validation and reference writer inputs, not only class names."""
    names = ['model/domain.schema','model/audit-rules.json','model/lifecycle-policies.json',
             'model/temporal-policy.json','model/temporal-queries.json','tools/build.py','tools/build_rules.py',
             'tools/temporal_integrity.py','tools/temporal_store.py','tools/runtime.py','requirements.txt']
    h = hashlib.sha256()
    for name in names:
        h.update(name.encode()+b'\0'+(P/name).read_bytes()+b'\0')
    return 'sha256:'+h.hexdigest()
