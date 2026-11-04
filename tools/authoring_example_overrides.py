"""Apply bounded, synthetic date-time values to generated all-class examples.

These values are fixture inputs, not business acceptance or production data.
"""
from datetime import datetime
import re

from rdflib import Literal, XSD


def apply_overrides(graph, catalog, overrides, namespace, node_for):
    if not isinstance(overrides, dict) or len(overrides) > 1000:
        raise ValueError('Invalid example overrides')
    chains = {}
    for cls in catalog:
        chain, current = [], cls
        while current is not None:
            if current in chain or current not in catalog:
                raise ValueError('Invalid example inheritance')
            chain.append(current)
            current = catalog[current]['parent']
        chains[cls] = chain
    assignments = {}
    total = 0
    for owner, fields in overrides.items():
        if owner not in catalog or not isinstance(fields, dict) or not fields or len(fields) > 100:
            raise ValueError('Invalid example override owner')
        for name, value in fields.items():
            total += 1
            if total > 1000:
                raise ValueError('Too many example overrides')
            if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9]*', name) or not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', value):
                raise ValueError('Invalid example override value')
            try:
                datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError as error:
                raise ValueError('Invalid example override date') from error
            owner_fields = [field for ancestor in chains[owner] for field in catalog[ancestor]['fields'] if field['property'] == name]
            if not owner_fields or any(field['range'] != 'dateTime' for field in owner_fields):
                raise ValueError('Example override requires a dateTime field')
            for cls, chain in chains.items():
                if owner not in chain or cls == 'Record':
                    continue
                inherited = [field for ancestor in chain for field in catalog[ancestor]['fields'] if field['property'] == name]
                if not inherited or any(field['range'] != 'dateTime' for field in inherited):
                    raise ValueError('Example override requires a dateTime field')
                key = (cls, name)
                if key in assignments and assignments[key] != value:
                    raise ValueError('Conflicting example overrides')
                assignments[key] = value
    for (cls, name), value in assignments.items():
        graph.set((node_for(cls), namespace[name], Literal(value, datatype=XSD.dateTime)))
