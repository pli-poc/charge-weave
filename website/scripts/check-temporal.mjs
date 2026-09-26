import fs from "node:fs";
import assert from "node:assert/strict";
import { selectFixture } from "../src/temporal-utils.js";
const data = JSON.parse(fs.readFileSync(new URL("../../model/temporal-example.json", import.meta.url)));
assert.ok(data.expectedCases.length >= 63);
for (const expected of data.expectedCases) {
  const actual = selectFixture(data, expected.validAt, expected.knownAt);
  assert.deepEqual({commit:actual.commit?.id ?? null,slice:actual.slice?.id ?? null,state:actual.state,price:actual.price},
    {commit:expected.commit,slice:expected.slice,state:expected.state,price:expected.price}, `${expected.validAt} / ${expected.knownAt}`);
}
assert.equal(selectFixture(data, "2026-05-02", "2027-01-01").state, "Unavailable");
console.log(`Temporal viewer: ${data.expectedCases.length} selections agree with the SPARQL fixture.`);
