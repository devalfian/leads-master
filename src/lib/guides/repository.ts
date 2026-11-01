/**
 * Server-only data access for the Pricing Library and Session Planner.
 *
 * Every SQL statement in this module is parameterised. Nothing here is imported
 * by a client component: pages and route handlers call these functions on the
 * server, and the D1 binding never leaves the server runtime.
 */

import { getDb, RepositoryError } from "@/lib/db";
import type { SqlStatement, SqlValue } from "@/lib/db";
import { buildSnapshot, parseSnapshot, serializeSnapshot } from "./snapshot";
import type {
  GuideChecklistItem,
  GuideGoal,
  GuideObjection,
  GuideTool,
  Market,
  MarketGuide,
  MarketSchedule,
  NicheCategory,
  NichePriceRow,
  NicheService,
  Package,
  PackageFeature,
  SessionDetail,
  SessionRecord,
  SessionSnapshot,
} from "./types";

type Row = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/* Row decoding                                                               */
/* -------------------------------------------------------------------------- */

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function bool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function parseStringArray(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function toMarket(row: Row): Market {
  return {
    id: str(row["id"]),
    code: str(row["code"]),
    name: str(row["name"]),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    recommendedPackageId: nullableStr(row["recommended_package_id"]),
    targetPriceAmount: num(row["target_price_amount"]),
    targetPriceIsMinimum: bool(row["target_price_is_minimum"]),
    timezoneNote: nullableStr(row["timezone_note"]),
    scheduleNoteReviewRequired: bool(row["schedule_note_review_required"]),
    sortOrder: num(row["sort_order"]),
    isActive: bool(row["is_active"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

function toSchedule(row: Row): MarketSchedule {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    scheduleCode: str(row["schedule_code"]),
    title: str(row["title"]),
    startTimeWib: str(row["start_time_wib"]),
    endTimeWib: str(row["end_time_wib"]),
    localTimeLabel: nullableStr(row["local_time_label"]),
    timezoneLabel: nullableStr(row["timezone_label"]),
    cityLabels: parseStringArray(row["city_labels_json"]),
    priorityLabels: parseStringArray(row["priority_labels_json"]),
    scheduleNote: nullableStr(row["schedule_note"]),
    sortOrder: num(row["sort_order"]),
    isActive: bool(row["is_active"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

function toPackage(row: Row): Omit<Package, "features"> {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    slug: str(row["slug"]),
    name: str(row["name"]),
    priceAmount: num(row["price_amount"]),
    isStartingPrice: bool(row["is_starting_price"]),
    timeline: str(row["timeline"]),
    isRecommended: bool(row["is_recommended"]),
    displayOrder: num(row["display_order"]),
    isActive: bool(row["is_active"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

function toFeature(row: Row): PackageFeature {
  return {
    id: str(row["id"]),
    packageId: str(row["package_id"]),
    featureText: str(row["feature_text"]),
    sortOrder: num(row["sort_order"]),
  };
}

function toCategory(row: Row): Omit<NicheCategory, "services"> {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    slug: str(row["slug"]),
    name: str(row["name"]),
    sortOrder: num(row["sort_order"]),
    isActive: bool(row["is_active"]),
  };
}

function toService(row: Row): NicheService {
  return {
    id: str(row["id"]),
    nicheCategoryId: str(row["niche_category_id"]),
    name: str(row["name"]),
    sortOrder: num(row["sort_order"]),
  };
}

function toPriceRow(row: Row): NichePriceRow {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    nicheCategoryId: nullableStr(row["niche_category_id"]),
    nicheLabel: str(row["niche_label"]),
    packageId: str(row["package_id"]),
    priceAmount: num(row["price_amount"]),
    sourceOrder: num(row["source_order"]),
  };
}

function toGoal(row: Row): GuideGoal {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    kind: row["goal_kind"] === "session_goal" ? "session_goal" : "call_objective",
    goalText: str(row["goal_text"]),
    sortOrder: num(row["sort_order"]),
  };
}

function toChecklistItem(row: Row): GuideChecklistItem {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    itemText: str(row["item_text"]),
    sortOrder: num(row["sort_order"]),
  };
}

function toObjection(row: Row): GuideObjection {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    objectionText: str(row["objection_text"]),
    suggestedResponse: str(row["suggested_response"]),
    sortOrder: num(row["sort_order"]),
  };
}

function toTool(row: Row): GuideTool {
  return {
    id: str(row["id"]),
    marketId: str(row["market_id"]),
    toolName: str(row["tool_name"]),
    toolDescription: str(row["tool_description"]),
    sortOrder: num(row["sort_order"]),
  };
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

type GuideTables = {
  markets: Market[];
  schedules: MarketSchedule[];
  packages: Array<Omit<Package, "features">>;
  features: PackageFeature[];
  categories: Array<Omit<NicheCategory, "services">>;
  services: NicheService[];
  priceRows: NichePriceRow[];
  goals: GuideGoal[];
  checklist: GuideChecklistItem[];
  objections: GuideObjection[];
  tools: GuideTool[];
};

async function loadTables(): Promise<GuideTables> {
  const db = await getDb();
  const [
    marketRows,
    scheduleRows,
    packageRows,
    featureRows,
    categoryRows,
    serviceRows,
    priceRowRows,
    goalRows,
    checklistRows,
    objectionRows,
    toolRows,
  ] = await Promise.all([
    db.all<Row>("SELECT * FROM markets ORDER BY sort_order, code"),
    db.all<Row>("SELECT * FROM market_schedules ORDER BY market_id, sort_order"),
    db.all<Row>("SELECT * FROM packages ORDER BY market_id, display_order"),
    db.all<Row>("SELECT * FROM package_features ORDER BY package_id, sort_order"),
    db.all<Row>("SELECT * FROM niche_categories ORDER BY market_id, sort_order"),
    db.all<Row>("SELECT * FROM niche_services ORDER BY niche_category_id, sort_order"),
    db.all<Row>("SELECT * FROM niche_price_rows ORDER BY market_id, source_order"),
    db.all<Row>("SELECT * FROM market_call_goals ORDER BY market_id, goal_kind, sort_order"),
    db.all<Row>("SELECT * FROM market_call_checklist_items ORDER BY market_id, sort_order"),
    db.all<Row>("SELECT * FROM market_objections ORDER BY market_id, sort_order"),
    db.all<Row>("SELECT * FROM market_recommended_tools ORDER BY market_id, sort_order"),
  ]);

  return {
    markets: marketRows.map(toMarket),
    schedules: scheduleRows.map(toSchedule),
    packages: packageRows.map(toPackage),
    features: featureRows.map(toFeature),
    categories: categoryRows.map(toCategory),
    services: serviceRows.map(toService),
    priceRows: priceRowRows.map(toPriceRow),
    goals: goalRows.map(toGoal),
    checklist: checklistRows.map(toChecklistItem),
    objections: objectionRows.map(toObjection),
    tools: toolRows.map(toTool),
  };
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = map.get(key(row));
    if (bucket) bucket.push(row);
    else map.set(key(row), [row]);
  }
  return map;
}

function assembleGuides(tables: GuideTables): MarketGuide[] {
  const featuresByPackage = groupBy(tables.features, (feature) => feature.packageId);
  const servicesByCategory = groupBy(tables.services, (service) => service.nicheCategoryId);

  const packages: Package[] = tables.packages.map((product) => ({
    ...product,
    features: featuresByPackage.get(product.id) ?? [],
  }));

  const categories: NicheCategory[] = tables.categories.map((category) => ({
    ...category,
    services: servicesByCategory.get(category.id) ?? [],
  }));

  return tables.markets.map((market) => ({
    market,
    schedules: tables.schedules.filter((schedule) => schedule.marketId === market.id),
    packages: packages.filter((product) => product.marketId === market.id),
    nicheCategories: categories.filter((category) => category.marketId === market.id),
    nichePriceRows: tables.priceRows.filter((row) => row.marketId === market.id),
    callObjectives: tables.goals.filter(
      (goal) => goal.marketId === market.id && goal.kind === "call_objective",
    ),
    sessionGoals: tables.goals.filter(
      (goal) => goal.marketId === market.id && goal.kind === "session_goal",
    ),
    checklist: tables.checklist.filter((item) => item.marketId === market.id),
    objections: tables.objections.filter((objection) => objection.marketId === market.id),
    tools: tables.tools.filter((tool) => tool.marketId === market.id),
  }));
}

export async function listMarkets(): Promise<Market[]> {
  const tables = await loadTables();
  return tables.markets.filter((market) => market.isActive);
}

/** Active markets only, in source (sort) order, with all their guide data. */
export async function listMarketGuides(): Promise<MarketGuide[]> {
  return assembleGuides(await loadTables()).filter((guide) => guide.market.isActive);
}

export async function getMarketGuideByCode(marketCode: string): Promise<MarketGuide | null> {
  const needle = marketCode.trim().toUpperCase();
  const guides = await listMarketGuides();
  return guides.find((guide) => guide.market.code.toUpperCase() === needle) ?? null;
}

export async function getMarketGuideById(marketId: string): Promise<MarketGuide | null> {
  const guides = await listMarketGuides();
  return guides.find((guide) => guide.market.id === marketId) ?? null;
}

/** Includes inactive schedules/categories so the settings screen can reactivate them. */
export async function getMarketGuideForEditing(marketId: string): Promise<MarketGuide | null> {
  return getMarketGuideById(marketId);
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

const SESSION_SELECT = `
  SELECT s.*, m.code AS market_code, m.name AS market_name,
         m.currency_code AS currency_code, m.currency_label AS currency_label
    FROM sessions s
    JOIN markets m ON m.id = s.market_id
`;

function toSessionRecord(row: Row): SessionRecord {
  return {
    id: str(row["id"]),
    title: str(row["title"]),
    marketId: str(row["market_id"]),
    scheduleId: nullableStr(row["schedule_id"]),
    sessionDate: str(row["session_date"]),
    selectedNicheLabel: nullableStr(row["selected_niche_label"]),
    objective: str(row["objective"]),
    customNotes: str(row["custom_notes"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

function toSessionDetail(row: Row): SessionDetail {
  const snapshot = parseSnapshot(str(row["snapshot_json"]));
  if (!snapshot) {
    throw new RepositoryError(
      "corrupt_snapshot",
      "This session's saved snapshot cannot be read. The master pricing data is unaffected.",
    );
  }
  return {
    ...toSessionRecord(row),
    marketCode: str(row["market_code"]),
    marketName: str(row["market_name"]),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    snapshot,
  };
}

export type SessionInput = {
  marketCode: string;
  scheduleId: string;
  nicheSlug: string | null;
  sessionDate: string;
  title: string;
  objective: string;
  customNotes: string;
};

async function resolveSessionTarget(input: SessionInput): Promise<{
  guide: MarketGuide;
  schedule: MarketSchedule;
  category: NicheCategory | null;
  objective: string;
}> {
  const guides = await listMarketGuides();
  const guide = guides.find(
    (candidate) => candidate.market.code.toUpperCase() === input.marketCode.trim().toUpperCase(),
  );
  if (!guide) {
    throw new RepositoryError("not_found", "That market is not available in the guide data.");
  }

  const schedule = guide.schedules.find((candidate) => candidate.id === input.scheduleId);
  if (!schedule) {
    throw new RepositoryError(
      "conflict",
      `That calling schedule does not belong to ${guide.market.name}. Pick a schedule from the same market.`,
    );
  }
  if (!schedule.isActive) {
    throw new RepositoryError(
      "conflict",
      "That calling schedule has been deactivated. Choose an active schedule.",
    );
  }

  const category = input.nicheSlug
    ? (guide.nicheCategories.find((candidate) => candidate.slug === input.nicheSlug) ?? null)
    : null;
  if (input.nicheSlug && !category) {
    throw new RepositoryError(
      "conflict",
      `That niche does not belong to ${guide.market.name}. Pick a niche from the same market.`,
    );
  }
  if (category && !category.isActive) {
    throw new RepositoryError(
      "conflict",
      "That niche has been deactivated. Choose an active niche.",
    );
  }

  const objective = guide.callObjectives.find((goal) => goal.goalText === input.objective);
  if (!objective) {
    throw new RepositoryError(
      "conflict",
      `Choose one of the ${guide.market.name} call objectives from the guide data.`,
    );
  }

  return { guide, schedule, category, objective: objective.goalText };
}

export async function listSessions(limit = 200): Promise<SessionDetail[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    `${SESSION_SELECT} ORDER BY s.session_date DESC, s.created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(toSessionDetail);
}

export async function getSession(id: string): Promise<SessionDetail | null> {
  const db = await getDb();
  const row = await db.first<Row>(`${SESSION_SELECT} WHERE s.id = ?`, [id]);
  return row ? toSessionDetail(row) : null;
}

export async function createSession(input: SessionInput): Promise<SessionDetail> {
  const { guide, schedule, category, objective } = await resolveSessionTarget(input);
  const db = await getDb();
  const id = createId("session");
  const now = nowIso();
  const snapshot = buildSnapshot({
    guide,
    schedule,
    category,
    objective,
    notes: input.customNotes,
    capturedAt: now,
  });

  await db.run(
    `INSERT INTO sessions (id, title, market_id, schedule_id, session_date,
                           selected_niche_label, objective, custom_notes, snapshot_json,
                           created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title.trim(),
      guide.market.id,
      schedule.id,
      input.sessionDate,
      category?.name ?? null,
      objective,
      input.customNotes,
      serializeSnapshot(snapshot),
      now,
      now,
    ],
  );

  const created = await getSession(id);
  if (!created) {
    throw new RepositoryError(
      "not_saved",
      "The session could not be read back after saving. Reload the page and try again.",
    );
  }
  return created;
}

export async function updateSession(id: string, input: SessionInput): Promise<SessionDetail> {
  const existing = await getSession(id);
  if (!existing) {
    throw new RepositoryError("not_found", "That session no longer exists.");
  }

  const { guide, schedule, category, objective } = await resolveSessionTarget(input);
  const db = await getDb();
  const now = nowIso();
  // Re-freezing the snapshot on an explicit edit keeps the plan consistent with
  // the newly chosen market/schedule/niche. Nothing refreshes it automatically.
  const snapshot = buildSnapshot({
    guide,
    schedule,
    category,
    objective,
    notes: input.customNotes,
    capturedAt: now,
  });

  await db.run(
    `UPDATE sessions
        SET title = ?, market_id = ?, schedule_id = ?, session_date = ?,
            selected_niche_label = ?, objective = ?, custom_notes = ?,
            snapshot_json = ?, updated_at = ?
      WHERE id = ?`,
    [
      input.title.trim(),
      guide.market.id,
      schedule.id,
      input.sessionDate,
      category?.name ?? null,
      objective,
      input.customNotes,
      serializeSnapshot(snapshot),
      now,
      id,
    ],
  );

  const updated = await getSession(id);
  if (!updated) {
    throw new RepositoryError("not_saved", "The session could not be read back after saving.");
  }
  return updated;
}

/**
 * Copies a session into a new draft. The stored snapshot is copied as-is (only
 * `capturedAt` is refreshed), so duplicating never silently re-prices a plan.
 */
export async function duplicateSession(id: string): Promise<SessionDetail> {
  const existing = await getSession(id);
  if (!existing) {
    throw new RepositoryError("not_found", "That session no longer exists.");
  }

  const db = await getDb();
  const newId = createId("session");
  const now = nowIso();
  const snapshot: SessionSnapshot = { ...existing.snapshot, capturedAt: now };

  await db.run(
    `INSERT INTO sessions (id, title, market_id, schedule_id, session_date,
                           selected_niche_label, objective, custom_notes, snapshot_json,
                           created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      `${existing.title} (copy)`.slice(0, 120),
      existing.marketId,
      existing.scheduleId,
      existing.sessionDate,
      existing.selectedNicheLabel,
      existing.objective,
      existing.customNotes,
      serializeSnapshot(snapshot),
      now,
      now,
    ],
  );

  const created = await getSession(newId);
  if (!created) {
    throw new RepositoryError("not_saved", "The duplicated session could not be read back.");
  }
  return created;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT id FROM sessions WHERE id = ?", [id]);
  if (!row) {
    throw new RepositoryError("not_found", "That session no longer exists.");
  }
  await db.run("DELETE FROM sessions WHERE id = ?", [id]);
}

/* -------------------------------------------------------------------------- */
/* Write helpers                                                              */
/* -------------------------------------------------------------------------- */

function assertAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RepositoryError(
      "invalid_amount",
      "Enter a whole, non-negative amount in the market's currency.",
    );
  }
}

function assertText(value: string, field: string, max = 400): void {
  if (!value.trim()) {
    throw new RepositoryError("invalid_input", `${field} cannot be empty.`);
  }
  if (value.trim().length > max) {
    throw new RepositoryError("invalid_input", `${field} is limited to ${max} characters.`);
  }
}

function rethrowUnique(error: unknown, message: string): never {
  if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) {
    throw new RepositoryError("conflict", message);
  }
  throw error;
}

async function loadPackageWithFeatures(id: string): Promise<Package> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM packages WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That package no longer exists.");
  const features = await db.all<Row>(
    "SELECT * FROM package_features WHERE package_id = ? ORDER BY sort_order",
    [id],
  );
  return { ...toPackage(row), features: features.map(toFeature) };
}

export type PackageUpdate = {
  priceAmount?: number;
  isStartingPrice?: boolean;
  timeline?: string;
  isRecommended?: boolean;
  isActive?: boolean;
};

/**
 * Updates one package's own fields. Niche-specific price rows live in their own
 * table and are never touched here — an operator edits them separately, so a
 * base-price change cannot silently rewrite the specialty grid.
 */
export async function updatePackage(id: string, patch: PackageUpdate): Promise<Package> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM packages WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That package no longer exists.");

  const marketId = str(row["market_id"]);
  const now = nowIso();
  const statements: SqlStatement[] = [];

  // The unique partial index allows one recommended package per market, so the
  // previous one is cleared in the same atomic batch.
  if (patch.isRecommended === true) {
    statements.push({
      sql: "UPDATE packages SET is_recommended = 0, updated_at = ? WHERE market_id = ? AND id <> ?",
      params: [now, marketId, id],
    });
  }

  const assignments: string[] = [];
  const params: SqlValue[] = [];

  if (patch.priceAmount !== undefined) {
    assertAmount(patch.priceAmount);
    assignments.push("price_amount = ?");
    params.push(patch.priceAmount);
  }
  if (patch.isStartingPrice !== undefined) {
    assignments.push("is_starting_price = ?");
    params.push(patch.isStartingPrice ? 1 : 0);
  }
  if (patch.timeline !== undefined) {
    assertText(patch.timeline, "Timeline", 120);
    assignments.push("timeline = ?");
    params.push(patch.timeline.trim());
  }
  if (patch.isRecommended !== undefined) {
    assignments.push("is_recommended = ?");
    params.push(patch.isRecommended ? 1 : 0);
  }
  if (patch.isActive !== undefined) {
    assignments.push("is_active = ?");
    params.push(patch.isActive ? 1 : 0);
  }

  if (assignments.length === 0 && statements.length === 0) {
    throw new RepositoryError("invalid_input", "Nothing to update.");
  }

  assignments.push("updated_at = ?");
  params.push(now);
  statements.push({
    sql: `UPDATE packages SET ${assignments.join(", ")} WHERE id = ?`,
    params: [...params, id],
  });

  await db.batch(statements);
  return loadPackageWithFeatures(id);
}

export async function createPackageFeature(
  packageId: string,
  featureText: string,
): Promise<PackageFeature> {
  const db = await getDb();
  const product = await db.first<Row>("SELECT id FROM packages WHERE id = ?", [packageId]);
  if (!product) throw new RepositoryError("not_found", "That package no longer exists.");
  assertText(featureText, "Inclusion", 300);

  const next = await db.first<Row>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM package_features WHERE package_id = ?",
    [packageId],
  );
  const now = nowIso();
  const id = createId("feat");
  await db.run(
    `INSERT INTO package_features (id, package_id, feature_text, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, packageId, featureText.trim(), num(next?.["next_order"], 1), now, now],
  );

  const row = await db.first<Row>("SELECT * FROM package_features WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_saved", "The inclusion could not be saved.");
  return toFeature(row);
}

export async function updatePackageFeature(
  id: string,
  featureText: string,
): Promise<PackageFeature> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM package_features WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That inclusion no longer exists.");
  assertText(featureText, "Inclusion", 300);

  await db.run("UPDATE package_features SET feature_text = ?, updated_at = ? WHERE id = ?", [
    featureText.trim(),
    nowIso(),
    id,
  ]);

  const updated = await db.first<Row>("SELECT * FROM package_features WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The inclusion could not be read back.");
  return toFeature(updated);
}

export async function deletePackageFeature(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT id FROM package_features WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That inclusion no longer exists.");
  await db.run("DELETE FROM package_features WHERE id = ?", [id]);
}

export async function updateNichePriceRow(id: string, priceAmount: number): Promise<NichePriceRow> {
  assertAmount(priceAmount);
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM niche_price_rows WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That niche price row no longer exists.");

  await db.run("UPDATE niche_price_rows SET price_amount = ?, updated_at = ? WHERE id = ?", [
    priceAmount,
    nowIso(),
    id,
  ]);

  const updated = await db.first<Row>("SELECT * FROM niche_price_rows WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The niche price could not be read back.");
  return toPriceRow(updated);
}

export async function updateNicheCategory(id: string, name: string): Promise<NicheCategory> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM niche_categories WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That niche category no longer exists.");
  assertText(name, "Niche name", 120);

  await db.run("UPDATE niche_categories SET name = ?, updated_at = ? WHERE id = ?", [
    name.trim(),
    nowIso(),
    id,
  ]);

  const updated = await db.first<Row>("SELECT * FROM niche_categories WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The niche category could not be read back.");
  const services = await db.all<Row>(
    "SELECT * FROM niche_services WHERE niche_category_id = ? ORDER BY sort_order",
    [id],
  );
  return { ...toCategory(updated), services: services.map(toService) };
}

export async function createNicheService(
  nicheCategoryId: string,
  name: string,
): Promise<NicheService> {
  const db = await getDb();
  const category = await db.first<Row>("SELECT id FROM niche_categories WHERE id = ?", [
    nicheCategoryId,
  ]);
  if (!category) throw new RepositoryError("not_found", "That niche category no longer exists.");
  assertText(name, "Child label", 120);

  const next = await db.first<Row>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM niche_services WHERE niche_category_id = ?",
    [nicheCategoryId],
  );
  const now = nowIso();
  const id = createId("svc");
  try {
    await db.run(
      `INSERT INTO niche_services (id, niche_category_id, name, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nicheCategoryId, name.trim(), num(next?.["next_order"], 1), now, now],
    );
  } catch (error) {
    rethrowUnique(error, "That child label already exists in this niche category.");
  }

  const row = await db.first<Row>("SELECT * FROM niche_services WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_saved", "The child label could not be saved.");
  return toService(row);
}

export async function updateNicheService(id: string, name: string): Promise<NicheService> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM niche_services WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That child label no longer exists.");
  assertText(name, "Child label", 120);

  try {
    await db.run("UPDATE niche_services SET name = ?, updated_at = ? WHERE id = ?", [
      name.trim(),
      nowIso(),
      id,
    ]);
  } catch (error) {
    rethrowUnique(error, "That child label already exists in this niche category.");
  }

  const updated = await db.first<Row>("SELECT * FROM niche_services WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The child label could not be read back.");
  return toService(updated);
}

export async function deleteNicheService(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT id FROM niche_services WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That child label no longer exists.");
  await db.run("DELETE FROM niche_services WHERE id = ?", [id]);
}

export type ScheduleUpdate = {
  title?: string;
  startTimeWib?: string;
  endTimeWib?: string;
  localTimeLabel?: string | null;
  timezoneLabel?: string | null;
  cityLabels?: string[];
  priorityLabels?: string[];
  scheduleNote?: string | null;
  isActive?: boolean;
};

function assertTime(value: string, field: string): void {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new RepositoryError("invalid_input", `${field} must be a 24-hour time such as 09:30.`);
  }
}

function assertLabels(values: string[], field: string): string[] {
  const cleaned = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (cleaned.length === 0) {
    throw new RepositoryError("invalid_input", `${field} needs at least one entry.`);
  }
  if (cleaned.some((value) => value.length > 120)) {
    throw new RepositoryError("invalid_input", `${field} entries are limited to 120 characters.`);
  }
  return cleaned;
}

export async function updateSchedule(id: string, patch: ScheduleUpdate): Promise<MarketSchedule> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM market_schedules WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That schedule block no longer exists.");

  const assignments: string[] = [];
  const params: SqlValue[] = [];

  if (patch.title !== undefined) {
    assertText(patch.title, "Schedule title", 200);
    assignments.push("title = ?");
    params.push(patch.title.trim());
  }
  if (patch.startTimeWib !== undefined) {
    assertTime(patch.startTimeWib, "Start time");
    assignments.push("start_time_wib = ?");
    params.push(patch.startTimeWib);
  }
  if (patch.endTimeWib !== undefined) {
    assertTime(patch.endTimeWib, "End time");
    assignments.push("end_time_wib = ?");
    params.push(patch.endTimeWib);
  }
  if (patch.localTimeLabel !== undefined) {
    assignments.push("local_time_label = ?");
    params.push(patch.localTimeLabel?.trim() || null);
  }
  if (patch.timezoneLabel !== undefined) {
    assignments.push("timezone_label = ?");
    params.push(patch.timezoneLabel?.trim() || null);
  }
  if (patch.cityLabels !== undefined) {
    assignments.push("city_labels_json = ?");
    params.push(JSON.stringify(assertLabels(patch.cityLabels, "Target cities")));
  }
  if (patch.priorityLabels !== undefined) {
    assignments.push("priority_labels_json = ?");
    params.push(JSON.stringify(assertLabels(patch.priorityLabels, "Priority focus")));
  }
  if (patch.scheduleNote !== undefined) {
    assignments.push("schedule_note = ?");
    params.push(patch.scheduleNote?.trim() || null);
  }
  if (patch.isActive !== undefined) {
    assignments.push("is_active = ?");
    params.push(patch.isActive ? 1 : 0);
  }

  if (assignments.length === 0) {
    throw new RepositoryError("invalid_input", "Nothing to update.");
  }

  assignments.push("updated_at = ?");
  params.push(nowIso());
  await db.run(`UPDATE market_schedules SET ${assignments.join(", ")} WHERE id = ?`, [
    ...params,
    id,
  ]);

  const updated = await db.first<Row>("SELECT * FROM market_schedules WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The schedule block could not be read back.");
  return toSchedule(updated);
}

export async function updateMarket(
  id: string,
  patch: { timezoneNote?: string | null; scheduleNoteReviewRequired?: boolean },
): Promise<Market> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM markets WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That market no longer exists.");

  const assignments: string[] = [];
  const params: SqlValue[] = [];

  if (patch.timezoneNote !== undefined) {
    if (patch.timezoneNote && patch.timezoneNote.length > 1000) {
      throw new RepositoryError(
        "invalid_input",
        "The schedule note is limited to 1000 characters.",
      );
    }
    assignments.push("timezone_note = ?");
    params.push(patch.timezoneNote?.trim() || null);
  }
  if (patch.scheduleNoteReviewRequired !== undefined) {
    assignments.push("schedule_note_review_required = ?");
    params.push(patch.scheduleNoteReviewRequired ? 1 : 0);
  }

  if (assignments.length === 0) {
    throw new RepositoryError("invalid_input", "Nothing to update.");
  }

  assignments.push("updated_at = ?");
  params.push(nowIso());
  await db.run(`UPDATE markets SET ${assignments.join(", ")} WHERE id = ?`, [...params, id]);

  const updated = await db.first<Row>("SELECT * FROM markets WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The market could not be read back.");
  return toMarket(updated);
}

/* -------------------------------------------------------------------------- */
/* Guide reference data                                                       */
/* -------------------------------------------------------------------------- */

export const GUIDE_RESOURCES = [
  "call-objectives",
  "session-goals",
  "checklist",
  "objections",
  "tools",
] as const;

export type GuideResource = (typeof GUIDE_RESOURCES)[number];

export function isGuideResource(value: string): value is GuideResource {
  return (GUIDE_RESOURCES as readonly string[]).includes(value);
}

type GuideResourceConfig = {
  table: string;
  textColumn: string;
  secondaryColumn: string | null;
  goalKind: "call_objective" | "session_goal" | null;
  textLabel: string;
};

/**
 * Fixed map of table/column names. Resource keys are checked against a union
 * before they reach here, so no user input is ever interpolated into SQL.
 */
const GUIDE_RESOURCE_CONFIG: Record<GuideResource, GuideResourceConfig> = {
  "call-objectives": {
    table: "market_call_goals",
    textColumn: "goal_text",
    secondaryColumn: null,
    goalKind: "call_objective",
    textLabel: "Objective",
  },
  "session-goals": {
    table: "market_call_goals",
    textColumn: "goal_text",
    secondaryColumn: null,
    goalKind: "session_goal",
    textLabel: "Session goal",
  },
  checklist: {
    table: "market_call_checklist_items",
    textColumn: "item_text",
    secondaryColumn: null,
    goalKind: null,
    textLabel: "Checklist item",
  },
  objections: {
    table: "market_objections",
    textColumn: "objection_text",
    secondaryColumn: "suggested_response",
    goalKind: null,
    textLabel: "Objection",
  },
  tools: {
    table: "market_recommended_tools",
    textColumn: "tool_name",
    secondaryColumn: "tool_description",
    goalKind: null,
    textLabel: "Tool name",
  },
};

export type GuideItemInput = {
  text: string;
  secondaryText?: string;
};

function assertSecondary(config: GuideResourceConfig, secondaryText: string | undefined): string {
  const value = (secondaryText ?? "").trim();
  if (config.secondaryColumn === "suggested_response" && !value) {
    throw new RepositoryError(
      "invalid_input",
      "Add the suggested response for this objection.",
    );
  }
  if (value.length > 1000) {
    throw new RepositoryError("invalid_input", "That text is limited to 1000 characters.");
  }
  return value;
}

export async function createGuideItem(
  resource: GuideResource,
  marketId: string,
  input: GuideItemInput,
): Promise<void> {
  const config = GUIDE_RESOURCE_CONFIG[resource];
  const db = await getDb();
  const market = await db.first<Row>("SELECT id FROM markets WHERE id = ?", [marketId]);
  if (!market) throw new RepositoryError("not_found", "That market no longer exists.");
  assertText(input.text, config.textLabel, 500);
  const secondary = assertSecondary(config, input.secondaryText);

  const next = await db.first<Row>(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM ${config.table} WHERE market_id = ?`,
    [marketId],
  );

  const now = nowIso();
  const columns = ["id", "market_id", config.textColumn];
  const values: SqlValue[] = [createId("guide"), marketId, input.text.trim()];

  if (config.secondaryColumn) {
    columns.push(config.secondaryColumn);
    values.push(secondary);
  }
  if (config.goalKind) {
    columns.push("goal_kind");
    values.push(config.goalKind);
  }
  columns.push("sort_order", "created_at", "updated_at");
  values.push(num(next?.["next_order"], 1), now, now);

  try {
    await db.run(
      `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${columns
        .map(() => "?")
        .join(", ")})`,
      values,
    );
  } catch (error) {
    rethrowUnique(error, "That entry already exists for this market.");
  }
}

export async function updateGuideItem(
  resource: GuideResource,
  id: string,
  input: GuideItemInput,
): Promise<void> {
  const config = GUIDE_RESOURCE_CONFIG[resource];
  const db = await getDb();
  const row = await db.first<Row>(`SELECT id FROM ${config.table} WHERE id = ?`, [id]);
  if (!row) throw new RepositoryError("not_found", "That guide entry no longer exists.");
  assertText(input.text, config.textLabel, 500);
  const secondary = assertSecondary(config, input.secondaryText);

  const assignments = [`${config.textColumn} = ?`];
  const params: SqlValue[] = [input.text.trim()];
  if (config.secondaryColumn) {
    assignments.push(`${config.secondaryColumn} = ?`);
    params.push(secondary);
  }
  assignments.push("updated_at = ?");
  params.push(nowIso());

  try {
    await db.run(
      `UPDATE ${config.table} SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  } catch (error) {
    rethrowUnique(error, "That entry already exists for this market.");
  }
}

export async function deleteGuideItem(resource: GuideResource, id: string): Promise<void> {
  const config = GUIDE_RESOURCE_CONFIG[resource];
  const db = await getDb();
  const row = await db.first<Row>(`SELECT id FROM ${config.table} WHERE id = ?`, [id]);
  if (!row) throw new RepositoryError("not_found", "That guide entry no longer exists.");
  await db.run(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
}