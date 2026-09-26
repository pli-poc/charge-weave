import {
  clone,
  createRandomStream,
  fixtureFingerprint,
  normaliseSeed,
  PRNG_VERSION,
  round,
  RUN_START,
  SIMULATOR_VERSION,
  stableStringify,
  virtualTime,
} from "./core.js";
import { createMemoryStore, STORE_TYPES } from "./stores.js";

export const PROTOCOL_PROFILES = {
  ocpp: "OCPP 2.1 Edition 1 · transaction basics fixture subset",
  ocpi: "OCPI 2.3.0 Core · Commands, Sessions and CDRs fixture subset",
};

export const SCENARIOS = [
  { id: "happy-path", label: "Successful roaming charge", description: "Accepted start, transaction events, session update and CDR." },
  { id: "authorization-denied", label: "Authorization denied", description: "Station denies the token; no session or CDR is created." },
  { id: "duplicate-event", label: "Duplicate transaction event", description: "Repeat one event to exercise idempotency across the process and stores." },
  { id: "late-meter", label: "Late meter observation", description: "Receive an older observation after session end and retain both event and receipt time." },
  { id: "cdr-correction", label: "Meter correction and CDR credit", description: "Correct a completed reading and issue a new credit CDR linked to the original." },
];

export const DEFAULT_COMPOSITION = {
  inputs: { ocpp: "virtual", ocpi: "virtual", grid: "scenario" },
  process: "synthetic",
  stores: Object.fromEntries(STORE_TYPES.map((type) => [type, "memory"])),
};

const STORE_LABELS = {
  semantic: "Named-graph memory",
  operational: "Versioned state memory",
  temporal: "Append-only temporal memory",
  telemetry: "Time-series memory",
  evidence: "Payload evidence memory",
};

function ocpiSuccess(data, timestamp) {
  return { status_code: 1000, status_message: null, timestamp, data };
}

function makeOcpiExchange({ id, at, from, to, method, path, body, responseData = null, headers = {} }) {
  return {
    id,
    at,
    from,
    to,
    method,
    path,
    request: { body: clone(body) },
    response: {
      status: 200,
      headers: clone(headers),
      body: ocpiSuccess(responseData, at),
    },
  };
}

