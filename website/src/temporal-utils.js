// These are schema field categories, not assertions about stored instance history.
export const isTime = (field) => ["dateTime", "date", "time"].includes(field.range);
export const isTimeLink = (field) =>
  field.type === "object" && ["TimeWindow", "RecurringWindow"].includes(field.range);
export function timeRole(field) {
  if (field.property === "recordedAt") return "Authoritative recording time";
  if (field.property === "knownAt") return "Knowledge cutoff";
  if (field.property === "validAt") return "Business-time selection";
  if (["completeThrough", "watermarkAt"].includes(field.property)) return "Projection checkpoint";
  if (field.property === "issuedAt") return "Issue time";
  if (["validFrom", "validUntil"].includes(field.property)) return "Business validity";
  if (["validFromDate", "validUntilDate"].includes(field.property)) return "Calendar-date validity";
  if (["occurredAt", "observedAt"].includes(field.property)) return "Event / observation time";
  if (field.property === "receivedAt") return "Receipt time";
  if (["startsAt", "endsAt", "periodStart", "periodEnd"].includes(field.property)) return "Interval endpoint";
  if (field.range === "time") return "Local recurring time";
  return "Business timestamp";
}

// This static selector is checked against the reference writer's SPARQL results.
// It reads the published fixture; it does not execute a live temporal endpoint.
export { selectFixture } from "../../client-runtime/src/providers/temporal.js";
