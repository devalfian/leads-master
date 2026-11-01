/**
 * Server-only data access for quotations.
 *
 * Quotes reference the existing lead, market and package records. The amounts,
 * client details, package description and terms are snapshotted onto the quote so
 * a historical document never changes when the catalog or the lead changes.
 *
 * Every write recalculates totals here, on the server, with the shared
 * `calculateQuoteTotals()` utility. A total submitted by the browser is ignored.
 */

import { getDb, RepositoryError } from "@/lib/db";
import type { SqlStatement, SqlValue } from "@/lib/db";
import { calculateQuoteTotals, toMinorUnits, type DiscountInput } from "./money";
import {
  EMPTY_QUOTE_TERMS,
  canTransitionQuote,
  isQuoteStatus,
  type Quote,
  type QuoteClientSnapshot,
  type QuoteDetail,
  type QuoteLineItem,
  type QuotePackageSnapshot,
  type QuotePriceDrift,
  type QuoteStats,
  type QuoteStatus,
  type QuoteStatusEvent,
  type QuoteSummary,
  type QuoteTerms,
} from "./types";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Row mapping                                                                */
/* -------------------------------------------------------------------------- */

const QUOTE_SELECT = `
  SELECT q.*, l.business_name AS lead_business_name
    FROM quotes q
    JOIN leads l ON l.id = q.lead_id
`;

function toQuote(row: Row, lineItems: QuoteLineItem[]): Quote {
  const status = isQuoteStatus(row["status"]) ? row["status"] : "draft";
  const validUntil = nullableStr(row["valid_until"]);
  const discountType = row["discount_type"];
  return {
    id: str(row["id"]),
    quoteNumber: str(row["quote_number"]),
    leadId: str(row["lead_id"]),
    leadBusinessName: str(row["lead_business_name"]),
    sourceCallId: nullableStr(row["source_call_id"]),
    sourceSessionId: nullableStr(row["source_session_id"]),
    status,
    displayStatus: displayStatusOf(status, validUntil),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    marketId: nullableStr(row["market_id"]),
    marketCode: nullableStr(row["market_code"]),
    marketName: nullableStr(row["market_name"]),
    nicheLabel: nullableStr(row["niche_label"]),
    projectTitle: str(row["project_title"]),
    projectDescription: str(row["project_description"]),
    packageId: nullableStr(row["package_id"]),
    client: parseClientSnapshot(row["client_snapshot_json"]),
    packageSnapshot: parsePackageSnapshot(row["package_snapshot_json"]),
    terms: parseTerms(row["terms_json"]),
    subtotalMinor: num(row["subtotal_minor"]),
    discountType:
      discountType === "fixed" || discountType === "percent" ? discountType : "none",
    discountPercentBp: num(row["discount_percent_bp"]),
    discountAmountMinor: num(row["discount_amount_minor"]),
    totalMinor: num(row["total_minor"]),
    validUntil,
    sentAt: nullableStr(row["sent_at"]),
    acceptedAt: nullableStr(row["accepted_at"]),
    rejectedAt: nullableStr(row["rejected_at"]),
    cancelledAt: nullableStr(row["cancelled_at"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
    lineItems,
  };
}

function toLineItem(row: Row): QuoteLineItem {
  const lineType = row["line_type"] === "custom" ? "custom" : "package";
  return {
    id: str(row["id"]),
    quoteId: str(row["quote_id"]),
    position: num(row["position"]),
    lineType,
    sourcePackageId: nullableStr(row["source_package_id"]),
    description: str(row["description"]),
    quantity: num(row["quantity"], 1),
    unitPriceMinor: num(row["unit_price_minor"]),
    lineTotalMinor: num(row["line_total_minor"]),
    currencyCode: str(row["currency_code"]),
  };
}

function toStatusEvent(row: Row): QuoteStatusEvent {
  const from = row["from_status"];
  const to = row["to_status"];
  return {
    id: str(row["id"]),
    fromStatus: isQuoteStatus(from) ? from : null,
    toStatus: isQuoteStatus(to) ? to : "draft",
    note: nullableStr(row["note"]),
    createdAt: str(row["created_at"]),
  };
}

function toSummary(row: Row): QuoteSummary {
  const status = isQuoteStatus(row["status"]) ? row["status"] : "draft";
  const validUntil = nullableStr(row["valid_until"]);
  return {
    id: str(row["id"]),
    quoteNumber: str(row["quote_number"]),
    leadId: str(row["lead_id"]),
    leadBusinessName: str(row["lead_business_name"]),
    status,
    displayStatus: displayStatusOf(status, validUntil),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    marketCode: nullableStr(row["market_code"]),
    marketName: nullableStr(row["market_name"]),
    projectTitle: str(row["project_title"]),
    totalMinor: num(row["total_minor"]),
    validUntil,
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
    packageSnapshot: parsePackageSnapshot(row["package_snapshot_json"]),
  };
}

function parseClientSnapshot(raw: unknown): QuoteClientSnapshot {
  if (typeof raw !== "string") return emptyClientSnapshot();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyClientSnapshot();
    const value = parsed as Record<string, unknown>;
    return {
      businessName: str(value["businessName"]),
      contactName: nullableStr(value["contactName"]),
      email: nullableStr(value["email"]),
      phone: nullableStr(value["phone"]),
      address: nullableStr(value["address"]),
      city: nullableStr(value["city"]),
      marketName: nullableStr(value["marketName"]),
      marketCode: nullableStr(value["marketCode"]),
      nicheLabel: nullableStr(value["nicheLabel"]),
    };
  } catch {
    return emptyClientSnapshot();
  }
}

function emptyClientSnapshot(): QuoteClientSnapshot {
  return {
    businessName: "",
    contactName: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    marketName: null,
    marketCode: null,
    nicheLabel: null,
  };
}

function parsePackageSnapshot(raw: unknown): QuotePackageSnapshot | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Record<string, unknown>;
    const packageId = nullableStr(value["packageId"]);
    const name = str(value["name"]);
    if (!packageId || !name) return null;
    return {
      packageId,
      name,
      priceAmount: num(value["priceAmount"]),
      currencyCode: str(value["currencyCode"]),
      timeline: str(value["timeline"]),
      features: Array.isArray(value["features"])
        ? value["features"].filter((entry): entry is string => typeof entry === "string")
        : [],
      isStartingPrice: value["isStartingPrice"] === true,
    };
  } catch {
    return null;
  }
}