function makeOcppAdapter() {
  return {
    label: "Virtual OCPP charge point",
    description: PROTOCOL_PROFILES.ocpp,
    exchange(context) {
      const { random, scenario, ids, stationId, tokenUid } = context;
      let messageCounter = 0;
      const frames = [];
      const events = [];
      const addCall = ({ at, direction, action, payload, response, responseAt = at }) => {
        const uniqueId = `ocpp-${String(++messageCounter).padStart(3, "0")}`;
        const call = [2, uniqueId, action, clone(payload)];
        const result = [3, uniqueId, clone(response)];
        frames.push({ id: `${uniqueId}-call`, at, direction, action, messageType: "CALL", frame: call });
        const responseDirection = direction === "charge point → CSMS" ? "CSMS → charge point" : "charge point → CSMS";
        frames.push({ id: `${uniqueId}-result`, at: responseAt, direction: responseDirection, action, messageType: "CALLRESULT", frame: result });
        return uniqueId;
      };

      addCall({
        at: virtualTime(2),
        responseAt: virtualTime(2),
        direction: "charge point → CSMS",
        action: "BootNotification",
        payload: {
          chargingStation: { model: "CW-Virtual-AC", vendorName: "ChargeWeave fixture", serialNumber: stationId },
          reason: "PowerUp",
        },
        response: { currentTime: virtualTime(2), interval: 300, status: "Accepted" },
      });
      addCall({
        at: virtualTime(3),
        direction: "charge point → CSMS",
        action: "Heartbeat",
        payload: {},
        response: { currentTime: virtualTime(3) },
      });
      addCall({
        at: virtualTime(4),
        direction: "CSMS → charge point",
        action: "RequestStartTransaction",
        payload: {
          remoteStartId: random.integer(1000, 999999),
          idToken: { idToken: tokenUid, type: "Central" },
          evseId: 1,
        },
        response: { status: "Accepted" },
      });

      const authorized = scenario !== "authorization-denied";
      const authorizePayload = { idToken: { idToken: tokenUid, type: "Central" } };
      const authorizeResponse = {
        idTokenInfo: {
          status: authorized ? "Accepted" : "Invalid",
          ...(authorized ? {} : { cacheExpiryDateTime: virtualTime(3600) }),
        },
      };
      const authorizeId = addCall({
        at: virtualTime(5),
        direction: "charge point → CSMS",
        action: "Authorize",
        payload: authorizePayload,
        response: authorizeResponse,
      });
      events.push({
        kind: "authorization",
        id: `${ids.transactionId}:authorization`,
        at: virtualTime(5),
        receivedAt: virtualTime(5),
        accepted: authorized,
        frameId: `${authorizeId}-call`,
        payload: authorizePayload,
        response: authorizeResponse,
      });

      if (!authorized) return { frames, events, accepted: false };

      const started = {
        eventType: "Started",
        timestamp: virtualTime(7),
        triggerReason: "RemoteStart",
        seqNo: 0,
        transactionInfo: { transactionId: ids.transactionId },
        evse: { id: 1, connectorId: 1 },
        idToken: { idToken: tokenUid, type: "Central" },
      };
      const startedId = addCall({
        at: virtualTime(7),
        direction: "charge point → CSMS",
        action: "TransactionEvent",
        payload: started,
        response: {},
      });
      events.push({
        kind: "transaction.started",
        id: `${ids.transactionId}:0`,
        transactionId: ids.transactionId,
        sequence: 0,
        at: started.timestamp,
        receivedAt: virtualTime(7),
        frameId: `${startedId}-call`,
        payload: started,
      });

      const intermediateWh = Math.round(context.energyKwh * 570);
      const finalWh = Math.round(context.energyKwh * 1000);
      const updated = {
        eventType: "Updated",
        timestamp: virtualTime(300),
        triggerReason: "MeterValuePeriodic",
        seqNo: 1,
        transactionInfo: { transactionId: ids.transactionId },
        meterValue: [meterValue(virtualTime(300), intermediateWh)],
      };
      const updatedId = addCall({
        at: virtualTime(300),
        direction: "charge point → CSMS",
        action: "TransactionEvent",
        payload: updated,
        response: {},
      });
      events.push({
        kind: "transaction.updated",
        id: `${ids.transactionId}:1`,
        transactionId: ids.transactionId,
        sequence: 1,
        at: updated.timestamp,
        receivedAt: virtualTime(300),
        frameId: `${updatedId}-call`,
        payload: updated,
        reading: { value: intermediateWh, unit: "Wh", sequence: "ocpp-1" },
      });
      if (scenario === "duplicate-event") {
        const duplicateId = addCall({
          at: virtualTime(301),
          direction: "charge point → CSMS",
          action: "TransactionEvent",
          payload: updated,
          response: {},
        });
        events.push({
          kind: "transaction.updated",
          id: `${ids.transactionId}:1`,
          transactionId: ids.transactionId,
          sequence: 1,
          at: updated.timestamp,
          receivedAt: virtualTime(301),
          frameId: `${duplicateId}-call`,
          payload: updated,
          reading: { value: intermediateWh, unit: "Wh", sequence: "ocpp-1" },
          injectedDuplicate: true,
        });
      }

      const ended = {
        eventType: "Ended",
        timestamp: virtualTime(1800),
        triggerReason: "EVDeparted",
        seqNo: 2,
        transactionInfo: { transactionId: ids.transactionId },
        meterValue: [meterValue(virtualTime(1800), finalWh)],
      };
      const endedId = addCall({
        at: virtualTime(1800),
        direction: "charge point → CSMS",
        action: "TransactionEvent",
        payload: ended,
        response: {},
      });
      events.push({
        kind: "transaction.ended",
        id: `${ids.transactionId}:2`,
        transactionId: ids.transactionId,
        sequence: 2,
        at: ended.timestamp,
        receivedAt: virtualTime(1800),
        frameId: `${endedId}-call`,
        payload: ended,
        reading: { value: finalWh, unit: "Wh", sequence: "ocpp-2" },
      });
      return { frames, events, accepted: true };
    },
  };
}

function meterValue(timestamp, wattHours) {
  return {
    timestamp,
    sampledValue: [{
      value: String(wattHours),
      context: "Sample.Periodic",
      measurand: "Energy.Active.Import.Register",
      unitOfMeasure: { unit: "Wh" },
    }],
  };
}

