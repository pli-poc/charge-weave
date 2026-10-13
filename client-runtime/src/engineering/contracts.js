// A deliberately bounded JSON Schema profile. Unknown schema keywords fail closed.
export const VERSION = "1.0.0";
export const clone = (v) => structuredClone(v);
export const stable = (v) => JSON.stringify(v, (_, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
export async function sha256(value, crypto = globalThis.crypto) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : stable(value));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2, "0")).join("");
}
export const object = (properties = {}) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
export const string = { type: "string", minLength: 1, maxLength: 2000 };
export const integer = { type: "integer", minimum: 0 };
export function validate(schema, value, path = "input") {
  const supported = ["type", "properties", "required", "additionalProperties", "items", "enum", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "description"];
  if (Object.keys(schema).some(k => !supported.includes(k))) throw Error(`Unsupported schema at ${path}`);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (!types.some(t => t === actual || t === "integer" && Number.isSafeInteger(value))) throw Error(`Invalid type at ${path}`);
  if (schema.enum && !schema.enum.some(v => stable(v) === stable(value))) throw Error(`Unsupported value at ${path}`);
  if (actual === "number") {
    if (!Number.isFinite(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) throw Error(`Out of range at ${path}`);
  }
  if (actual === "string" && (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity))) throw Error(`Invalid length at ${path}`);
  if (actual === "array") {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) throw Error(`Invalid count at ${path}`);
    value.forEach((v, i) => validate(schema.items, v, `${path}[${i}]`));
  }
  if (actual === "object") {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) throw Error(`Missing ${path}.${key}`);
    for (const [key, v] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw Error(`Unsafe key at ${path}`);
      if (schema.properties?.[key]) validate(schema.properties[key], v, `${path}.${key}`);
      else if (schema.additionalProperties !== true) throw Error(`Unknown ${path}.${key}`);
    }
  }
  return value;
}
export function validateEnvelope(v, identity) {
  if (!v || !["ok", "failed", "blocked"].includes(v.status) || v.candidateDigest !== identity.candidateDigest || v.workspaceRevision !== identity.workspaceRevision || !Array.isArray(v.evidenceRefs) || !Array.isArray(v.unsupported) || typeof v.truncated !== "boolean") throw Error("Invalid or stale provider result");
  return v;
}
