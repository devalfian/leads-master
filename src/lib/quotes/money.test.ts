import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY,
  calculateQuoteTotals,
  formatMinorUnits,
  parseMajorAmount,
  toMajorUnits,
  toMinorUnits,
} from "./money";

const IDR = { currencyCode: "IDR", currencyLabel: "Rp" };
const AUD = { currencyCode: "AUD", currencyLabel: "A$" };
const USD = { currencyCode: "USD", currencyLabel: "US$" };

describe("currency precision", () => {
  it("converts whole catalog prices to minor units per currency exponent", () => {
    expect(toMinorUnits(1_500_000, "IDR")).toBe(1_500_000);
    expect(toMinorUnits(3_500_000, "IDR")).toBe(3_500_000);
    expect(toMinorUnits(1_200, "AUD")).toBe(120_000);
    expect(toMinorUnits(750, "USD")).toBe(75_000);
    expect(toMinorUnits(3_500, "AUD")).toBe(350_000);
    expect(toMinorUnits(93.75, "AUD")).toBe(9_375);
  });

  it("round-trips minor units back to major units", () => {
    expect(toMajorUnits(120_000, "AUD")).toBe(1_200);
    expect(toMajorUnits(1_500_000, "IDR")).toBe(1_500_000);
    expect(toMajorUnits(75_000, "USD")).toBe(750);
  });
});

describe("formatting", () => {
  it("keeps each market's own notation", () => {
    expect(formatMinorUnits(1_500_000, IDR)).toBe("Rp1.500.000");
    expect(formatMinorUnits(3_500_000, IDR)).toBe("Rp3.500.000");
    expect(formatMinorUnits(700 * 100, AUD)).toBe("A$700");
    expect(formatMinorUnits(1_200 * 100, AUD)).toBe("A$1,200");
    expect(formatMinorUnits(400 * 100, USD)).toBe("US$400");
    expect(formatMinorUnits(3_000 * 100, USD)).toBe("US$3,000");
  });

  it("shows fractional digits only when the amount has them", () => {
    expect(formatMinorUnits(9_375, AUD)).toBe("A$93.75");
    expect(formatMinorUnits(120_050, USD)).toBe("US$1,200.5");
  });

  it("never formats an impossible amount as a price", () => {
    expect(formatMinorUnits(-1, USD)).toBe("—");
    expect(formatMinorUnits(1.5, USD)).toBe("—");
  });

  it("parses an operator-entered amount in either notation", () => {
    expect(parseMajorAmount("Rp3.500.000")).toBe(3_500_000);
    expect(parseMajorAmount("A$1,200")).toBe(1_200);
    expect(parseMajorAmount("1,200.50")).toBe(1_200.5);
    expect(parseMajorAmount("93.75")).toBe(93.75);
    expect(parseMajorAmount("3.500")).toBe(3_500);
    expect(parseMajorAmount(" 750 ")).toBe(750);
    expect(parseMajorAmount("")).toBeNull();
    expect(parseMajorAmount("abc")).toBeNull();
  });
});

describe("totals", () => {
  it("multiplies quantity by unit price exactly", () => {
    const totals = calculateQuoteTotals([{ quantity: 3, unitPriceMinor: 120_000 }]);
    expect(totals.subtotalMinor).toBe(360_000);
    expect(totals.totalMinor).toBe(360_000);
    expect(totals.lines[0]?.lineTotalMinor).toBe(360_000);
  });

  it("sums several lines", () => {
    const totals = calculateQuoteTotals([
      { quantity: 1, unitPriceMinor: 75_000 },
      { quantity: 2, unitPriceMinor: 25_050 },
    ]);
    expect(totals.subtotalMinor).toBe(125_100);
  });

  it("applies a percentage discount with integer maths", () => {
    const totals = calculateQuoteTotals([{ quantity: 1, unitPriceMinor: 125_100 }], {
      type: "percent",
      percentBp: 1_000,
    });
    expect(totals.discountAmountMinor).toBe(12_510);
    expect(totals.totalMinor).toBe(112_590);
  });

  it("applies a fixed discount", () => {
    const totals = calculateQuoteTotals([{ quantity: 1, unitPriceMinor: 120_000 }], {
      type: "fixed",
      amountMinor: 20_000,
    });
    expect(totals.discountAmountMinor).toBe(20_000);
    expect(totals.totalMinor).toBe(100_000);
  });

  it("refuses a discount larger than the subtotal", () => {
    expect(() =>
      calculateQuoteTotals([{ quantity: 1, unitPriceMinor: 1_000 }], {
        type: "fixed",
        amountMinor: 5_000,
      }),
    ).toThrow(/cannot be larger than the subtotal/i);
  });

  it("refuses negative prices, zero quantities and out-of-range percentages", () => {
    expect(() => calculateQuoteTotals([{ quantity: 1, unitPriceMinor: -1 }])).toThrow();
    expect(() => calculateQuoteTotals([{ quantity: 0, unitPriceMinor: 1_000 }])).toThrow();
    expect(() => calculateQuoteTotals([{ quantity: MAX_QUANTITY + 1, unitPriceMinor: 1 }])).toThrow();
    expect(() =>
      calculateQuoteTotals([{ quantity: 1, unitPriceMinor: 1_000 }], {
        type: "percent",
        percentBp: 10_001,
      }),
    ).toThrow();
  });
});