"""Apply a bounded command group to domain schema text through the shared parser."""
import json
import re
import sys

from domain_schema import parse_schema

DATATYPES = {'string', 'langString', 'integer', 'nonNegativeInteger', 'positiveInteger', 'decimal', 'boolean', 'dateTime', 'date', 'time', 'anyURI', 'IRI'}
IDENTIFIER = re.compile(r'^[A-Za-z][A-Za-z0-9]*$')
ENUM = re.compile(r'^\{([A-Za-z][A-Za-z0-9]*(?:,[A-Za-z][A-Za-z0-9]*)+)\}$')


def apply_commands(schema, commands):
    if not isinstance(schema, str) or len(schema.encode('utf8')) > 2_000_000:
        raise ValueError('Invalid schema')
    if not isinstance(commands, list) or not 1 <= len(commands) <= 100:
        raise ValueError('Expected 1–100 commands')
    lines = schema.replace('\r\n', '\n').split('\n')
    for command in commands:
        if not isinstance(command, dict):
            raise ValueError('Invalid command')
        classes, _, _, _ = parse_schema('\n'.join(lines), DATATYPES - {'IRI'})
        modules = {line.split('|', 1)[1] for line in lines if line.startswith('MODULE|')}
        kind = command.get('type')
        if kind == 'class.add':
            name, module, parent, definition = (command.get(key) for key in ('name', 'module', 'parent', 'definition'))
            if set(command) != {'type', 'name', 'module', 'parent', 'definition'} or not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or name in classes or module not in modules or not (parent in ('root', '-') or parent in classes) or not isinstance(definition, str) or not definition.strip() or re.search(r'[|\r\n]', definition):
                raise ValueError('Invalid class.add')
            index = lines.index('MODULE|' + module) + 1
            while index < len(lines) and not lines[index].startswith('MODULE|'):
                index += 1
            lines.insert(index, f'{name}|{parent}|{definition}|')
        elif kind in ('property.add', 'relationship.add'):
            owner, name, target, cardinality = (command.get(key) for key in ('owner', 'name', 'range', 'cardinality'))
            existing = {field['property'] for item in classes.values() for field in item['fields']}
            match = ENUM.fullmatch(target) if isinstance(target, str) else None
            values = match.group(1).split(',') if match else []
            valid_enum = 2 <= len(values) <= 50 and len(set(values)) == len(values)
            if set(command) != {'type', 'owner', 'name', 'range', 'cardinality'} or owner not in classes or not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or name in existing or cardinality not in ('!', '?', '+', '*') or not (target in DATATYPES or target in classes or valid_enum) or (kind == 'relationship.add' and target not in classes):
                raise ValueError('Invalid property.add')
            index = next(i for i, line in enumerate(lines) if line.startswith(owner + '|'))
            parts = lines[index].split('|')
            parts[3] = ' '.join(filter(None, [parts[3], f'{name}:{target}{cardinality}']))
            lines[index] = '|'.join(parts)
        elif kind == 'class.describe':
            name, definition = command.get('name'), command.get('definition')
            if set(command) != {'type', 'name', 'definition'} or name not in classes or not isinstance(definition, str) or not definition.strip() or re.search(r'[|\r\n]', definition):
                raise ValueError('Invalid class.describe')
            index = next(i for i, line in enumerate(lines) if line.startswith(name + '|'))
            parts = lines[index].split('|')
            parts[2] = definition
            lines[index] = '|'.join(parts)
        else:
            raise ValueError(f'Unsupported command: {kind}')
    candidate = '\n'.join(lines)
    parse_schema(candidate, DATATYPES - {'IRI'})
    return candidate


def inspect_entity(schema, name):
    if not isinstance(schema, str) or len(schema.encode('utf8')) > 2_000_000 or not isinstance(name, str) or not IDENTIFIER.fullmatch(name):
        raise ValueError('Invalid entity request')
    classes, _, _, _ = parse_schema(schema, DATATYPES - {'IRI'})
    if name not in classes:
        raise ValueError('Class not found')
    positions = {line.split('|', 1)[0]: index for index, line in enumerate(schema.splitlines(), 1) if '|' in line and not line.startswith(('MODULE|', '#'))}
    fields, seen, current = [], set(), name
    while current is not None:
        if current in seen or current not in classes:
            raise ValueError('Invalid inheritance chain')
        seen.add(current)
        item = classes[current]
        fields.extend({**field, 'owner': current, 'inherited': current != name, 'source': {'path': 'model/domain.schema', 'line': positions[current]}} for field in item['fields'])
        current = item['parent']
    item = classes[name]
    return {'name': name, 'iri': 'https://example.org/charge-domain#' + name, 'module': item['module'], 'parent': item['parent'], 'definition': item['definition'], 'fields': fields, 'source': {'path': 'model/domain.schema', 'line': positions[name]}}


def main():
    try:
        request = json.load(sys.stdin)
        if request.get('action', 'apply') == 'apply':
            result = {'schema': apply_commands(request['schema'], request['commands'])}
        elif request['action'] == 'inspect':
            result = {'entity': inspect_entity(request['schema'], request['name'])}
        else:
            raise ValueError('Unsupported adapter action')
    except (ValueError, TypeError, KeyError, AssertionError, StopIteration) as error:
        result = {'error': str(error) or 'Invalid schema command'}
    json.dump(result, sys.stdout, ensure_ascii=True)


if __name__ == '__main__':
    main()
