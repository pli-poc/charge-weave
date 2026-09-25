"""IANA-zone constraints supplement portable SPARQL instant comparisons.

Use the pinned tzdata wheel, never the host's moving timezone database.
"""
from datetime import datetime, timezone
from importlib.resources import files
from zoneinfo import ZoneInfo


def time_resolution_error(local_text, utc_text, zone_name, policy):
    try:
        if not zone_name or any(part in ('', '.', '..') for part in zone_name.split('/')):
            return 'Invalid IANA timezone name'
        with files('tzdata.zoneinfo').joinpath(*zone_name.split('/')).open('rb') as stream:
            zone = ZoneInfo.from_file(stream, key=zone_name)
        local = datetime.fromisoformat(local_text.replace('Z', '+00:00'))
        resolved = datetime.fromisoformat(utc_text.replace('Z', '+00:00'))
        if local.utcoffset() is None or resolved.utcoffset() is None:
            return 'Both pricing timestamps require explicit offsets'
        if resolved.utcoffset().total_seconds() != 0 or local != resolved:
            return 'Resolved UTC timestamp must identify the same instant'
        wall = local.replace(tzinfo=None)
        candidates = set()
        for fold in (0, 1):
            candidate = wall.replace(tzinfo=zone, fold=fold).astimezone(timezone.utc)
            if candidate.astimezone(zone).replace(tzinfo=None) == wall:
                candidates.add(candidate)
        if not candidates:
            return 'Local pricing time does not exist in the declared timezone'
        instant = local.astimezone(timezone.utc)
        if instant not in candidates:
            return 'Source offset does not match the declared IANA timezone'
        ordered = sorted(candidates)
        expected = 'Unambiguous' if len(ordered) == 1 else ('First' if instant == ordered[0] else 'Second')
        if policy != expected:
            return 'Repeated-hour policy must identify the selected occurrence: ' + expected
    except (ValueError, OSError, KeyError, ModuleNotFoundError) as exc:
        return 'Invalid pricing time evidence: ' + str(exc)
    return None


def graph_errors(data, namespace):
    from rdflib import RDF
    c = namespace
    for node in data.subjects(RDF.type, c.PricingTimeResolution):
        values = [data.value(node, c[p]) for p in
                  ('sourceLocalTime', 'resolvedUtcTime', 'timezoneName', 'repeatedHourPolicy')]
        if any(value is None for value in values):
            continue  # Structural SHACL reports missing values.
        local, utc, zone, policy = map(str, values)
        error = time_resolution_error(local, utc, zone, policy.removeprefix(str(c)+'repeatedHourPolicy_'))
        if error:
            yield node, error