function parseTerms(raw: unknown): QuoteTerms {
  if (typeof raw !== "string" || raw.length === 0) return { ...EMPTY_QUOTE_TERMS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_QUOTE_TERMS };
    const value = parsed as Record<string, unknown>;
    const terms = { ...EMPTY_QUOTE_TERMS };
    for (const key of Object.keys(EMPTY_QUOTE_TERMS) as Array<keyof QuoteTerms>) {
      terms[key] = str(value[key]);
    }
    return terms;
  } catch {
    return { ...EMPTY_QUOTE_TERMS };
  }
}

/**
 * Display status. "Expired" is derived, never stored: a quote that is still
 * marked *sent* but whose valid-until date has passed reads as expired. An
 * accepted, rejected or cancelled quote is never shown as expired.
 */
export function displayStatusOf(
  status: QuoteStatus,
  validUntil: string | null,
): QuoteStatus | "expired" {
  if (status !== "sent" || !validUntil) return status;
  return validUntil < todayIso() ? "expired" : "sent";
}

export function isQuoteExpired(status: QuoteStatus, validUntil: string | null): boolean {
  return displayStatusOf(status, validUntil) === "expired";
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Allocates the next quote number for the current year.
 *
 * The counter row is incremented with a single atomic UPSERT ... RETURNING, so two
 * concurrent requests can never receive the same number and the sequence is never
 * derived from `COUNT(*)`.
 */
export async function allocateQuoteNumber(year = new Date().getUTCFullYear()): Promise<string> {
  const db = await getDb();
  const key = String(year);
  const row = await db.first<Row>(
    `INSERT INTO quote_number_counters (year, last_value) VALUES (?, 1)
       ON CONFLICT (year) DO UPDATE SET last_value = last_value + 1
       RETURNING last_value`,
    [key],
  );
  const value = num(row?.["last_value"]);
  if (value < 1) {
    throw new RepositoryError("not_saved", "A quote number could not be allocated. Try again.");
  }
  return `DLC-${key}-${String(value).padStart(4, "0")}`;
}

export type QuoteLineInput =
  | { lineType: "package"; sourcePackageId: string; quantity: number }
  | { lineType: "custom"; description: string; quantity: number; unitPriceMajor: number };

export type QuoteDiscountInput =
  | { type: "none" }
  | { type: "fixed"; amountMajor: number }
  | { type: "percent"; percentBp: number };

export type QuoteWriteInput = {
  leadId: string;
  primaryPackageId: string;
  additionalLines: QuoteLineInput[];
  projectTitle: string;
  projectDescription?: string;
  client?: Partial<QuoteClientSnapshot>;
  terms?: Partial<QuoteTerms>;
  discount?: QuoteDiscountInput;
  validUntil?: string | null;
  sourceCallId?: string | null;
  sourceSessionId?: string | null;
};

type LeadContext = {
  leadId: string;
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
  nicheLabel: string | null;
};

type PackageRecord = {
  id: string;
  marketId: string;
  name: string;
  priceAmount: number;
  currencyCode: string;
  timeline: string;
  features: string[];
  isStartingPrice: boolean;
};

async function resolveLeadContext(leadId: string): Promise<LeadContext> {
  const db = await getDb();
  const row = await db.first<Row>(
    `SELECT l.id, l.business_name, l.contact_name, l.email, l.phone, l.address, l.city,
            l.market_id, m.code AS market_code, m.name AS market_name,
            m.currency_code, m.currency_label, nc.name AS niche_name
       FROM leads l
       JOIN markets m ON m.id = l.market_id
       LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
      WHERE l.id = ?`,
    [leadId],
  );
  if (!row) {
    throw new RepositoryError("not_found", "That lead no longer exists.");
  }
  return {
    leadId: str(row["id"]),
    businessName: str(row["business_name"]),
    contactName: nullableStr(row["contact_name"]),
    email: nullableStr(row["email"]),
    phone: nullableStr(row["phone"]),
    address: nullableStr(row["address"]),
    city: nullableStr(row["city"]),
    marketId: str(row["market_id"]),
    marketCode: str(row["market_code"]),
    marketName: str(row["market_name"]),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    nicheLabel: nullableStr(row["niche_name"]),
  };
}

async function resolvePackage(packageId: string, marketId: string): Promise<PackageRecord> {
  const db = await getDb();
  const row = await db.first<Row>(
    `SELECT p.id, p.market_id, p.name, p.price_amount, p.timeline, p.is_starting_price,
            m.currency_code
       FROM packages p
       JOIN markets m ON m.id = p.market_id
      WHERE p.id = ? AND p.is_active = 1`,
    [packageId],
  );
  if (!row) {
    throw new RepositoryError("invalid_reference", "That package is no longer available.");
  }
  if (str(row["market_id"]) !== marketId) {
    throw new RepositoryError(
      "invalid_reference",
      "That package belongs to a different market than this lead.",
    );
  }
  const features = await db.all<Row>(
    "SELECT feature_text FROM package_features WHERE package_id = ? ORDER BY sort_order",
    [packageId],
  );
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    name: str(row["name"]),
    priceAmount: num(row["price_amount"]),
    currencyCode: str(row["currency_code"]),
    timeline: str(row["timeline"]),
    features: features.map((feature) => str(feature["feature_text"])),
    isStartingPrice: row["is_starting_price"] === 1,
  };
}