function makeOcpiAdapter() {
  return {
    label: "Virtual OCPI eMSP and CPO",
    description: PROTOCOL_PROFILES.ocpi,
    startSession(context) {
      const { ids, tokenUid } = context;
      const body = {
        response_url: `https://emsp.synthetic.invalid/ocpi/2.3.0/commands/START_SESSION/${ids.commandId}`,
        token: {
          country_code: "NL",
          party_id: "CWX",
          uid: tokenUid,
          type: "APP_USER",
          contract_id: `NL-CWX-${tokenUid}`,
          issuer: "ChargeWeave synthetic eMSP",
          valid: true,
          whitelist: "NEVER",
          last_updated: virtualTime(0),
        },
        location_id: ids.locationId,
        evse_uid: ids.evseUid,
        connector_id: "1",
        authorization_reference: ids.authorizationReference,
      };
      return makeOcpiExchange({
        id: "ocpi-start-session-request",
        at: virtualTime(1),
        from: "eMSP → CPO",
        to: "CPO Commands receiver",
        method: "POST",
        path: "/ocpi/cpo/2.3.0/commands/START_SESSION",
        body,
        responseData: { result: "ACCEPTED", timeout: 30 },
      });
    },
    commandResult(context, result) {
      const body = { result, message: [{ language: "en", text: result === "ACCEPTED" ? "Virtual charge point accepted the start request." : "Authorization was denied by the virtual charge point." }] };
      return makeOcpiExchange({
        id: "ocpi-start-session-result",
        at: virtualTime(6),
        from: "CPO → eMSP",
        to: "eMSP Commands sender callback",
        method: "POST",
        path: `/ocpi/emsp/2.3.0/commands/START_SESSION/${context.ids.commandId}`,
        body,
        responseData: null,
      });
    },
    publishSession(context, session, method = "PUT", id = "ocpi-session-update") {
      const body = method === "PATCH"
        ? {
            ...(session.end_date_time ? { end_date_time: session.end_date_time } : {}),
            kwh: session.kwh,
            status: session.status,
            total_cost: session.total_cost,
            last_updated: session.last_updated,
            ...(session.status === "COMPLETED" ? { charging_periods: session.charging_periods } : {}),
          }
        : session;
      return makeOcpiExchange({
        id,
        at: session.last_updated,
        from: "CPO → eMSP",
        to: "eMSP Sessions receiver",
        method,
        path: `/ocpi/emsp/2.3.0/sessions/${session.country_code}/${session.party_id}/${session.id}`,
        body,
        responseData: null,
      });
    },
    publishCdr(context, cdr, id = "ocpi-cdr-create") {
      const location = `https://emsp.synthetic.invalid/ocpi/emsp/2.3.0/cdrs/${cdr.id}`;
      return makeOcpiExchange({
        id,
        at: cdr.last_updated,
        from: "CPO → eMSP",
        to: "eMSP CDR receiver",
        method: "POST",
        path: "/ocpi/emsp/2.3.0/cdrs",
        body: cdr,
        responseData: null,
        headers: { Location: location },
      });
    },
  };
}

function makeGridAdapter() {
  return {
    label: "Deterministic tariff and grid fixture",
    description: "Seeded synthetic energy price and grid intensity; no external feed.",
    snapshot(context) {
      const priceRandom = createRandomStream(context.seed, "grid-price");
      const carbonRandom = createRandomStream(context.seed, "grid-carbon");
      return {
        energyPricePerKwh: round(0.27 + priceRandom.next() * 0.12, 2),
        currency: "EUR",
        carbonIntensityGramsPerKwh: carbonRandom.integer(90, 330),
        tariffId: "CW-SYNTHETIC-FIXED-ENERGY-01",
        source: "scenario-fixture",
      };
    },
  };
}

function defaultRegistries() {
  return {
    inputs: {
      ocpp: new Map([["virtual", makeOcppAdapter()]]),
      ocpi: new Map([["virtual", makeOcpiAdapter()]]),
      grid: new Map([["scenario", makeGridAdapter()]]),
    },
    process: new Map([["synthetic", {
      label: "Synthetic process rules",
      applyEvent({ store, event, sessionId }) {
        const nextStatus = event.kind === "transaction.started"
          ? "ACTIVE"
          : event.kind === "transaction.ended"
            ? "COMPLETED"
            : "ACTIVE";
        return {
          nextStatus,
          result: store.applyEvent({
            eventId: event.id,
            sessionId,
            nextStatus,
            occurredAt: event.at,
            detail: event.kind,
          }),
        };
      },
    }]]),
    stores: Object.fromEntries(STORE_TYPES.map((type) => [type, new Map([
      ["memory", { label: STORE_LABELS[type], create: () => createMemoryStore(type) }],
    ])])),
  };
}

