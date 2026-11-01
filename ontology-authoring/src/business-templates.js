// Fixed source generation only: user-supplied identifiers are never treated as code.
export const canonicalJson = value => JSON.stringify(value, null, 2).replace(/[\u007f-\uffff]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) + '\n';
export const intervalSourcePaths = [
  'model/audit-rules.json', 'model/authoring-example-overrides.json',
  'requirements/business-requirements.json', 'tests/business-acceptance.json', 'tests/negative-cases.json',
];
const identifier = /^[A-Za-z][A-Za-z0-9]*$/;

export function buildIntervalSources(owner, command, contents) {
  const keys = ['endProperty', 'expectedEndCardinality', 'expectedRules', 'expectedStartCardinality', 'owner', 'requirementId', 'ruleId', 'startProperty', 'template', 'type'].sort().join(',');
  if (!command || Object.keys(command).sort().join(',') !== keys || command.type !== 'constraint.add' || command.template !== 'valid-interval' || !owner || owner.name !== command.owner || owner.name === 'Record' || !identifier.test(command.startProperty ?? '') || !identifier.test(command.endProperty ?? '') || command.startProperty === command.endProperty || !['!', '?'].includes(command.expectedStartCardinality) || !['!', '?'].includes(command.expectedEndCardinality) || !/^BR-[0-9]+$/.test(command.requirementId ?? '') || !/^B[0-9]{3,6}$/.test(command.ruleId ?? '') || !Array.isArray(command.expectedRules) || command.expectedRules.length > 500 || command.expectedRules.some(id => typeof id !== 'string' || !/^B[0-9]{3,6}$/.test(id))) throw new Error('Invalid valid-interval template');
  const tokens = owner.fields.split(/\s+/).filter(Boolean);
  for (const [name, card] of [[command.startProperty, command.expectedStartCardinality], [command.endProperty, command.expectedEndCardinality]]) {
    if (tokens.filter(token => token.split(':', 1)[0] === name).length !== 1 || !tokens.includes(`${name}:dateTime${card}`)) throw new Error('Interval field precondition does not match a declared dateTime field');
  }
  const data = {};
  for (const path of intervalSourcePaths) {
    if (typeof contents[path] !== 'string') throw new Error(`Required template source is unavailable: ${path}`);
    const parsed = JSON.parse(contents[path]);
    if (canonicalJson(parsed) !== contents[path].replace(/\r\n/g, '\n')) throw new Error(`Template source format is not supported: ${path}`);
    data[path] = parsed;
  }
  const rules = data[intervalSourcePaths[0]], overrides = data[intervalSourcePaths[1]], requirements = data[intervalSourcePaths[2]], cases = data[intervalSourcePaths[3]], negatives = data[intervalSourcePaths[4]];
  if (!Array.isArray(rules) || !overrides || typeof overrides !== 'object' || Array.isArray(overrides) || !Array.isArray(requirements) || !Array.isArray(cases) || !negatives || typeof negatives !== 'object' || Array.isArray(negatives)) throw new Error('Invalid template sources');
  const selected = requirements.filter(item => item.id === command.requirementId);
  if (selected.length !== 1 || !Array.isArray(selected[0].rules) || JSON.stringify(selected[0].rules) !== JSON.stringify(command.expectedRules) || !Array.isArray(selected[0].classes) || !selected[0].classes.includes(owner.name)) throw new Error('Requirement precondition does not match or class is not linked');
  const requirement = selected[0];
  if (!Array.isArray(requirement.scenarios) || !Array.isArray(requirement.relationships) || !Array.isArray(requirement.sources) || !requirement.sources.length || !requirement.journey || !requirement.phase) throw new Error('Requirement lacks traceability fields');
  if (Object.hasOwn(negatives, command.ruleId) || rules.some(rule => rule.id === command.ruleId) || requirement.rules.includes(command.ruleId) || cases.some(item => item.rule === command.ruleId)) throw new Error('Rule ID is already in use');
  const caseIds = ['PASS', 'EQUAL', 'REVERSED'].map(suffix => `${command.requirementId}-${command.ruleId}-${suffix}`);
  if (caseIds.some(id => cases.some(item => item.id === id) || requirement.scenarios.includes(id))) throw new Error('Scenario ID is already in use');
  const title = `${command.endProperty} must be later than ${command.startProperty} when both are present.`;
  const body = `$this cd:${command.startProperty} ?start; cd:${command.endProperty} ?end. FILTER(?end <= ?start)`;
  rules.push({ id: command.ruleId, requirement: command.requirementId, target: owner.name, title, body, journey: requirement.journey, phase: requirement.phase, source: requirement.sources[0], provenance: 'template-derived' });
  const triple = (start, end) => `ex:this cd:${command.startProperty} "${start}"^^xsd:dateTime; cd:${command.endProperty} "${end}"^^xsd:dateTime.`;
  const start = '2026-09-25T10:00:00Z', later = '2026-09-25T11:00:00Z', earlier = '2026-09-25T09:00:00Z';
  negatives[command.ruleId] = triple(start, earlier);
  for (const [index, end, expected] of [[0, later, true], [1, start, false], [2, earlier, false]]) cases.push({ id: caseIds[index], requirement: command.requirementId, rule: command.ruleId, focusClass: owner.name, expectedConformance: expected, given: triple(start, end), when: 'Validate the declared interval constraint.', then: title, scope: 'Template-derived draft case; independent business review is still required.', provenance: 'template-derived' });
  requirement.rules.push(command.ruleId);
  requirement.scenarios.push(...caseIds);
  let relationship = requirement.relationships.find(item => item.class === owner.name);
  if (!relationship) { relationship = { class: owner.name, properties: [] }; requirement.relationships.push(relationship); }
  if (!Array.isArray(relationship.properties)) throw new Error('Invalid requirement relationship');
  for (const property of [command.startProperty, command.endProperty]) if (!relationship.properties.includes(property)) relationship.properties.push(property);
  if (!Object.hasOwn(overrides, owner.name)) overrides[owner.name] = {};
  if (!overrides[owner.name] || typeof overrides[owner.name] !== 'object' || Array.isArray(overrides[owner.name])) throw new Error('Invalid example override');
  for (const [name, value] of [[command.startProperty, start], [command.endProperty, later]]) {
    if (Object.hasOwn(overrides[owner.name], name) && overrides[owner.name][name] !== value) throw new Error('Example override conflicts with existing fixture input');
    overrides[owner.name][name] = value;
  }
  return Object.fromEntries(intervalSourcePaths.map(path => [path, canonicalJson(data[path])]));
}

