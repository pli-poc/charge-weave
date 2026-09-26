// These are schema field categories, not assertions about stored instance history.
export const isTime = (field) => ["dateTime", "date", "time"].includes(field.range);
export const isTimeLink = (field) =>
  field.type === "object" && ["TimeWindow", "RecurringWindow"].includes(field.range);
export function timeRole(field) {
  if (["validFrom", "validUntil"].includes(field.property)) return "Business validity";
  if (["validFromDate", "validUntilDate"].includes(field.property)) return "Calendar-date validity";
  if (["occurredAt", "observedAt"].includes(field.property)) return "Event / observation time";
  if (field.property === "receivedAt") return "Receipt time";
  if (["startsAt", "endsAt", "periodStart", "periodEnd"].includes(field.property)) return "Interval endpoint";
  if (field.range === "time") return "Local recurring time";
  return "Business timestamp";
}
