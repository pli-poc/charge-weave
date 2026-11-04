import { readFileSync } from 'node:fs';

// Presentation labels only: mappings never create ontology assertions.
export const responsibilityMappingVersion = 'chargeweave-responsibility-v1';
export const responsibilityMappingPath = 'model/responsibility-bindings.json';
const identifier = /^[A-Za-z][A-Za-z0-9]*$/;
const categories = new Set(['ownership', 'service', 'role', 'assignment', 'affected']);
export function validateResponsibilityMapping(value) {
  if (!value || Object.keys(value).sort().join(',') !== 'bindings,version' || value.version !== responsibilityMappingVersion || !Array.isArray(value.bindings) || value.bindings.length > 1000) throw new Error('Invalid responsibility mapping');
  const seen = new Set();
  for (const item of value.bindings) {
    if (!item || Object.keys(item).sort().join(',') !== 'category,label,owner,property,range' || ['owner', 'property', 'range'].some(key => typeof item[key] !== 'string' || !identifier.test(item[key]) || item[key].length > 128) || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 100 || /[\u0000-\u001f\u007f]/.test(item.label) || !categories.has(item.category)) throw new Error('Invalid responsibility binding');
    const key = JSON.stringify([item.owner, item.property, item.range]);
    if (seen.has(key)) throw new Error('Duplicate responsibility binding');
    seen.add(key);
  }
  return value;
}
export const responsibilityMappings = validateResponsibilityMapping(JSON.parse(readFileSync(new URL('../../model/responsibility-bindings.json', import.meta.url), 'utf8'))).bindings;