// A reviewer supplies both the example and expected decision. Only fixed Turtle
// syntax is emitted; rule success is checked later, never inferred here.
export function buildReviewerIntervalCase(command, contents) {
  const keys = ['caseId', 'end', 'expectedConformance', 'requirementId', 'ruleId', 'scenario', 'start', 'type'].sort().join(',');
  const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value.replace('Z', '.000Z');
  if (!command || Object.keys(command).sort().join(',') !== keys || command.type !== 'reviewer.interval_case_add' || !/^BR-[0-9]+$/.test(command.requirementId ?? '') || !/^B[0-9]{3,6}$/.test(command.ruleId ?? '') || !/^[A-Za-z0-9][A-Za-z0-9-]{0,127}$/.test(command.caseId ?? '') || !timestamp(command.start) || !timestamp(command.end) || typeof command.expectedConformance !== 'boolean' || typeof command.scenario !== 'string' || command.scenario.trim().length < 12 || command.scenario.length > 1000) throw new Error('Invalid reviewer interval case');
  const paths = ['model/audit-rules.json', 'requirements/business-requirements.json', 'tests/business-acceptance.json'];
  const data = paths.map(path => {
    if (typeof contents[path] !== 'string') throw new Error('Reviewer case source is unavailable');
    const value = JSON.parse(contents[path]);
    if (!Array.isArray(value) || canonicalJson(value) !== contents[path].replace(/\r\n/g, '\n')) throw new Error('Reviewer case source format is unsupported');
    return value;
  });
  const [rules, requirements, cases] = data;
  const matches = rules.filter(item => item.id === command.ruleId && item.requirement === command.requirementId && item.provenance === 'template-derived');
  const requirement = requirements.filter(item => item.id === command.requirementId);
  if (matches.length !== 1 || requirement.length !== 1 || !Array.isArray(requirement[0].scenarios) || !Array.isArray(requirement[0].rules) || !requirement[0].rules.includes(command.ruleId)) throw new Error('Reviewer case rule or requirement is unavailable');
  const rule = matches[0];
  const body = /^\$this cd:([A-Za-z][A-Za-z0-9]*) \?start; cd:([A-Za-z][A-Za-z0-9]*) \?end\. FILTER\(\?end <= \?start\)$/.exec(rule.body);
  if (!body || !identifier.test(rule.target ?? '')) throw new Error('Unsupported interval rule');
  const given = `ex:this cd:${body[1]} "${command.start}"^^xsd:dateTime; cd:${body[2]} "${command.end}"^^xsd:dateTime.`;
  if (cases.some(item => item.id === command.caseId || item.rule === command.ruleId && item.given === given) || requirement[0].scenarios.includes(command.caseId)) throw new Error('Reviewer case duplicates an existing ID or example');
  cases.push({ id: command.caseId, requirement: command.requirementId, rule: command.ruleId, focusClass: rule.target, expectedConformance: command.expectedConformance, given, when: 'Validate the declared interval constraint.', then: command.scenario.trim(), scope: 'Reviewer-authored synthetic business case; review its independence and relevance.', provenance: 'independent' });
  requirement[0].scenarios.push(command.caseId);
  return Object.fromEntries([[paths[1], canonicalJson(requirements)], [paths[2], canonicalJson(cases)]]);
}
