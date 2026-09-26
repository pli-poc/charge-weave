import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_SOURCE,
  dataEntities,
  financialLines,
  filterByCountry,
  filterByQuery,
  findSite,
  formatEuro,
  getSiteMetrics,
  liveSessions,
  ownSites,
  roamingSessions,
} from "../src/data.js";
import { createPlatformProvider } from "../src/provider.js";

test("owned assets are limited to the Netherlands and Belgium fixture", () => {
  assert.deepEqual(new Set(ownSites.map((site) => site.country)), new Set(["NL", "BE"]));
  const metrics = getSiteMetrics();
  assert.equal(metrics.sites, 8);
  assert.equal(metrics.chargePoints, 230);
  assert.equal(metrics.online, 225);
  assert.equal(metrics.parkingSpaces, 1924);
});

test("Chargecard roaming shows European partner sessions separately from owned sites", () => {
  assert.ok(roamingSessions.some((session) => session.country === "Germany"));
  assert.ok(roamingSessions.some((session) => session.country === "France"));
  assert.ok(roamingSessions.every((session) => session.id.startsWith("RC-")));
  assert.ok(liveSessions.every((session) => findSite(session.siteId)));
});

test("map fixtures have sourced public venue references and European coordinates", () => {
  const records = [...ownSites, ...roamingSessions];
  assert.equal(ownSites.filter((site) => site.coordinates).length, 8);
  assert.equal(roamingSessions.filter((session) => session.coordinates).length, 6);
  for (const record of records) {
    assert.ok(record.address.trim().length > 0);
    const source = new URL(record.coordinateRef);
    assert.equal(source.hostname, "www.openstreetmap.org");
    assert.ok(Number.isFinite(record.coordinates.lat));
    assert.ok(Number.isFinite(record.coordinates.lon));
    assert.ok(record.coordinates.lat >= 48 && record.coordinates.lat <= 57);
    assert.ok(record.coordinates.lon >= 2 && record.coordinates.lon <= 17);
  }
});

test("filters are stable and country aware", () => {
  assert.equal(filterByCountry(ownSites, "BE").length, 4);
  assert.equal(filterByQuery(ownSites, "parking", ["name", "setting"]).length, 4);
  assert.equal(filterByQuery(liveSessions, "chargecard", ["access"]).length, 4);
});

test("commercial values use euros and source metadata identifies the deterministic fixture", () => {
  assert.match(formatEuro(24630.4), /€\s?24\.630,40/);
  assert.doesNotMatch(formatEuro(24630.4), /\$/);
  assert.equal(DEMO_SOURCE.mode, "synthetic");
  assert.equal(DEMO_SOURCE.seed, "cw-eu-2026-09");
  assert.ok(dataEntities.some((entity) => entity.name === "RoamingSettlement"));
  assert.ok(Math.abs(financialLines.reduce((total, line) => total + line.amount, 0) - 6237.8) < 0.005);
});

test("the console reads through an isolated synthetic provider contract", () => {
  const provider = createPlatformProvider();
  assert.equal(provider.source.mode, "synthetic");
  assert.equal(provider.getSites(), ownSites);
  assert.equal(provider.getLiveSessions(), liveSessions);
  assert.equal(provider.getFinanceLines(), financialLines);
  assert.throws(() => createPlatformProvider({ mode: "live" }), /No live provider is registered/);
});