export type QuoteListFilters = {
  query?: string;
  status?: string | null;
  marketCode?: string | null;
  currencyCode?: string | null;
  from?: string | null;
  to?: string | null;
  leadId?: string | null;
  page?: number;
  pageSize?: number;
};

export const QUOTE_PAGE_SIZE = 25;

export async function listQuotes(filters: QuoteListFilters = {}): Promise<{
  quotes: QuoteSummary[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = await getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? QUOTE_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);

  const where: string[] = [];
  const params: SqlValue[] = [];

  if (filters.status) {
    where.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters.marketCode) {
    where.push("t.market_code = ?");
    params.push(filters.marketCode);
  }
  if (filters.currencyCode) {
    where.push("t.currency_code = ?");
    params.push(filters.currencyCode);
  }
  if (filters.leadId) {
    where.push("t.lead_id = ?");
    params.push(filters.leadId);
  }
  if (filters.from) {
    where.push("substr(t.created_at, 1, 10) >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("substr(t.created_at, 1, 10) <= ?");
    params.push(filters.to);
  }

  const needle = filters.query?.trim().toLowerCase();
  if (needle) {
    const like = `%${needle}%`;
    where.push(
      `(lower(t.quote_number) LIKE ?
        OR lower(t.lead_business_name) LIKE ?
        OR lower(t.project_title) LIKE ?
        OR lower(COALESCE(t.client_snapshot_json, '')) LIKE ?)`,
    );
    params.push(like, like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await db.first<Row>(
    `SELECT COUNT(*) AS total FROM (${QUOTE_SELECT}) AS t ${whereSql}`,
    params,
  );

  const rows = await db.all<Row>(
    `SELECT * FROM (${QUOTE_SELECT}) AS t ${whereSql}
      ORDER BY t.created_at DESC, t.id ASC
      LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );

  return {
    quotes: rows.map(toSummary),
    total: num(totalRow?.["total"]),
    page,
    pageSize,
  };
}

async function loadLineItems(quoteId: string): Promise<QuoteLineItem[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    "SELECT * FROM quote_line_items WHERE quote_id = ? ORDER BY position ASC",
    [quoteId],
  );
  return rows.map(toLineItem);
}

/** Draft-only: which package lines no longer match the current catalog price. */
async function loadPriceDrift(quote: Quote): Promise<QuotePriceDrift[]> {
  if (quote.status !== "draft") return [];
  const db = await getDb();
  const drift: QuotePriceDrift[] = [];

  for (const line of quote.lineItems) {
    if (line.lineType !== "package" || !line.sourcePackageId) continue;
    const product = await db.first<Row>(
      `SELECT p.price_amount, m.currency_code
         FROM packages p
         JOIN markets m ON m.id = p.market_id
        WHERE p.id = ?`,
      [line.sourcePackageId],
    );
    if (!product) continue;
    const currentMinor = toMinorUnits(num(product["price_amount"]), str(product["currency_code"]));
    if (currentMinor !== line.unitPriceMinor) {
      drift.push({
        lineItemId: line.id,
        description: line.description,
        savedUnitPriceMinor: line.unitPriceMinor,
        currentUnitPriceMinor: currentMinor,
      });
    }
  }

  return drift;
}

export async function getQuote(id: string): Promise<QuoteDetail | null> {
  const db = await getDb();
  const row = await db.first<Row>(`${QUOTE_SELECT} WHERE q.id = ?`, [id]);
  if (!row) return null;

  const [lineItems, eventRows] = await Promise.all([
    loadLineItems(id),
    db.all<Row>(
      "SELECT * FROM quote_status_events WHERE quote_id = ? ORDER BY created_at ASC",
      [id],
    ),
  ]);

  const quote = toQuote(row, lineItems);
  const priceDrift = await loadPriceDrift(quote);

  return {
    ...quote,
    statusEvents: eventRows.map(toStatusEvent),
    priceDrift,
  };
}

export async function listQuotesForLead(leadId: string): Promise<QuoteSummary[]> {
  const result = await listQuotes({ leadId, pageSize: 50 });
  return result.quotes;
}

/**
 * Summary figures. "Quoted" and "Accepted" are sums of quote totals grouped by
 * currency; they are never added across currencies, and an accepted quote is not
 * revenue — this application stores no payment record.
 */
export async function getQuoteStats(): Promise<QuoteStats> {
  const db = await getDb();
  const today = todayIso();
  const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  const [statusRows, expiringRow, quotedRows, acceptedRows] = await Promise.all([
    db.all<Row>("SELECT status, COUNT(*) AS total FROM quotes GROUP BY status"),
    db.first<Row>(
      `SELECT COUNT(*) AS total FROM quotes
        WHERE status = 'sent' AND valid_until IS NOT NULL
          AND valid_until >= ? AND valid_until <= ?`,
      [today, soon],
    ),
    db.all<Row>(
      `SELECT currency_code, currency_label, COUNT(*) AS quote_count,
              COALESCE(SUM(total_minor), 0) AS amount
         FROM quotes
        WHERE status <> 'cancelled'
        GROUP BY currency_code
        ORDER BY currency_code`,
    ),
    db.all<Row>(
      `SELECT currency_code, currency_label, COUNT(*) AS quote_count,
              COALESCE(SUM(total_minor), 0) AS amount
         FROM quotes
        WHERE status = 'accepted'
        GROUP BY currency_code
        ORDER BY currency_code`,
    ),
  ]);

  const countFor = (status: QuoteStatus): number =>
    num(statusRows.find((row) => str(row["status"]) === status)?.["total"]);

  const toCurrencyRows = (rows: Row[]) =>
    rows.map((row) => ({
      currencyCode: str(row["currency_code"]),
      currencyLabel: str(row["currency_label"]),
      quoteCount: num(row["quote_count"]),
      amountMinor: num(row["amount"]),
    }));

  return {
    total: statusRows.reduce((total, row) => total + num(row["total"]), 0),
    draft: countFor("draft"),
    sent: countFor("sent"),
    accepted: countFor("accepted"),
    rejected: countFor("rejected"),
    cancelled: countFor("cancelled"),
    expiringSoon: num(expiringRow?.["total"]),
    quotedByCurrency: toCurrencyRows(quotedRows),
    acceptedByCurrency: toCurrencyRows(acceptedRows),
  };
}

/* -------------------------------------------------------------------------- */
/* Quote persistence                                                          */
/* -------------------------------------------------------------------------- */

type ResolvedLine = {
  lineType: "package" | "custom";
  sourcePackageId: string | null;
  description: string;
  quantity: number;
  unitPriceMinor: number;
};

function discountToInput(
  discount: QuoteDiscountInput | undefined,
  currencyCode: string,
): DiscountInput {
  if (!discount || discount.type === "none") return { type: "none" };
  if (discount.type === "fixed") {
    return { type: "fixed", amountMinor: toMinorUnits(discount.amountMajor, currencyCode) };
  }
  return { type: "percent", percentBp: discount.percentBp };
}

function sanitizeTerms(input: Partial<QuoteTerms> | undefined, fallback: QuoteTerms): QuoteTerms {
  const terms = { ...fallback };
  if (!input) return terms;
  for (const key of Object.keys(EMPTY_QUOTE_TERMS) as Array<keyof QuoteTerms>) {
    const value = input[key];
    if (typeof value === "string") terms[key] = value.trim().slice(0, 2000);
  }
  return terms;
}

function sanitizeClient(
  lead: LeadContext,
  overrides: Partial<QuoteClientSnapshot> | undefined,
): QuoteClientSnapshot {
  const pick = (key: keyof QuoteClientSnapshot, fallbackValue: string | null): string | null => {
    const override = overrides?.[key];
    if (typeof override === "string") {
      const trimmed = override.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 200) : null;
    }
    return fallbackValue;
  };

  const businessOverride = overrides?.businessName;
  const businessName =
    typeof businessOverride === "string" && businessOverride.trim().length > 0
      ? businessOverride.trim().slice(0, 160)
      : lead.businessName;

  return {
    businessName,
    contactName: pick("contactName", lead.contactName),
    email: pick("email", lead.email),
    phone: pick("phone", lead.phone),
    address: pick("address", lead.address),
    city: pick("city", lead.city),
    marketName: lead.marketName,
    marketCode: lead.marketCode,
    nicheLabel: lead.nicheLabel,
  };
}

/**
 * Turns the submitted scope into priced lines, then recalculates everything.
 *
 * Package lines always take their price from the pricing database, except when the
 * same package already existed on this draft: then the saved price is kept, so
 * editing a draft never silently re-prices it. Updating a price requires the
 * explicit refresh action.
 */
async function buildLines({
  lead,
  input,
  previousLines,
}: {
  lead: LeadContext;
  input: QuoteWriteInput;
  previousLines: QuoteLineItem[];
}): Promise<{
  lines: ResolvedLine[];
  primaryPackage: PackageRecord;
  totals: ReturnType<typeof calculateQuoteTotals>;
}> {
  const primaryPackage = await resolvePackage(input.primaryPackageId, lead.marketId);
  if (primaryPackage.currencyCode !== lead.currencyCode) {
    throw new RepositoryError(
      "invalid_reference",
      "That package is priced in a different currency than this market.",
    );
  }

  const savedPriceFor = (packageId: string): number | null => {
    const match = previousLines.find(
      (line) => line.lineType === "package" && line.sourcePackageId === packageId,
    );
    return match ? match.unitPriceMinor : null;
  };

  const lines: ResolvedLine[] = [
    {
      lineType: "package",
      sourcePackageId: primaryPackage.id,
      description: primaryPackage.name,
      quantity: 1,
      unitPriceMinor:
        savedPriceFor(primaryPackage.id) ??
        toMinorUnits(primaryPackage.priceAmount, lead.currencyCode),
    },
  ];

  for (const extra of input.additionalLines ?? []) {
    if (extra.lineType === "package") {
      const product = await resolvePackage(extra.sourcePackageId, lead.marketId);
      if (product.currencyCode !== lead.currencyCode) {
        throw new RepositoryError(
          "invalid_reference",
          `"${product.name}" is priced in ${product.currencyCode}, but this quote is in ${lead.currencyCode}.`,
        );
      }
      lines.push({
        lineType: "package",
        sourcePackageId: product.id,
        description: product.name,
        quantity: extra.quantity,
        unitPriceMinor:
          savedPriceFor(product.id) ?? toMinorUnits(product.priceAmount, lead.currencyCode),
      });
      continue;
    }

    if (!extra.description.trim()) {
      throw new RepositoryError("invalid_input", "Give every custom line a description.");
    }
    lines.push({
      lineType: "custom",
      sourcePackageId: null,
      description: extra.description.trim().slice(0, 200),
      quantity: extra.quantity,
      unitPriceMinor: toMinorUnits(extra.unitPriceMajor, lead.currencyCode),
    });
  }

  let totals: ReturnType<typeof calculateQuoteTotals>;
  try {
    totals = calculateQuoteTotals(
      lines.map((line) => ({
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
      })),
      discountToInput(input.discount, lead.currencyCode),
    );
  } catch (error) {
    throw new RepositoryError(
      "invalid_input",
      error instanceof Error ? error.message : "The quotation totals are not valid.",
    );
  }

  return { lines, primaryPackage, totals };
}

function lineInsertStatements(
  quoteId: string,
  lines: ResolvedLine[],
  totals: ReturnType<typeof calculateQuoteTotals>,
  currencyCode: string,
  now: string,
): SqlStatement[] {
  return lines.map((line, index) => ({
    sql: `INSERT INTO quote_line_items
            (id, quote_id, position, line_type, source_package_id, description, quantity,
             unit_price_minor, line_total_minor, currency_code, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      createId("qline"),
      quoteId,
      index,
      line.lineType,
      line.sourcePackageId,
      line.description,
      line.quantity,
      line.unitPriceMinor,
      totals.lines[index]?.lineTotalMinor ?? 0,
      currencyCode,
      now,
      now,
    ],
  }));
}

function assertDateOnly(value: string | null | undefined, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(new Date(trimmed).getTime())) {
    throw new RepositoryError("invalid_input", `${field} must be a valid date.`);
  }
  return trimmed;
}

