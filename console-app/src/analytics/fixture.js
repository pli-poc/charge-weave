const DAY = 86400000;
const round = (value, places = 3) => Number(value.toFixed(places));

/** A repeatable illustrative year, derived from the existing owned-site fixture. */
export function createAnalyticsDataset(sites) {
  const rows = [];
  for (let day = 0; day < 365; day++) {
    const instant = Date.UTC(2026, 0, 1) + day * DAY;
    const date = new Date(instant);
    const dayKey = date.toISOString().slice(0, 10);
    const end = new Date(instant + DAY).toISOString();
    for (const [index, site] of sites.entries()) {
      const season = 1 + .16 * Math.cos((day - 22) * Math.PI * 2 / 365);
      const weekday = date.getUTCDay();
      const weekend = weekday === 0 || weekday === 6;
      const worksite = site.setting.includes("Workplace");
      const demand = weekend ? (worksite ? .47 : 1.13) : 1;
      const variation = 1 + .08 * Math.sin(day * 1.73 + index * 3.1);
      const sessionCount = Math.round(site.chargePoints * 2.4 * season * demand * variation);
      const energyKwh = round(sessionCount * (17 + index * 1.1) * (1 + .05 * Math.cos(day / 9)));
      const eligibleSeconds = site.chargePoints * 86400;
      const incident = (index === 1 && date.getUTCMonth() === 8 && day % 9 < 3) ? .11 : 0;
      const downtime = .006 + index * .0007 + .007 * Math.abs(Math.sin(day / 11 + index)) + incident;
      const availableSeconds = Math.round(eligibleSeconds * (1 - downtime));
      rows.push({
        id: `${site.id}:${dayKey}`, revision: 1, tenant: "cw-demo", day: dayKey,
        month: dayKey.slice(0, 7), start: date.toISOString(), end, recordedAt: end,
        siteId: site.id, siteName: site.name, country: site.country, setting: site.setting,
        energyKwh, sessionCount, availableSeconds, eligibleSeconds,
        netValueEur: round(energyKwh * site.tariff, 2), currency: "EUR",
      });
    }
  }
  // A delayed meter correction retains the original fact identity and knowledge time.
  const original = rows.find((row) => row.siteId === sites[0]?.id && row.day === "2026-09-15");
  if (original) rows.push({ ...original, revision: 2, recordedAt: "2026-10-03T00:00:00Z",
    energyKwh: round(original.energyKwh + 120), netValueEur: round(original.netValueEur + 120 * sites[0].tariff, 2) });
  return {
    id: "cw-owned-year-2026-v1", version: "1", tenant: "cw-demo", mode: "synthetic",
    start: "2026-01-01T00:00:00Z", completeThrough: "2027-01-01T00:00:00Z",
    recordedThrough: "2027-01-05T00:00:00Z", timezone: "UTC", sites, rows,
  };
}
