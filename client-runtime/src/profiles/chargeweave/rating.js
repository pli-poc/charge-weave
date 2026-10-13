import { fixed, formatFixed } from "../../services/decimal.js";
export function rateReading(reading, caseData) {
  const energy = fixed(reading, 3) - fixed(caseData.meterStart, 3);
  const product = energy * fixed(caseData.tariffEurPerKwh, 5);
  const cents = (product + (product < 0n ? -500000n : 500000n)) / 1000000n;
  return {
    energyKwh: formatFixed(energy, 3),
    amountEur: formatFixed(cents, 2),
    calculationVersion: "meter-fixed-v1",
  };
}