async function assertProvenance(
  leadId: string,
  sourceCallId: string | null | undefined,
  sourceSessionId: string | null | undefined,
): Promise<void> {
  const db = await getDb();
  if (sourceCallId) {
    const call = await db.first<Row>("SELECT lead_id FROM lead_calls WHERE id = ?", [sourceCallId]);
    if (!call) {
      throw new RepositoryError("invalid_reference", "That call no longer exists.");
    }
    if (str(call["lead_id"]) !== leadId) {
      throw new RepositoryError("invalid_reference", "That call belongs to a different lead.");
    }
  }
  if (sourceSessionId) {
    const session = await db.first<Row>("SELECT lead_id FROM call_sessions WHERE id = ?", [
      sourceSessionId,
    ]);
    if (!session) {
      throw new RepositoryError("invalid_reference", "That call session no longer exists.");
    }
    if (nullableStr(session["lead_id"]) !== leadId) {
      throw new RepositoryError(
        "invalid_reference",
        "That call session belongs to a different lead.",
      );
    }
  }
}

function packageSnapshotOf(product: PackageRecord): QuotePackageSnapshot {
  return {
    packageId: product.id,
    name: product.name,
    priceAmount: product.priceAmount,
    currencyCode: product.currencyCode,
    timeline: product.timeline,
    features: [...product.features],
    isStartingPrice: product.isStartingPrice,
  };
}