function mergeComposition(input = {}) {
  return {
    inputs: { ...DEFAULT_COMPOSITION.inputs, ...(input.inputs ?? {}) },
    process: input.process ?? DEFAULT_COMPOSITION.process,
    stores: { ...DEFAULT_COMPOSITION.stores, ...(input.stores ?? {}) },
  };
}

function lookup(registry, path, id) {
  const adapter = registry.get(id);
  if (!adapter) throw new Error(`No adapter registered for ${path}=${id}.`);
  return adapter;
}

function idPart(random, prefix, length = 8) {
  return `${prefix}-${random.token(length)}`;
}

function priceFor(energyKwh, unitPrice) {
  return round(energyKwh * unitPrice + 0.42, 2);
}

function priceObject(total) {
  return { excl_vat: total };
}

function buildSession(context, status, energyKwh, at, totalCost) {
  const { ids, tokenUid, grid } = context;
  const startedAt = virtualTime(7);
  return {
    country_code: "NL",
    party_id: "CWZ",
    id: ids.sessionId,
    start_date_time: startedAt,
    ...(status === "COMPLETED" ? { end_date_time: virtualTime(1800) } : {}),
    kwh: energyKwh,
    cdr_token: {
      country_code: "NL",
      party_id: "CWX",
      uid: tokenUid,
      type: "APP_USER",
      contract_id: `NL-CWX-${tokenUid}`,
    },
    auth_method: "COMMAND",
    authorization_reference: ids.authorizationReference,
    location_id: ids.locationId,
    evse_uid: ids.evseUid,
    connector_id: "1",
    meter_id: ids.meterId,
    currency: grid.currency,
    charging_periods: status === "ACTIVE" ? [] : [{
      start_date_time: startedAt,
      dimensions: [{ type: "ENERGY_IMPORT", volume: energyKwh }],
    }],
    total_cost: priceObject(totalCost),
    status,
    last_updated: at,
  };
}

function buildCdr(context, energyKwh, at, { id = context.ids.cdrId, credit = false, reference } = {}) {
  const { ids, tokenUid, grid } = context;
  const totalCost = credit
    ? round(energyKwh * grid.energyPricePerKwh, 2)
    : priceFor(energyKwh, grid.energyPricePerKwh);
  return {
    country_code: "NL",
    party_id: "CWZ",
    id,
    start_date_time: virtualTime(7),
    end_date_time: virtualTime(1800),
    session_id: ids.sessionId,
    cdr_token: {
      country_code: "NL",
      party_id: "CWX",
      uid: tokenUid,
      type: "APP_USER",
      contract_id: `NL-CWX-${tokenUid}`,
    },
    auth_method: "COMMAND",
    authorization_reference: ids.authorizationReference,
    cdr_location: {
      id: ids.locationId,
      name: "ChargeWeave synthetic depot",
      address: "1 Exampleplein",
      city: "Utrecht",
      postal_code: "3511AA",
      country: "NLD",
      coordinates: { latitude: "52.0907", longitude: "5.1214" },
      evse_uid: ids.evseUid,
      evse_id: `NL*CWZ*E${ids.evseSuffix}`,
      connector_id: "1",
      connector_standard: "IEC_62196_T2_COMBO",
      connector_format: "CABLE",
      connector_power_type: "DC",
    },
    meter_id: ids.meterId,
    currency: grid.currency,
    tariffs: [],
    charging_periods: [{
      start_date_time: virtualTime(7),
      dimensions: [{ type: "ENERGY", volume: energyKwh }],
    }],
    total_cost: priceObject(totalCost),
    total_energy: energyKwh,
    total_time: 0.5,
    ...(credit ? { credit: true, credit_reference_id: reference, remark: "Synthetic meter-correction credit fixture." } : {}),
    last_updated: at,
  };
}

function writeSemantic(stores, context, event, status) {
  const subject = `urn:chargeweave:synthetic:${event.transactionId ?? context.ids.sessionId}:${event.sequence ?? "late"}`;
  const facts = [
    ["rdf:type", event.kind],
    ["cw:session", context.ids.sessionId],
    ["cw:status", status],
    ["prov:wasDerivedFrom", event.frameId ?? "urn:chargeweave:fixture:late-meter"],
  ];
  if (event.at) facts.push(["cw:validAt", event.at]);
  for (const [predicate, object] of facts) {
    stores.semantic.append({
      graph: `urn:chargeweave:synthetic:run:${context.ids.runId}`,
      subject,
      predicate,
      object,
      source: event.frameId ?? "synthetic-late-meter-fixture",
      validAt: event.at,
      recordedAt: event.receivedAt,
    });
  }
}

