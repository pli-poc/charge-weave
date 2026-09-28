import test from "node:test";
import assert from "node:assert/strict";
import { renderGeneratedTaskForm } from "../src/task-form-renderer.js";
import { makeMeterCorrectionRun, meterCorrectionModel, rateCorrectedReading } from "../src/work-model.js";

test("the generic renderer derives labeled controls and constraints from task descriptors", () => {
  const run = makeMeterCorrectionRun();
  const html = renderGeneratedTaskForm(meterCorrectionModel.task.form, run.values);
  assert.match(html, /name="meterEnd"[^>]*type="number"/);
  assert.match(html, /min="12840\.5"/);
  assert.match(html, /kWh/);
  assert.match(html, /<select[^>]*name="reason"[^>]*><option/);
  assert.match(html, /data-mask="EV-####-####"/);
  assert.match(html, /name="operatorNote"[^>]*rows="4"/);
  assert.match(html, /ChargingSession\.meterEndReading/);
});

test("the generic renderer escapes model labels, hints, values and options", () => {
  const html = renderGeneratedTaskForm({ fields: [{
    id: "note", label: "<script>", control: "text", required: true,
    defaultValue: "<img src=x>", help: "a & b", options: [{ value: "x", label: "<b>" }],
  }] }, { note: "<img src=x>" });
  assert.doesNotMatch(html, /<script>|<img|<b>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.match(html, /a &amp; b/);
});

test("meter corrections retain the original model values and calculate the adjustment from the corrected reading", () => {
  const run = makeMeterCorrectionRun();
  assert.equal(run.status, "open");
  assert.equal(rateCorrectedReading(meterCorrectionModel.case.originalMeterEnd).amountEur, 23.43);
  assert.equal(rateCorrectedReading(meterCorrectionModel.case.proposedMeterEnd).amountEur, 23.21);
  assert.equal(rateCorrectedReading(12882.9).amountEur, 23.32);
});
