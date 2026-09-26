import { clone, fixtureFingerprint } from "./core.js";

export const STORE_TYPES = ["semantic", "operational", "temporal", "telemetry", "evidence"];

export class SemanticGraphMemoryStore {
  constructor() {
    this.rows = [];
  }

  append({ graph, subject, predicate, object, source, validAt, recordedAt }) {
    const row = { graph, subject, predicate, object, source, validAt, recordedAt };
    this.rows.push(row);
    return { accepted: true, row };
  }

  snapshot() {
    return clone(this.rows);
  }
}

export class OperationalMemoryStore {
  constructor() {
    this.sessions = new Map();
    this.appliedEvents = new Map();
  }

  applyEvent({ eventId, sessionId, nextStatus, occurredAt, detail }) {
    if (this.appliedEvents.has(eventId)) {
      return { accepted: false, duplicate: true, session: clone(this.sessions.get(sessionId) ?? null) };
    }
    const current = this.sessions.get(sessionId) ?? {
      id: sessionId,
      status: "PENDING",
      revision: 0,
      lastUpdated: occurredAt,
      history: [],
    };
    const allowed = {
      PENDING: ["ACTIVE"],
      ACTIVE: ["ACTIVE", "COMPLETED"],
      COMPLETED: [],
    };
    if (!allowed[current.status]?.includes(nextStatus)) {
      return { accepted: false, duplicate: false, conflict: true, session: clone(current) };
    }
    const next = {
      ...current,
      status: nextStatus,
      revision: current.revision + 1,
      lastUpdated: occurredAt,
      history: [...current.history, { eventId, status: nextStatus, occurredAt, detail }],
    };
    this.sessions.set(sessionId, next);
    this.appliedEvents.set(eventId, sessionId);
    return { accepted: true, duplicate: false, session: clone(next) };
  }

  snapshot() {
    return [...this.sessions.values()].map(clone);
  }
}

export class TemporalMemoryStore {
  constructor() {
    this.rows = [];
  }

  append(record) {
    this.rows.push(clone(record));
    return { accepted: true, row: clone(record) };
  }

  asKnownAt({ key, validAt, knownAt }) {
    return this.rows
      .filter((row) => row.key === key && row.validAt <= validAt && row.recordedAt <= knownAt)
      .sort((a, b) => a.validAt.localeCompare(b.validAt) || a.recordedAt.localeCompare(b.recordedAt))
      .at(-1) ?? null;
  }

  snapshot() {
    return clone(this.rows);
  }
}

export class TelemetryMemoryStore {
  constructor() {
    this.rows = [];
    this.identities = new Set();
  }

  append(reading) {
    const identity = `${reading.source}:${reading.sequence}`;
    if (this.identities.has(identity)) {
      return { accepted: false, duplicate: true, identity };
    }
    this.identities.add(identity);
    const lateBySeconds = Math.max(0, Math.floor((Date.parse(reading.receivedAt) - Date.parse(reading.observedAt)) / 1000));
    const row = { ...clone(reading), lateBySeconds };
    this.rows.push(row);
    return { accepted: true, duplicate: false, row };
  }

  snapshot() {
    return clone(this.rows);
  }
}

export class EvidenceMemoryStore {
  constructor() {
    this.rows = [];
    this.keys = new Set();
  }

  put({ key, payload, source, occurredAt, receivedAt }) {
    if (this.keys.has(key)) return { accepted: false, duplicate: true, key };
    this.keys.add(key);
    const row = {
      key,
      source,
      occurredAt,
      receivedAt,
      payload: clone(payload),
      fingerprint: fixtureFingerprint(payload),
      fingerprintKind: "non-cryptographic-fixture-fingerprint",
    };
    this.rows.push(row);
    return { accepted: true, row };
  }

  snapshot() {
    return clone(this.rows);
  }
}

export function createMemoryStore(type) {
  const factories = {
    semantic: () => new SemanticGraphMemoryStore(),
    operational: () => new OperationalMemoryStore(),
    temporal: () => new TemporalMemoryStore(),
    telemetry: () => new TelemetryMemoryStore(),
    evidence: () => new EvidenceMemoryStore(),
  };
  if (!factories[type]) throw new Error(`Unknown simulated store type: ${type}`);
  return factories[type]();
}
