/**
 * Money arithmetic for quotations.
 *
 * Every quote amount is stored as an integer number of **minor units** of its
 * currency, so `quantity x unit price` and percentage discounts are exact. The
 * catalog stores whole major units (`A$1,200`), so those are converted once, at
 * the boundary, using the currency's exponent — never by float arithmetic on a
 * formatted string.
 *
 * There is no currency conversion anywhere in this module: one quote, one
 * currency.
 */

export type CurrencyFormat = {
  currencyCode: string;
  currencyLabel: string;
};

/**
 * ISO 4217 exponents for the currencies this application uses. Anything else
 * falls back to 2, which is the common case.
 */
const CURRENCY_EXPONENTS: Record<string, number> = {
  IDR: 0,
  AUD: 2,
  USD: 2,
};

const GROUP_SEPARATOR_BY_CURRENCY: Record<string, string> = {
  IDR: ".",
  AUD: ",",
  USD: ",",
};

export function currencyExponent(currencyCode: string): number {
  return CURRENCY_EXPONENTS[currencyCode] ?? 2;
}

export function currencySeparator(currencyCode: string): string {
  return GROUP_SEPARATOR_BY_CURRENCY[currencyCode] ?? ",";
}

/** `1200` AUD (major) -> `120000` minor units. IDR has no minor unit. */
export function toMinorUnits(amountMajor: number, currencyCode: string): number {
  if (!Number.isFinite(amountMajor) || amountMajor < 0) return 0;
  return Math.round(amountMajor * 10 ** currencyExponent(currencyCode));
}

/** `120000` AUD minor units -> `1200`. Used for display and for input parsing. */
export function toMajorUnits(amountMinor: number, currencyCode: string): number {
  const exponent = currencyExponent(currencyCode);
  if (exponent === 0) return amountMinor;
  return amountMinor / 10 ** exponent;
}

function groupDigits(digits: string, separator: string): string {
  let output = "";
  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) output += separator;
    output += digits[index];
  }
  return output;
}

/**
 * Formats minor units for display: `1500000` IDR -> `Rp1.500.000`,
 * `120000` AUD -> `A$1,200`, `9375` AUD -> `A$93.75`.
 *
 * Fractional digits appear only when the amount actually has them, so a whole
 * catalog price keeps the exact wording the pricing library uses.
 */
export function formatMinorUnits(amountMinor: number, format: CurrencyFormat): string {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) return "—";
  const exponent = currencyExponent(format.currencyCode);
  const separator = currencySeparator(format.currencyCode);
  const prefix = format.currencyLabel || `${format.currencyCode} `;

  const whole = exponent === 0 ? amountMinor : Math.trunc(amountMinor / 10 ** exponent);
  const fraction = exponent === 0 ? 0 : amountMinor % 10 ** exponent;

  const grouped = groupDigits(String(whole), separator);
  if (fraction === 0) return `${prefix}${grouped}`;

  const fractionText = String(fraction).padStart(exponent, "0").replace(/0+$/, "");
  return `${prefix}${grouped}.${fractionText}`;
}

/**
 * Parses an operator-entered amount in major units. `null` when unusable.
 *
 * Both catalog notations are accepted: Indonesian `Rp3.500.000` (dots as
 * thousands) and Australian/US `A$1,200.50` (comma thousands, dot decimal).
 * The rule is deterministic and documented rather than guessed per call site:
 *
 * - a value containing both `.` and `,` uses the right-most one as the decimal
 *   separator and drops the other as grouping;
 * - a value with several of one separator, or exactly three digits after the
 *   single one, is treated as thousands grouping;
 * - otherwise a single separator is a decimal point.
 */
export function parseMajorAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  let normalised: string;

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalIndex = Math.max(lastDot, lastComma);
    const whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
    const fraction = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "");
    normalised = fraction ? `${whole}.${fraction}` : whole;
  } else if (lastDot >= 0 || lastComma >= 0) {
    const separatorIndex = Math.max(lastDot, lastComma);
    const separator = cleaned[separatorIndex] as string;
    const occurrences = cleaned.split(separator).length - 1;
    const trailing = cleaned.slice(separatorIndex + 1);
    const isGrouping = occurrences > 1 || trailing.length === 3;
    normalised = isGrouping
      ? cleaned.replace(/[.,]/g, "")
      : `${cleaned.slice(0, separatorIndex)}.${trailing}`;
  } else {
    normalised = cleaned;
  }

  const parsed = Number(normalised);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export const MAX_QUANTITY = 999;
export const MAX_PERCENT_BP = 10_000;

export type DiscountInput =
  | { type: "none" }
  | { type: "fixed"; amountMinor: number }
  | { type: "percent"; percentBp: number };

export type PricedLine = {
  quantity: number;
  unitPriceMinor: number;
};

export type CalculatedLine = {
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type QuoteTotals = {
  lines: CalculatedLine[];
  subtotalMinor: number;
  discountType: DiscountInput["type"];
  discountPercentBp: number;
  discountAmountMinor: number;
  totalMinor: number;
};

/**
 * The single authoritative calculation, shared by the form preview, the server
 * save path, the document preview and the printed export.
 *
 * It throws on inputs that cannot produce a valid quotation (non-positive
 * quantity, negative price, discount larger than the subtotal) instead of
 * clamping them, so a caller can never persist a silently "fixed" total.
 */
export function calculateQuoteTotals(
  lines: PricedLine[],
  discount: DiscountInput = { type: "none" },
): QuoteTotals {
  const calculated: CalculatedLine[] = lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      throw new Error(`Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`);
    }
    if (!Number.isInteger(line.unitPriceMinor) || line.unitPriceMinor < 0) {
      throw new Error("Unit prices must be whole, non-negative amounts.");
    }
    const lineTotalMinor = line.quantity * line.unitPriceMinor;
    if (!Number.isSafeInteger(lineTotalMinor)) {
      throw new Error("That line total is too large to be stored safely.");
    }
    return { quantity: line.quantity, unitPriceMinor: line.unitPriceMinor, lineTotalMinor };
  });

  const subtotalMinor = calculated.reduce((total, line) => total + line.lineTotalMinor, 0);
  if (!Number.isSafeInteger(subtotalMinor)) {
    throw new Error("That subtotal is too large to be stored safely.");
  }

  let discountAmountMinor = 0;
  let discountPercentBp = 0;

  if (discount.type === "fixed") {
    if (!Number.isInteger(discount.amountMinor) || discount.amountMinor < 0) {
      throw new Error("A fixed discount must be a whole, non-negative amount.");
    }
    if (discount.amountMinor > subtotalMinor) {
      throw new Error("The discount cannot be larger than the subtotal.");
    }
    discountAmountMinor = discount.amountMinor;
  } else if (discount.type === "percent") {
    if (
      !Number.isInteger(discount.percentBp) ||
      discount.percentBp < 0 ||
      discount.percentBp > MAX_PERCENT_BP
    ) {
      throw new Error("A percentage discount must be between 0 and 100%.");
    }
    discountPercentBp = discount.percentBp;
    // Integer maths with half-up rounding: subtotal x bp / 10000.
    discountAmountMinor = Math.round((subtotalMinor * discount.percentBp) / MAX_PERCENT_BP);
    if (discountAmountMinor > subtotalMinor) discountAmountMinor = subtotalMinor;
  }

  const totalMinor = subtotalMinor - discountAmountMinor;
  if (totalMinor < 0) throw new Error("The quotation total cannot be negative.");

  return {
    lines: calculated,
    subtotalMinor,
    discountType: discount.type,
    discountPercentBp,
    discountAmountMinor,
    totalMinor,
  };
}