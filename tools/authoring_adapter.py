"""Apply a bounded command group to domain schema text through the shared parser."""
import json
import re
import sys

from domain_schema import parse_schema

DATATYPES = {'string', 'langString', 'integer', 'nonNegativeInteger', 'positiveInteger', 'decimal', 'boolean', 'dateTime', 'date', 'time', 'anyURI', 'IRI'}
IDENTIFIER = re.compile(r'^[A-Za-z][A-Za-z0-9]*$')
ENUM = re.compile(r'^\{([A-Za-z][A-Za-z0-9]*(?:,[A-Za-z][A-Za-z0-9]*)+)\}$')
TEMPLATES = [
    {'id': 'required-relationship', 'description': 'Require an existing optional object relationship while preserving its maximum cardinality.', 'sourceOwner': 'model/domain.schema', 'compiler': 'tools/build.py', 'testFactory': 'structural-positive-and-missing-relationship'},
    {'id': 'allowed-values', 'description': 'Narrow an existing controlled-value set to a strict subset containing at least two values.', 'sourceOwner': 'model/domain.schema', 'compiler': 'tools/build.py', 'testFactory': 'structural-positive-and-disallowed-value'},
]


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
            description = command.get('description')
            keys = {'type', 'owner', 'name', 'range', 'cardinality'}
            if kind == 'relationship.add' and 'description' in command:
                keys.add('description')
            if set(command) != keys or ('description' in command and (not isinstance(description, str) or not description.strip() or len(description) > 4000 or re.search(r'[|\r\n]', description))) or owner not in classes or not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or name in existing or cardinality not in ('!', '?', '+', '*') or not (target in DATATYPES or target in classes or valid_enum) or (kind == 'relationship.add' and target not in classes):
                raise ValueError('Invalid property.add')
            index = next(i for i, line in enumerate(lines) if line.startswith(owner + '|'))
            parts = lines[index].split('|')
            parts[3] = ' '.join(filter(None, [parts[3], f'{name}:{target}{cardinality}']))
            lines[index] = '|'.join(parts)
            if description is not None:
                lines.insert(index + 1, f'# FIELD-DESCRIPTION|{owner}|{name}|{description.strip()}')
        elif kind == 'constraint.add':
            template = command.get('template')
            owner, name, old_range, old_cardinality = (command.get(key) for key in ('owner', 'name', 'expectedRange', 'expectedCardinality'))
            common = {'type', 'template', 'owner', 'name', 'expectedRange', 'expectedCardinality'}
            if template == 'required-relationship':
                if set(command) != common or old_range not in classes or old_cardinality not in ('?', '*'):
                    raise ValueError('Invalid required-relationship template')
                target, cardinality = old_range, {'?': '!', '*': '+'}[old_cardinality]
            elif template == 'allowed-values':
                match = ENUM.fullmatch(old_range) if isinstance(old_range, str) else None
                values = command.get('values')
                existing = match.group(1).split(',') if match else []
                if set(command) != common | {'values'} or not isinstance(values, list) or not 2 <= len(values) <= 50 or any(not isinstance(value, str) or not IDENTIFIER.fullmatch(value) for value in values) or len(values) != len(set(values)) or not set(values) < set(existing) or old_cardinality not in ('!', '?', '+', '*'):
                    raise ValueError('Invalid allowed-values template')
                target, cardinality = '{' + ','.join(values) + '}', old_cardinality
            else:
                raise ValueError('Unsupported constraint template')
            candidate = apply_commands('\n'.join(lines), [{'type': 'property.update', 'owner': owner, 'name': name, 'expectedRange': old_range, 'expectedCardinality': old_cardinality, 'range': target, 'cardinality': cardinality}])
            lines = candidate.split('\n')
        elif kind == 'property.update':
            owner, name, old_range, old_cardinality, target, cardinality = (command.get(key) for key in ('owner', 'name', 'expectedRange', 'expectedCardinality', 'range', 'cardinality'))
            match = ENUM.fullmatch(target) if isinstance(target, str) else None
            values = match.group(1).split(',') if match else []
            valid_enum = 2 <= len(values) <= 50 and len(set(values)) == len(values)
            if set(command) != {'type', 'owner', 'name', 'expectedRange', 'expectedCardinality', 'range', 'cardinality'} or owner not in classes or not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or not isinstance(old_range, str) or old_cardinality not in ('!', '?', '+', '*') or cardinality not in ('!', '?', '+', '*') or not (target in DATATYPES or target in classes or valid_enum):
                raise ValueError('Invalid property.update')
            index = next(i for i, line in enumerate(lines) if line.startswith(owner + '|'))
            parts = lines[index].split('|')
            previous = f'{name}:{old_range}{old_cardinality}'
            token_pattern = r'(?<!\S)' + re.escape(previous) + r'(?!\S)'
            if len(re.findall(token_pattern, parts[3])) != 1 or sum(token.split(':', 1)[0] == name for token in parts[3].split()) != 1:
                raise ValueError('Property precondition does not match a declared field')
            parts[3] = re.sub(token_pattern, lambda _: f'{name}:{target}{cardinality}', parts[3], count=1)
            lines[index] = '|'.join(parts)
            try:
                _, _, property_types, _ = parse_schema('\n'.join(lines), DATATYPES - {'IRI'})
                if any(len({rng for typ, rng in types if typ == 'datatype'}) > 1 for types in property_types.values()):
                    raise ValueError('Shared datatype property ranges must agree')
            except AssertionError as error:
                raise ValueError('Property update conflicts with a shared property contract') from error
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
        elif request['action'] == 'templates':
            result = {'templates': TEMPLATES}
        else:
            raise ValueError('Unsupported adapter action')
    except (ValueError, TypeError, KeyError, AssertionError, StopIteration) as error:
        result = {'error': str(error) or 'Invalid schema command'}
    json.dump(result, sys.stdout, ensure_ascii=True)


if __name__ == '__main__':
    main()