export async function createQuote(input: QuoteWriteInput): Promise<QuoteDetail> {
  const lead = await resolveLeadContext(input.leadId);
  if (!input.projectTitle.trim()) {
    throw new RepositoryError("invalid_input", "Give this quotation a project title.");
  }
  const validUntil = assertDateOnly(input.validUntil, "The valid-until date");
  await assertProvenance(lead.leadId, input.sourceCallId, input.sourceSessionId);

  const { lines, primaryPackage, totals } = await buildLines({
    lead,
    input,
    previousLines: [],
  });

  const db = await getDb();
  const id = createId("quote");
  const quoteNumber = await allocateQuoteNumber();
  const now = nowIso();
  const client = sanitizeClient(lead, input.client);
  const terms = sanitizeTerms(input.terms, { ...EMPTY_QUOTE_TERMS, timeline: primaryPackage.timeline });

  await db.batch([
    {
      sql: `INSERT INTO quotes
              (id, quote_number, lead_id, source_call_id, source_session_id, status,
               currency_code, currency_label, market_id, market_code, market_name, niche_label,
               project_title, project_description, package_id, client_snapshot_json,
               package_snapshot_json, terms_json, subtotal_minor, discount_type,
               discount_percent_bp, discount_amount_minor, total_minor, valid_until,
               created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        id,
        quoteNumber,
        lead.leadId,
        input.sourceCallId ?? null,
        input.sourceSessionId ?? null,
        lead.currencyCode,
        lead.currencyLabel,
        lead.marketId,
        lead.marketCode,
        lead.marketName,
        lead.nicheLabel,
        input.projectTitle.trim().slice(0, 160),
        (input.projectDescription ?? "").trim().slice(0, 2000),
        primaryPackage.id,
        JSON.stringify(client),
        JSON.stringify(packageSnapshotOf(primaryPackage)),
        JSON.stringify(terms),
        totals.subtotalMinor,
        totals.discountType,
        totals.discountPercentBp,
        totals.discountAmountMinor,
        totals.totalMinor,
        validUntil,
        now,
        now,
      ],
    },
    ...lineInsertStatements(id, lines, totals, lead.currencyCode, now),
    {
      sql: `INSERT INTO quote_status_events (id, quote_id, from_status, to_status, note, created_at)
            VALUES (?, ?, NULL, 'draft', ?, ?)`,
      params: [createId("qevt"), id, "Quotation created", now],
    },
  ]);

  const created = await getQuote(id);
  if (!created) {
    throw new RepositoryError("not_saved", "The quotation could not be read back after saving.");
  }
  return created;
}

/**
 * Updates a draft in place.
 *
 * Sent, accepted, rejected and cancelled quotations are immutable: a change of
 * scope after a quote left the building must be a new quotation (use duplicate),
 * so the document the client received can never be silently rewritten.
 */
export async function updateQuote(id: string, input: QuoteWriteInput): Promise<QuoteDetail> {
  const existing = await getQuote(id);
  if (!existing) throw new RepositoryError("not_found", "That quotation no longer exists.");
  if (existing.status !== "draft") {
    throw new RepositoryError(
      "quote_locked",
      "This quotation has already been marked as sent. Duplicate it to create a new version.",
    );
  }
  if (input.leadId !== existing.leadId) {
    throw new RepositoryError(
      "invalid_input",
      "The client on an existing quotation cannot be swapped. Duplicate it instead.",
    );
  }
  if (!input.projectTitle.trim()) {
    throw new RepositoryError("invalid_input", "Give this quotation a project title.");
  }

  const lead = await resolveLeadContext(input.leadId);
  const validUntil = assertDateOnly(input.validUntil, "The valid-until date");
  await assertProvenance(lead.leadId, input.sourceCallId, input.sourceSessionId);

  const { lines, primaryPackage, totals } = await buildLines({
    lead,
    input,
    previousLines: existing.lineItems,
  });

  const db = await getDb();
  const now = nowIso();
  const client = sanitizeClient(lead, input.client);
  const terms = sanitizeTerms(input.terms, existing.terms);

  await db.batch([
    {
      sql: `UPDATE quotes
               SET project_title = ?, project_description = ?, package_id = ?,
                   client_snapshot_json = ?, package_snapshot_json = ?, terms_json = ?,
                   subtotal_minor = ?, discount_type = ?, discount_percent_bp = ?,
                   discount_amount_minor = ?, total_minor = ?, valid_until = ?,
                   source_call_id = ?, source_session_id = ?, updated_at = ?
             WHERE id = ?`,
      params: [
        input.projectTitle.trim().slice(0, 160),
        (input.projectDescription ?? "").trim().slice(0, 2000),
        primaryPackage.id,
        JSON.stringify(client),
        JSON.stringify(packageSnapshotOf(primaryPackage)),
        JSON.stringify(terms),
        totals.subtotalMinor,
        totals.discountType,
        totals.discountPercentBp,
        totals.discountAmountMinor,
        totals.totalMinor,
        validUntil,
        input.sourceCallId ?? existing.sourceCallId,
        input.sourceSessionId ?? existing.sourceSessionId,
        now,
        id,
      ],
    },
    { sql: "DELETE FROM quote_line_items WHERE quote_id = ?", params: [id] },
    ...lineInsertStatements(id, lines, totals, lead.currencyCode, now),
  ]);

  const updated = await getQuote(id);
  if (!updated) {
    throw new RepositoryError("not_saved", "The quotation could not be read back after saving.");
  }
  return updated;
}

const STATUS_TIMESTAMP_COLUMN: Record<QuoteStatus, string | null> = {
  draft: null,
  sent: "sent_at",
  accepted: "accepted_at",
  rejected: "rejected_at",
  cancelled: "cancelled_at",
};

/**
 * Records a status change the user explicitly made. Transitions are checked
 * against the lifecycle map, so a quote cannot jump from draft to accepted or be
 * moved out of a terminal state.
 */
export async function setQuoteStatus(
  id: string,
  status: QuoteStatus,
  note?: string | null,
): Promise<QuoteDetail> {
  const existing = await getQuote(id);
  if (!existing) throw new RepositoryError("not_found", "That quotation no longer exists.");
  if (!isQuoteStatus(status)) {
    throw new RepositoryError("invalid_status", "That quotation status is not recognised.");
  }
  if (status === existing.status) {
    throw new RepositoryError("invalid_status", "This quotation already has that status.");
  }
  if (!canTransitionQuote(existing.status, status)) {
    throw new RepositoryError(
      "invalid_status",
      `A ${existing.status} quotation cannot be marked as ${status}.`,
    );
  }

  const db = await getDb();
  const now = nowIso();
  const column = STATUS_TIMESTAMP_COLUMN[status];

  const statements: SqlStatement[] = [
    {
      sql: column
        ? `UPDATE quotes SET status = ?, ${column} = ?, updated_at = ? WHERE id = ?`
        : "UPDATE quotes SET status = ?, updated_at = ? WHERE id = ?",
      params: column ? [status, now, now, id] : [status, now, id],
    },
    {
      sql: `INSERT INTO quote_status_events (id, quote_id, from_status, to_status, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        createId("qevt"),
        id,
        existing.status,
        status,
        (note ?? "").trim().slice(0, 500) || null,
        now,
      ],
    },
  ];

  await db.batch(statements);

  const updated = await getQuote(id);
  if (!updated) {
    throw new RepositoryError("not_saved", "The quotation could not be read back after saving.");
  }
  return updated;
}

/**
 * Copies a quotation into a new draft.
 *
 * The new quote gets its own number, keeps the saved line items and snapshot
 * prices as a starting point, and never inherits the source quote's sent,
 * accepted or rejected state — those are events, not content.
 */
export async function duplicateQuote(id: string): Promise<QuoteDetail> {
  const source = await getQuote(id);
  if (!source) throw new RepositoryError("not_found", "That quotation no longer exists.");

  const lead = await resolveLeadContext(source.leadId);
  if (lead.currencyCode !== source.currencyCode) {
    throw new RepositoryError(
      "invalid_reference",
      "This lead's market currency has changed since the quotation was created. Create a new quotation instead.",
    );
  }

  const db = await getDb();
  const newId = createId("quote");
  const quoteNumber = await allocateQuoteNumber();
  const now = nowIso();

  await db.batch([
    {
      sql: `INSERT INTO quotes
              (id, quote_number, lead_id, source_call_id, source_session_id, status,
               currency_code, currency_label, market_id, market_code, market_name, niche_label,
               project_title, project_description, package_id, client_snapshot_json,
               package_snapshot_json, terms_json, subtotal_minor, discount_type,
               discount_percent_bp, discount_amount_minor, total_minor, valid_until,
               created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      params: [
        newId,
        quoteNumber,
        source.leadId,
        source.sourceCallId,
        source.sourceSessionId,
        source.currencyCode,
        source.currencyLabel,
        source.marketId,
        source.marketCode,
        source.marketName,
        source.nicheLabel,
        `${source.projectTitle} (copy)`.slice(0, 160),
        source.projectDescription,
        source.packageId,
        JSON.stringify(source.client),
        source.packageSnapshot ? JSON.stringify(source.packageSnapshot) : null,
        JSON.stringify(source.terms),
        source.subtotalMinor,
        source.discountType,
        source.discountPercentBp,
        source.discountAmountMinor,
        source.totalMinor,
        now,
        now,
      ],
    },
    ...source.lineItems.map((line, index) => ({
      sql: `INSERT INTO quote_line_items
              (id, quote_id, position, line_type, source_package_id, description, quantity,
               unit_price_minor, line_total_minor, currency_code, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        createId("qline"),
        newId,
        index,
        line.lineType,
        line.sourcePackageId,
        line.description,
        line.quantity,
        line.unitPriceMinor,
        line.lineTotalMinor,
        line.currencyCode,
        now,
        now,
      ],
    })),
    {
      sql: `INSERT INTO quote_status_events (id, quote_id, from_status, to_status, note, created_at)
            VALUES (?, ?, NULL, 'draft', ?, ?)`,
      params: [createId("qevt"), newId, `Duplicated from ${source.quoteNumber}`, now],
    },
  ]);

  const created = await getQuote(newId);
  if (!created) {
    throw new RepositoryError("not_saved", "The duplicated quotation could not be read back.");
  }
  return created;
}

