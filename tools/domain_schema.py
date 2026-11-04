"""Parse the domain schema source used by the ontology generator.

The parser preserves the generator's existing field and property contracts.
It does not execute generation or modify the source file.
"""
from collections import defaultdict


def parse_schema(text, datatypes):
    classes = {}
    enum = defaultdict(set)
    prop_types = defaultdict(set)
    prop_users = defaultdict(set)
    descriptions = {}
    module = None
    for no, line in enumerate(text.splitlines(), 1):
        if line.startswith('# FIELD-DESCRIPTION|'):
            parts = line.split('|', 3)
            assert len(parts) == 4 and parts[1] and parts[2] and parts[3].strip() and len(parts[3]) <= 4000 and '|' not in parts[3], (no, line)
            key = (parts[1], parts[2])
            assert key not in descriptions, (no, key)
            descriptions[key] = parts[3]
            continue
        if not line or line.startswith('#'):
            continue
        if line.startswith('MODULE|'):
            module = line.split('|')[1]
            continue
        c, parent, definition, fields = line.split('|')
        assert c not in classes, c
        fs = []
        for token in fields.split():
            key, t = token.split(':', 1)
            card = t[-1]
            t = t[:-1]
            assert card in '!?+*', (no, token)
            vals = None
            if t.startswith('{'):
                vals = t[1:-1].split(',')
                enum[key].update(vals)
                typ, r = 'enum', key[0].upper() + key[1:] + 'Code'
            else:
                typ = 'datatype' if t in datatypes else ('iri' if t == 'IRI' else 'object')
                r = t
            fs.append(dict(property=key, type=typ, range=r, cardinality=card, values=vals))
            prop_types[key].add((typ, r))
            prop_users[key].add(c)
        classes[c] = dict(module=module, parent='Record' if parent == '-' else (None if parent == 'root' else parent), definition=definition, fields=fs)
    for (owner, prop), description in descriptions.items():
        assert owner in classes, (owner, prop)
        fields = [field for field in classes[owner]['fields'] if field['property'] == prop]
        assert len(fields) == 1, (owner, prop)
        fields[0]['description'] = description
    for c, info in classes.items():
        for field in info['fields']:
            if field['type'] == 'object':
                assert field['range'] in classes, (c, field)
    for key, types in prop_types.items():
        assert len({item[0] for item in types}) == 1, (key, types)
    return classes, enum, prop_types, prop_users
