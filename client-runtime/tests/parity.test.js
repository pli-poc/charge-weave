import test from "node:test";
import assert from "node:assert/strict";
import pkg from "../generated/application.json" with { type: "json" };
import temporal from "../../model/temporal-example.json" with { type: "json" };
import { createLocalClient } from "../src/graphql/client.js";
import { selectFixture } from "../src/providers/temporal.js";
import { createPlatformProvider } from "../../console-app/src/provider.js";
import { createQuery } from "../../console-app/src/analytics/engine.js";
const provider = createPlatformProvider();
const client = createLocalClient({
  applicationPackage: pkg,
  services: {
    sites: provider.getSites,
    sessions: provider.getLiveSessions,
    task: () => {},
    submitCorrection: () => {},
    analytics: provider.queryAnalytics,
    temporal: ({ validAt, knownAt }) => {
      const r = selectFixture(temporal, validAt, knownAt);
      return { ...r, price: r.price == null ? null : String(r.price) };
    },
  },
});
test("typed analytical execution preserves weighted values, ranking and all provenance", async () => {
  for (const measure of ["energy", "availability"]) {
    const input = createQuery({ measure });
    const direct = provider.queryAnalytics(input);
    const r = await client.execute({
      query:
        "query($input:AnalyticsInput!){analytics(input:$input){rows{key label value numerator denominator count reference change percentChange} total{value numerator denominator count reference change percentChange} totalGroups field evidence measure dimension query}}",
      variables: { input },
    });
    assert.equal(r.errors, undefined, JSON.stringify(r.errors));
    assert.deepEqual(JSON.parse(JSON.stringify(r.data.analytics)), direct);
  }
});
test("all reference temporal selections survive local GraphQL projection", async () => {
  for (const e of temporal.expectedCases) {
    const r = await client.execute({
      query:
        "query($v:String!,$k:String!){temporal(validAt:$v,knownAt:$k){state price commit slice}}",
      variables: { v: e.validAt, k: e.knownAt },
    });
    assert.equal(r.errors, undefined);
    const a = r.data.temporal;
    assert.deepEqual(
      {
        state: a.state,
        price: a.price,
        commit: a.commit?.id ?? null,
        slice: a.slice?.id ?? null,
      },
      {
        state: e.state,
        price: e.price == null ? null : String(e.price),
        commit: e.commit,
        slice: e.slice,
      },
    );
  }
});