function writeTemporal(stores, context, event, value, key = `session:${context.ids.sessionId}:state`) {
  stores.temporal.append({
    key,
    value,
    validAt: event.at,
    recordedAt: event.receivedAt,
    source: event.frameId ?? "synthetic-late-meter-fixture",
    eventId: event.id,
  });
}

function readingToKwh(reading) {
  return round(Number(reading.value) / 1000, 3);
}

function makeMeterReading({ context, event, reading, observedAt = event.at, receivedAt = event.receivedAt, sequence = reading.sequence }) {
  return {
    sessionId: context.ids.sessionId,
    source: "virtual-charge-point-meter",
    sequence,
    value: readingToKwh(reading),
    unit: "kWh",
    measurand: "Energy.Active.Import.Register",
    quality: "synthetic",
    observedAt,
    receivedAt,
    sourceEvent: event.frameId ?? event.id,
  };
}

function addTimeline(timeline, at, kind, title, detail, status = "ok") {
  timeline.push({ order: timeline.length, at, kind, title, detail, status });
}

function executeRun(composed, options) {
  const seed = normaliseSeed(options.seed);
  const scenario = options.scenario ?? "happy-path";
  if (!SCENARIOS.some((item) => item.id === scenario)) throw new Error(`Unknown simulation scenario: ${scenario}`);

  const idRandom = createRandomStream(seed, "identity");
  const ids = {
    runId: idPart(idRandom, "RUN", 8),
    sessionId: idPart(idRandom, "S", 10),
    transactionId: idPart(idRandom, "TX", 12),
    commandId: idPart(idRandom, "CMD", 8),
    cdrId: idPart(idRandom, "CDR", 8),
    locationId: "CW-UTR-001",
    evseUid: "NL-CWZ-EVSE-001",
    evseSuffix: "001",
    meterId: "CW-VIRTUAL-METER-01",
    authorizationReference: idPart(idRandom, "AUTH", 8),
  };
  const stationId = `NL*CW*CP-${idRandom.token(4)}`;
  const tokenUid = `CW-${idRandom.token(8)}`;
  const grid = composed.adapters.inputs.grid.snapshot({ seed, scenario, ids });
  const energyRandom = createRandomStream(seed, "meter-energy");
  const energyKwh = round(9.4 + energyRandom.next() * 3.1, 3);
  const context = { seed, scenario, ids, stationId, tokenUid, grid, energyKwh, random: createRandomStream(seed, "ocpp-messages") };
  const stores = composed.stores;
  const ocpiAdapter = composed.adapters.inputs.ocpi;
  const ocppAdapter = composed.adapters.inputs.ocpp;
  const ocpiTrace = [ocpiAdapter.startSession(context)];
  const ocppResult = ocppAdapter.exchange(context);
  const ocppTrace = ocppResult.frames;
  const timeline = [];
  const applied = [];
  let session = null;
  let originalCdr = null;
  let currentEnergyKwh = energyKwh;
  const initialCost = priceFor(energyKwh, grid.energyPricePerKwh);

  addTimeline(timeline, virtualTime(1), "ocpi", "OCPI START_SESSION requested", "The virtual eMSP asks the CPO to start a session.");
  addTimeline(timeline, virtualTime(2), "ocpp", "OCPP station connected", "BootNotification and Heartbeat complete inside the browser.");
  addTimeline(timeline, virtualTime(4), "ocpp", "Remote start accepted", "The virtual station accepts RequestStartTransaction.");
  addTimeline(timeline, virtualTime(5), "ocpp", ocppResult.accepted ? "Token authorized" : "Token rejected", ocppResult.accepted ? "Authorize.conf reports Accepted." : "Authorize.conf reports Invalid.", ocppResult.accepted ? "ok" : "rejected");

  const commandResult = ocpiAdapter.commandResult(context, ocppResult.accepted ? "ACCEPTED" : "FAILED");
  ocpiTrace.push(commandResult);

  if (ocppResult.accepted) {
    for (const event of ocppResult.events.filter((item) => item.kind.startsWith("transaction."))) {
      const { nextStatus, result } = composed.adapters.process.applyEvent({
        store: stores.operational,
        event,
        sessionId: ids.sessionId,
      });
      applied.push({ id: event.id, kind: event.kind, accepted: result.accepted, duplicate: Boolean(result.duplicate), conflict: Boolean(result.conflict) });
      stores.evidence.put({
        key: `${event.frameId}:${event.id}`,
        payload: event.payload,
        source: `OCPP 2.1 · ${event.kind}`,
        occurredAt: event.at,
        receivedAt: event.receivedAt,
      });
      if (result.accepted) {
        writeSemantic(stores, context, event, nextStatus);
        writeTemporal(stores, context, event, { status: nextStatus, event: event.kind });
        if (event.reading) {
          const reading = makeMeterReading({ context, event, reading: event.reading });
          stores.telemetry.append(reading);
          const meterReadingKwh = reading.value;
          writeTemporal(stores, context, event, meterReadingKwh, `session:${ids.sessionId}:energy`);
        }
      }

      if (event.kind === "transaction.started" && result.accepted) {
        session = buildSession(context, "ACTIVE", 0, event.at, 0);
        ocpiTrace.push(ocpiAdapter.publishSession(context, session, "PUT", "ocpi-session-start"));
        addTimeline(timeline, event.at, "process", "Session became active", "Canonical transaction start mapped to an OCPI Session and operational state.");
      } else if (event.kind === "transaction.updated") {
        addTimeline(timeline, event.receivedAt, "process", result.duplicate ? "Duplicate event ignored" : "Meter update recorded", result.duplicate ? "The same transaction sequence was already applied; the process state was not applied twice." : `Meter total is ${readingToKwh(event.reading)} kWh.` , result.duplicate ? "duplicate" : "ok");
      } else if (event.kind === "transaction.ended" && result.accepted) {
        currentEnergyKwh = readingToKwh(event.reading);
        const completedAt = event.receivedAt;
        const cost = priceFor(currentEnergyKwh, grid.energyPricePerKwh);
        session = buildSession(context, "COMPLETED", currentEnergyKwh, completedAt, cost);
        ocpiTrace.push(ocpiAdapter.publishSession(context, session, "PATCH", "ocpi-session-completed"));
        originalCdr = buildCdr(context, currentEnergyKwh, completedAt);
        stores.evidence.put({
          key: `ocpi:${originalCdr.id}`,
          payload: originalCdr,
          source: "OCPI 2.3.0 · CDR fixture",
          occurredAt: completedAt,
          receivedAt: completedAt,
        });
        ocpiTrace.push(ocpiAdapter.publishCdr(context, originalCdr));
        addTimeline(timeline, event.at, "process", "Session completed and CDR created", `${currentEnergyKwh} kWh at €${grid.energyPricePerKwh.toFixed(2)}/kWh; synthetic total €${cost.toFixed(2)}.`);
      }
    }
  } else {
    for (const event of ocppResult.events) {
      stores.evidence.put({
        key: `${event.frameId}:${event.id}`,
        payload: event.payload,
        source: `OCPP 2.1 · ${event.kind}`,
        occurredAt: event.at,
        receivedAt: event.receivedAt,
      });
    }
  }

  if (ocppResult.accepted && ["late-meter", "cdr-correction"].includes(scenario)) {
    const correction = scenario === "cdr-correction";
    const endAt = virtualTime(1800);
    const observedAt = correction ? endAt : virtualTime(300);
    const receivedAt = virtualTime(1860);
    const differenceKwh = correction ? 0.4 : 0;
    const observedKwh = correction ? round(currentEnergyKwh - differenceKwh, 3) : round(energyKwh * 0.57, 3);
    const lateEvent = {
      id: correction ? "meter:corrected-end-reading" : "meter:delayed-periodic-reading",
      kind: correction ? "meter.corrected" : "meter.late",
      transactionId: ids.transactionId,
      sequence: correction ? "late-correction-1" : "late-periodic-1",
      at: observedAt,
      receivedAt,
      frameId: "synthetic-late-meter-fixture",
    };
    const lateReading = {
      sessionId: ids.sessionId,
      source: "virtual-charge-point-meter",
      sequence: lateEvent.sequence,
      value: observedKwh,
      unit: "kWh",
      measurand: "Energy.Active.Import.Register",
      quality: "synthetic-late-correction",
      observedAt,
      receivedAt,
      sourceEvent: lateEvent.id,
    };
    stores.telemetry.append(lateReading);
    stores.evidence.put({
      key: `late-meter:${lateEvent.id}`,
      payload: lateReading,
      source: "Synthetic delayed-meter fault fixture (not an OCPP frame)",
      occurredAt: observedAt,
      receivedAt,
    });
    stores.temporal.append({
      key: `session:${ids.sessionId}:energy`,
      value: observedKwh,
      validAt: observedAt,
      recordedAt: receivedAt,
      source: lateEvent.frameId,
      eventId: lateEvent.id,
      correctionOf: correction ? ids.transactionId + ":2" : undefined,
    });
    writeSemantic(stores, context, lateEvent, "COMPLETED");
    if (correction && session && originalCdr) {
      currentEnergyKwh = observedKwh;
      const correctedCost = priceFor(currentEnergyKwh, grid.energyPricePerKwh);
      session = buildSession(context, "COMPLETED", currentEnergyKwh, receivedAt, correctedCost);
      ocpiTrace.push(ocpiAdapter.publishSession(context, session, "PUT", "ocpi-session-meter-correction"));
      const creditCdr = buildCdr(context, differenceKwh, receivedAt, {
        id: `${originalCdr.id}-CR01`,
        credit: true,
        reference: originalCdr.id,
      });
      stores.evidence.put({
        key: `ocpi:${creditCdr.id}`,
        payload: creditCdr,
        source: "OCPI 2.3.0 · Credit CDR fixture",
        occurredAt: receivedAt,
        receivedAt,
      });
      ocpiTrace.push(ocpiAdapter.publishCdr(context, creditCdr, "ocpi-credit-cdr-create"));
      addTimeline(timeline, receivedAt, "correction", "Late meter correction credited", `A new credit CDR references ${originalCdr.id}; the original CDR remains in the trace.`, "corrected");
    } else {
      addTimeline(timeline, receivedAt, "telemetry", "Late meter observation retained", `Observed at ${observedAt}; received at ${receivedAt}. It does not rewrite the completed CDR.`, "late");
    }
  }

  if (!ocppResult.accepted) {
    addTimeline(timeline, virtualTime(6), "ocpi", "Start command failed at the station", "The CPO reports the station's authorization rejection through the OCPI response callback.", "rejected");
  }
  const sortedTimeline = timeline
    .map((item, index) => ({ ...item, order: index }))
    .sort((a, b) => a.at.localeCompare(b.at) || a.order - b.order)
    .map(({ order, ...item }) => item);

  const semanticRows = stores.semantic.snapshot();
  const operationalRows = stores.operational.snapshot();
  const temporalRows = stores.temporal.snapshot();
  const telemetryRows = stores.telemetry.snapshot();
  const evidenceRows = stores.evidence.snapshot();
  const cdrCount = ocpiTrace.filter((entry) => entry.path.endsWith("/cdrs") && entry.method === "POST").length;
  const completed = Boolean(session?.status === "COMPLETED");
  const contractChecks = [
    { id: "ocpp-call-frame", passed: ocppTrace.every((entry) => [2, 3].includes(entry.frame[0]) && typeof entry.frame[1] === "string"), detail: "Every virtual OCPP message is a JSON CALL or CALLRESULT frame." },
    { id: "ocpi-common-response", passed: ocpiTrace.every((entry) => entry.response.body.status_code === 1000), detail: "Each virtual OCPI HTTP response uses the common response envelope." },
    { id: "session-lifecycle", passed: !completed || operationalRows.some((row) => row.status === "COMPLETED"), detail: "A completed journey reaches the simulated operational state." },
    { id: "event-idempotency", passed: !applied.some((item) => item.duplicate) || operationalRows[0]?.history.filter((entry) => entry.eventId.endsWith(":1")).length === 1, detail: "Repeated transaction sequence numbers do not apply twice." },
    { id: "evidence-lineage", passed: evidenceRows.every((row) => row.fingerprint.startsWith("fixture-fnv1a32:")), detail: "Every retained payload has a deterministic, explicitly non-cryptographic fixture fingerprint." },
    { id: "late-arrival-time", passed: telemetryRows.every((row) => Date.parse(row.receivedAt) >= Date.parse(row.observedAt)), detail: "Telemetry keeps the observation timestamp separate from the simulated receipt time." },
  ];
  const summary = {
    status: ocppResult.accepted ? "completed" : "rejected",
    sessionId: session?.id ?? null,
    sessionStatus: session?.status ?? "NOT_CREATED",
    energyKwh: session?.kwh ?? 0,
    currency: grid.currency,
    totalCost: session?.total_cost?.excl_vat ?? 0,
    energyPricePerKwh: grid.energyPricePerKwh,
    carbonIntensityGramsPerKwh: grid.carbonIntensityGramsPerKwh,
    duplicateEventsIgnored: applied.filter((item) => item.duplicate).length,
    cdrCount,
    timelineEvents: sortedTimeline.length,
    storageRows: {
      semantic: semanticRows.length,
      operational: operationalRows.length,
      temporal: temporalRows.length,
      telemetry: telemetryRows.length,
      evidence: evidenceRows.length,
    },
  };
  const run = {
    id: ids.runId,
    simulatorVersion: SIMULATOR_VERSION,
    scenario,
    scenarioVersion: 1,
    seed,
    prngVersion: PRNG_VERSION,
    virtualClock: { mode: "fixed", startAt: RUN_START, finalAt: sortedTimeline.at(-1)?.at ?? virtualTime(5) },
    profiles: clone(PROTOCOL_PROFILES),
    composition: clone(composed.composition),
    faults: scenario === "happy-path" ? [] : [scenario],
  };
  const result = {
    run,
    summary,
    tariff: grid,
    timeline: sortedTimeline,
    protocols: { ocpp: ocppTrace, ocpi: ocpiTrace },
    stores: {
      semantic: semanticRows,
      operational: operationalRows,
      temporal: temporalRows,
      telemetry: telemetryRows,
      evidence: evidenceRows,
    },
    checks: contractChecks,
  };
  result.run.fingerprint = fixtureFingerprint(stableStringify(result));
  return result;
}