/** Only drafts can be deleted; a sent or accepted quote is a historical record. */
export async function deleteQuote(id: string): Promise<void> {
  const existing = await getQuote(id);
  if (!existing) throw new RepositoryError("not_found", "That quotation no longer exists.");
  if (existing.status !== "draft") {
    throw new RepositoryError(
      "quote_locked",
      "Only draft quotations can be deleted. Cancel or reject this one to keep the record.",
    );
  }
  const db = await getDb();
  await db.run("DELETE FROM quotes WHERE id = ?", [id]);
}

/**
 * Explicitly re-prices the package lines of a draft from the current catalog.
 *
 * Nothing happens implicitly: the UI shows the old and new amount and calls this
 * only after the user confirms.
 */
export async function refreshQuotePrices(id: string): Promise<QuoteDetail> {
  const existing = await getQuote(id);
  if (!existing) throw new RepositoryError("not_found", "That quotation no longer exists.");
  if (existing.status !== "draft") {
    throw new RepositoryError(
      "quote_locked",
      "Only a draft can be re-priced. Duplicate the quotation to create a new version.",
    );
  }
  if (existing.priceDrift.length === 0) {
    throw new RepositoryError("invalid_input", "These prices are already up to date.");
  }

  const db = await getDb();
  const now = nowIso();

  const updatedLines = existing.lineItems.map((line) => {
    const drift = existing.priceDrift.find((entry) => entry.lineItemId === line.id);
    return {
      ...line,
      unitPriceMinor: drift ? drift.currentUnitPriceMinor : line.unitPriceMinor,
    };
  });

  let totals: ReturnType<typeof calculateQuoteTotals>;
  try {
    totals = calculateQuoteTotals(
      updatedLines.map((line) => ({
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
      })),
      existing.discountType === "fixed"
        ? { type: "fixed", amountMinor: existing.discountAmountMinor }
        : existing.discountType === "percent"
          ? { type: "percent", percentBp: existing.discountPercentBp }
          : { type: "none" },
    );
  } catch (error) {
    throw new RepositoryError(
      "invalid_input",
      error instanceof Error ? error.message : "The refreshed totals are not valid.",
    );
  }

  const statements: SqlStatement[] = updatedLines.map((line, index) => ({
    sql: `UPDATE quote_line_items
             SET unit_price_minor = ?, line_total_minor = ?, updated_at = ?
           WHERE id = ?`,
    params: [line.unitPriceMinor, totals.lines[index]?.lineTotalMinor ?? 0, now, line.id],
  }));

  // Keep the primary package snapshot consistent with the refreshed amount.
  const primaryLine = updatedLines[0];
  const refreshedPackage =
    existing.packageSnapshot && primaryLine
      ? {
          ...existing.packageSnapshot,
          priceAmount: Math.round(
            primaryLine.unitPriceMinor / 10 ** (existing.currencyCode === "IDR" ? 0 : 2),
          ),
        }
      : existing.packageSnapshot;

  statements.push({
    sql: `UPDATE quotes
             SET subtotal_minor = ?, discount_amount_minor = ?, total_minor = ?,
                 package_snapshot_json = ?, updated_at = ?
           WHERE id = ?`,
    params: [
      totals.subtotalMinor,
      totals.discountAmountMinor,
      totals.totalMinor,
      refreshedPackage ? JSON.stringify(refreshedPackage) : null,
      now,
      id,
    ],
  });

  statements.push({
    sql: `INSERT INTO quote_status_events (id, quote_id, from_status, to_status, note, created_at)
          VALUES (?, ?, 'draft', 'draft', ?, ?)`,
    params: [createId("qevt"), id, "Package prices refreshed from the catalog", now],
  });

  await db.batch(statements);

  const refreshed = await getQuote(id);
  if (!refreshed) {
    throw new RepositoryError("not_saved", "The quotation could not be read back after saving.");
  }
  return refreshed;
}