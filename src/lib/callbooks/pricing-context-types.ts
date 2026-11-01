/**
 * Client-safe shapes for the Callbook pricing context.
 *
 * Kept separate from `context.ts` so a client component can import the types
 * without pulling the server-only guide repository into the browser bundle.
 */

export type CallbookPricingPackage = {
  id: string;
  name: string;
  priceAmount: number;
  isStartingPrice: boolean;
  timeline: string;
  features: string[];
};

export type CallbookPricingContext = {
  /** `session` = frozen snapshot, `guide` = current master data, `none` = unset. */
  source: "session" | "guide" | "none";
  sourceLabel: string;
  /** Anything the caller must know before quoting (mismatch, missing niche, …). */
  note: string | null;
  market: {
    id: string;
    code: string;
    name: string;
    currencyCode: string;
    currencyLabel: string;
  } | null;
  niche: { id: string | null; name: string | null };
  packages: CallbookPricingPackage[];
  recommendedPackageId: string | null;
  specialtyRows: Array<{
    label: string;
    prices: Array<{ packageId: string; packageName: string; priceAmount: number }>;
  }>;
};