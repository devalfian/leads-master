/**
 * Money formatting.
 *
 * Prices are stored as integers in the market's native currency and are never
 * converted. The label ("Rp", "A$", "US$") comes from the market record, so the
 * source guides keep their currency distinctions. The "+" that marks a
 * starting price is derived from a separate boolean, never from the string.
 */

export type CurrencyFormat = {
  currencyCode: string;
  currencyLabel: string;
};

const GROUP_SEPARATOR_BY_CURRENCY: Record<string, string> = {
  // The Indonesian source guide writes Rp1.500.000; AUD/USD use commas.
  IDR: ".",
  AUD: ",",
  USD: ",",
};

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function groupDigits(amount: number, separator: string): string {
  const digits = Math.trunc(amount).toString();
  let output = "";
  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) output += separator;
    output += digits[index];
  }
  return output;
}

/** `1500000` + IDR -> `Rp1.500.000`, `3000` + USD + starting -> `US$3,000+`. */
export function formatMoney(
  amount: number,
  format: CurrencyFormat,
  options: { isStartingPrice?: boolean } = {},
): string {
  if (!isNonNegativeInteger(amount)) return "—";
  const separator = GROUP_SEPARATOR_BY_CURRENCY[format.currencyCode] ?? ",";
  const prefix = format.currencyLabel || `${format.currencyCode} `;
  const suffix = options.isStartingPrice ? "+" : "";
  return `${prefix}${groupDigits(amount, separator)}${suffix}`;
}

/**
 * Reads an operator-entered amount. Currency symbols, spaces and thousands
 * separators are ignored, so "Rp3.500.000", "A$1,200" and "1 200" all parse.
 * Returns `null` when the input holds no digits.
 */
export function parseAmountInput(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}