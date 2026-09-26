export const SIMULATOR_VERSION = "chargeweave-browser-sim-v1";
export const PRNG_VERSION = "chargeweave-xorshift32-v1";
export const RUN_START = "2026-09-26T08:00:00.000Z";

export function normaliseSeed(value) {
  const seed = String(value ?? "4242").trim();
  if (!seed || seed.length > 48) {
    throw new Error("Seed must contain between 1 and 48 characters.");
  }
  return seed;
}

function hash32(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRandomStream(seed, domain = "default") {
  let state = hash32(`${normaliseSeed(seed)}::${domain}`) || 0x6d2b79f5;
  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0x100000000;
    },
    integer(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    token(length = 8) {
      let token = "";
      while (token.length < length) token += this.integer(0, 0xffffffff).toString(16).padStart(8, "0");
      return token.slice(0, length).toUpperCase();
    },
  };
}

export function virtualTime(offsetSeconds, startAt = RUN_START) {
  return new Date(Date.parse(startAt) + offsetSeconds * 1000).toISOString();
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

// This deterministic fixture fingerprint is deliberately not a cryptographic digest.
export function fixtureFingerprint(value) {
  const text = typeof value === "string" ? value : stableStringify(value);
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fixture-fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
