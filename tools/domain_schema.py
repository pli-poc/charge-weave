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
    module = None
    for no, line in enumerate(text.splitlines(), 1):
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
    for c, info in classes.items():
        for field in info['fields']:
            if field['type'] == 'object':
                assert field['range'] in classes, (c, field)
    for key, types in prop_types.items():
        assert len({item[0] for item in types}) == 1, (key, types)
    return classes, enum, prop_types, prop_users
