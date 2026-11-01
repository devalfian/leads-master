/**
 * Quote Builder domain types.
 *
 * A quote references the existing lead, market and pricing records, and stores
 * its own snapshot of the client details, package and terms so a historical
 * quotation never changes when the catalog or the lead changes later.
 */

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "cancelled"] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/**
 * "Expired" is derived for display only: a sent quote whose valid-until date has
 * passed. It is never stored, so accepting a quote that is past its date stays
 * possible and an accepted quote is never shown as expired.
 */
export type QuoteDisplayStatus = QuoteStatus | "expired";

export const QUOTE_DISPLAY_STATUS_LABELS: Record<QuoteDisplayStatus, string> = {
  ...QUOTE_STATUS_LABELS,
  expired: "Expired",
};

export const QUOTE_STATUS_TONES: Record<
  QuoteDisplayStatus,
  "neutral" | "accent" | "success" | "warning" | "danger" | "info"
> = {
  draft: "neutral",
  sent: "info",
  accepted: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "warning",
};

/** Allowed status transitions. Everything else is rejected server-side. */
export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["accepted", "rejected", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: [],
};

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_STATUS_TRANSITIONS[from].includes(to);
}

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && (QUOTE_STATUSES as readonly string[]).includes(value);
}

export const QUOTE_LINE_TYPES = ["package", "custom"] as const;

export type QuoteLineType = (typeof QUOTE_LINE_TYPES)[number];

export type QuoteDiscountType = "none" | "fixed" | "percent";

/** Client details frozen with the quote. Editable on the quote, never on the lead. */
export type QuoteClientSnapshot = {
  businessName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  marketName: string | null;
  marketCode: string | null;
  nicheLabel: string | null;
};

/** Package details frozen with the quote, copied from the pricing record. */
export type QuotePackageSnapshot = {
  packageId: string;
  name: string;
  priceAmount: number;
  currencyCode: string;
  timeline: string;
  features: string[];
  isStartingPrice: boolean;
};

/**
 * Project terms. Every field is optional and only ever filled from the package
 * record or from explicit user input — this application has no configured
 * payment, warranty or legal policy to default from.
 */
export type QuoteTerms = {
  timeline: string;
  revisions: string;
  paymentTerms: string;
  hosting: string;
  domain: string;
  maintenance: string;
  exclusions: string;
  clientResponsibilities: string;
  additionalWork: string;
  notes: string;
};

export const EMPTY_QUOTE_TERMS: QuoteTerms = {
  timeline: "",
  revisions: "",
  paymentTerms: "",
  hosting: "",
  domain: "",
  maintenance: "",
  exclusions: "",
  clientResponsibilities: "",
  additionalWork: "",
  notes: "",
};

export type QuoteLineItem = {
  id: string;
  quoteId: string;
  position: number;
  lineType: QuoteLineType;
  sourcePackageId: string | null;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currencyCode: string;
};

export type QuoteStatusEvent = {
  id: string;
  fromStatus: QuoteStatus | null;
  toStatus: QuoteStatus;
  note: string | null;
  createdAt: string;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  leadId: string;
  leadBusinessName: string;
  sourceCallId: string | null;
  sourceSessionId: string | null;
  status: QuoteStatus;
  displayStatus: QuoteDisplayStatus;
  currencyCode: string;
  currencyLabel: string;
  marketId: string | null;
  marketCode: string | null;
  marketName: string | null;
  nicheLabel: string | null;
  projectTitle: string;
  projectDescription: string;
  packageId: string | null;
  client: QuoteClientSnapshot;
  packageSnapshot: QuotePackageSnapshot | null;
  terms: QuoteTerms;
  subtotalMinor: number;
  discountType: QuoteDiscountType;
  discountPercentBp: number;
  discountAmountMinor: number;
  totalMinor: number;
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: QuoteLineItem[];
};

export type QuoteDetail = Quote & {
  statusEvents: QuoteStatusEvent[];
  /** Draft only: a package price that no longer matches the catalog. */
  priceDrift: QuotePriceDrift[];
};

export type QuotePriceDrift = {
  lineItemId: string;
  description: string;
  savedUnitPriceMinor: number;
  currentUnitPriceMinor: number;
};

export type QuoteSummary = Pick<
  Quote,
  | "id"
  | "quoteNumber"
  | "leadId"
  | "leadBusinessName"
  | "status"
  | "displayStatus"
  | "currencyCode"
  | "currencyLabel"
  | "marketCode"
  | "marketName"
  | "projectTitle"
  | "totalMinor"
  | "validUntil"
  | "createdAt"
  | "updatedAt"
  | "packageSnapshot"
>;

/** A package option offered by the lead's market, read from the Pricing Library. */
export type QuotePackageOption = {
  id: string;
  name: string;
  priceAmount: number;
  isStartingPrice: boolean;
  timeline: string;
  features: string[];
  isRecommended: boolean;
};

/**
 * A lead the user can attach a quotation to, with only the packages that belong
 * to that lead's market. Both are loaded from the database on the server, so the
 * browser can never pair an Indonesian package with a US lead.
 */
export type QuoteLeadOption = {
  id: string;
  businessName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  marketId: string;
  marketCode: string;
  marketName: string;
  currencyCode: string;
  currencyLabel: string;
  nicheName: string | null;
  packages: QuotePackageOption[];
};

export type QuoteStats = {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  expiringSoon: number;
  /** Quoted value per currency. Never summed across currencies. */
  quotedByCurrency: Array<{
    currencyCode: string;
    currencyLabel: string;
    quoteCount: number;
    amountMinor: number;
  }>;
  acceptedByCurrency: Array<{
    currencyCode: string;
    currencyLabel: string;
    quoteCount: number;
    amountMinor: number;
  }>;
};