import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildIntervalSources, canonicalJson, intervalSourcePaths } from '../src/business-templates.js';

test('valid-interval template creates fixed rules, deliberate negative and boundary cases', () => {
  const owner = { name: 'MaintenanceWindow', fields: 'beginsAt:dateTime! finishesAt:dateTime?' };
  const command = { type: 'constraint.add', template: 'valid-interval', owner: owner.name, startProperty: 'beginsAt', endProperty: 'finishesAt', expectedStartCardinality: '!', expectedEndCardinality: '?', requirementId: 'BR-001', expectedRules: ['B001'], ruleId: 'B900' };
  const contents = Object.fromEntries([
    [], {}, [{ id: 'BR-001', classes: [owner.name], rules: ['B001'], scenarios: ['REF-PASS'], relationships: [], sources: ['CW-POLICY'], journey: 'J01', phase: 'operation' }], [], { B001: 'existing' },
  ].map((value, index) => [intervalSourcePaths[index], canonicalJson(value)]));
  const updated = buildIntervalSources(owner, command, contents);
  const rules = JSON.parse(updated['model/audit-rules.json']);
  assert.equal(rules[0].id, 'B900');
  assert.equal(rules[0].provenance, 'template-derived');
  assert.equal(rules[0].body, '$this cd:beginsAt ?start; cd:finishesAt ?end. FILTER(?end <= ?start)');
  assert.match(JSON.parse(updated['tests/negative-cases.json']).B900, /09:00:00Z/);
  const cases = JSON.parse(updated['tests/business-acceptance.json']);
  assert.deepEqual(cases.map(item => item.expectedConformance), [true, false, false]);
  assert.ok(cases.every(item => item.provenance === 'template-derived'));
  assert.match(cases[1].given, /10:00:00Z.*10:00:00Z/);
  const requirement = JSON.parse(updated['requirements/business-requirements.json'])[0];
  assert.ok(requirement.rules.includes('B900'));
  assert.equal(requirement.scenarios.length, 4);
  assert.deepEqual(requirement.relationships[0].properties, ['beginsAt', 'finishesAt']);
  assert.equal(JSON.parse(updated['model/authoring-example-overrides.json']).MaintenanceWindow.finishesAt, '2026-09-25T11:00:00Z');
  assert.throws(() => buildIntervalSources(owner, { ...command, startProperty: 'beginsAt} UNION {' }, contents), /Invalid/);
  assert.throws(() => buildIntervalSources(owner, { ...command, expectedRules: [] }, contents), /precondition/);
  assert.throws(() => buildIntervalSources(owner, { ...command, ruleId: 'B001' }, contents), /already in use/);
  assert.throws(() => buildIntervalSources(owner, { ...command, expectedEndCardinality: '*' }, contents), /Invalid/);
});