export function createRuntimeFactory() {
  const registries = defaultRegistries();
  const api = {
    registerInput(boundary, id, adapter) {
      const registry = registries.inputs[boundary];
      if (!registry) throw new Error(`Unknown input boundary: ${boundary}`);
      const required = {
        ocpp: ["exchange"],
        ocpi: ["startSession", "commandResult", "publishSession", "publishCdr"],
        grid: ["snapshot"],
      }[boundary];
      const missing = required.filter((method) => typeof adapter?.[method] !== "function");
      if (missing.length) throw new Error(`Input adapter inputs.${boundary} is missing: ${missing.join(", ")}.`);
      if (registry.has(id)) throw new Error(`Adapter already registered: inputs.${boundary}=${id}`);
      registry.set(id, adapter);
    },
    registerProcess(id, adapter) {
      if (typeof adapter?.applyEvent !== "function") throw new Error(`Process adapter ${id} must provide applyEvent().`);
      if (registries.process.has(id)) throw new Error(`Adapter already registered: process=${id}`);
      registries.process.set(id, adapter);
    },
    registerStore(type, id, adapter) {
      const registry = registries.stores[type];
      if (!registry) throw new Error(`Unknown store type: ${type}`);
      if (registry.has(id)) throw new Error(`Adapter already registered: stores.${type}=${id}`);
      if (typeof adapter.create !== "function") throw new Error(`Store adapter ${id} must provide create().`);
      registry.set(id, adapter);
    },
    availableAdapters() {
      return {
        inputs: Object.fromEntries(Object.entries(registries.inputs).map(([key, values]) => [key, [...values].map(([id, adapter]) => ({ id, label: adapter.label, description: adapter.description }))])),
        process: [...registries.process].map(([id, adapter]) => ({ id, label: adapter.label })),
        stores: Object.fromEntries(Object.entries(registries.stores).map(([key, values]) => [key, [...values].map(([id, adapter]) => ({ id, label: adapter.label }))])),
      };
    },
    compose(selection = {}) {
      const composition = mergeComposition(selection);
      const adapters = {
        inputs: {
          ocpp: lookup(registries.inputs.ocpp, "inputs.ocpp", composition.inputs.ocpp),
          ocpi: lookup(registries.inputs.ocpi, "inputs.ocpi", composition.inputs.ocpi),
          grid: lookup(registries.inputs.grid, "inputs.grid", composition.inputs.grid),
        },
        process: lookup(registries.process, "process", composition.process),
      };
      const stores = {};
      for (const type of STORE_TYPES) {
        const adapter = lookup(registries.stores[type], `stores.${type}`, composition.stores[type]);
        stores[type] = adapter.create({ type, composition: clone(composition) });
      }
      return { composition, adapters, stores };
    },
    run(options = {}) {
      return executeRun(api.compose(options.composition), options);
    },
  };
  return api;
}

export const runtimeFactory = createRuntimeFactory();

export function runSimulation(options = {}) {
  return runtimeFactory.run(options);
}
