import { describe, expect, it } from "vitest";
import { formatMoney, isNonNegativeInteger, parseAmountInput } from "./currency";

const IDR = { currencyCode: "IDR", currencyLabel: "Rp" };
const AUD = { currencyCode: "AUD", currencyLabel: "A$" };
const USD = { currencyCode: "USD", currencyLabel: "US$" };

describe("formatMoney", () => {
  it("formats Indonesian rupiah with dot thousands separators", () => {
    expect(formatMoney(1500000, IDR)).toBe("Rp1.500.000");
    expect(formatMoney(3500000, IDR)).toBe("Rp3.500.000");
    expect(formatMoney(7500000, IDR)).toBe("Rp7.500.000");
    expect(formatMoney(0, IDR)).toBe("Rp0");
  });

  it("formats Australian dollars with comma separators", () => {
    expect(formatMoney(700, AUD)).toBe("A$700");
    expect(formatMoney(1200, AUD)).toBe("A$1,200");
    expect(formatMoney(2000, AUD)).toBe("A$2,000");
  });

  it("formats US dollars with the US$ label", () => {
    expect(formatMoney(400, USD)).toBe("US$400");
    expect(formatMoney(750, USD)).toBe("US$750");
    expect(formatMoney(1500, USD)).toBe("US$1,500");
  });

  it("appends + only for packages marked as starting prices", () => {
    expect(formatMoney(15000000, IDR, { isStartingPrice: true })).toBe("Rp15.000.000+");
    expect(formatMoney(3500, AUD, { isStartingPrice: true })).toBe("A$3,500+");
    expect(formatMoney(3000, USD, { isStartingPrice: true })).toBe("US$3,000+");
    expect(formatMoney(3000, USD)).toBe("US$3,000");
  });

  it("never formats an invalid amount", () => {
    expect(formatMoney(-1, USD)).toBe("—");
    expect(formatMoney(Number.NaN, USD)).toBe("—");
    expect(formatMoney(12.5, USD)).toBe("—");
  });

  it("uses the currency label supplied by the market record", () => {
    expect(formatMoney(1200, { currencyCode: "AUD", currencyLabel: "AU$" })).toBe("AU$1,200");
  });
});

describe("amount helpers", () => {
  it("recognises non-negative integers", () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(1500000)).toBe(true);
    expect(isNonNegativeInteger(-5)).toBe(false);
    expect(isNonNegativeInteger(1.5)).toBe(false);
    expect(isNonNegativeInteger("100")).toBe(false);
  });

  it("parses operator-entered amounts regardless of separators", () => {
    expect(parseAmountInput("Rp3.500.000")).toBe(3500000);
    expect(parseAmountInput("A$1,200")).toBe(1200);
    expect(parseAmountInput("3000+")).toBe(3000);
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("no digits")).toBeNull();
  });
});