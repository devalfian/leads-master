/**
 * Server-only data access for leads, manual call logs and follow-ups.
 *
 * The existing `call_sessions` table stays the Call History for Callbook runs.
 * This module adds the lead entity, links a run to a lead, and stores manual logs
 * (`lead_calls`) for calls that did not follow a Callbook. Call History reads both
 * through one query, so there is still a single history workflow.
 */

import { getDb, RepositoryError } from "@/lib/db";
import type { SqlValue } from "@/lib/db";
import { isOutcomeKey, outcomeLabel } from "@/lib/callbooks/outcomes";
import { formatMinorUnits } from "@/lib/quotes/money";
import { leadMatchKeys, normalizeWebsiteUrl } from "./normalize";
import {
  isFollowUpStatus,
  isFollowUpType,
  isLeadStatus,
  type FollowUp,
  type FollowUpStatus,
  type FollowUpType,
  type Lead,
  type LeadCall,
  type LeadDetail,
  type LeadStatus,
  type LeadTimelineEntry,
  type LeadWithActivity,
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

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = num(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

const LEAD_SELECT = `
  SELECT l.*,
         m.code AS market_code,
         m.name AS market_name,
         m.currency_code AS currency_code,
         m.currency_label AS currency_label,
         nc.name AS niche_name,
         (SELECT COUNT(*) FROM lead_calls lc WHERE lc.lead_id = l.id)
           + (SELECT COUNT(*) FROM call_sessions s
               WHERE s.lead_id = l.id AND s.status <> 'abandoned') AS call_count,
         NULLIF(MAX(
           COALESCE((SELECT MAX(lc.called_at) FROM lead_calls lc WHERE lc.lead_id = l.id), ''),
           COALESCE((SELECT MAX(s.started_at) FROM call_sessions s
                      WHERE s.lead_id = l.id AND s.status <> 'abandoned'), '')
         ), '') AS last_contact_at,
         (SELECT MIN(f.due_at) FROM follow_ups f
           WHERE f.lead_id = l.id AND f.status = 'scheduled') AS next_follow_up_at,
         (SELECT COUNT(*) FROM follow_ups f
           WHERE f.lead_id = l.id AND f.status = 'scheduled') AS open_follow_up_count
    FROM leads l
    JOIN markets m ON m.id = l.market_id
    LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
`;

function toLead(row: Row): Lead {
  const status = row["status"];
  return {
    id: str(row["id"]),
    businessName: str(row["business_name"]),
    contactName: nullableStr(row["contact_name"]),
    contactRole: nullableStr(row["contact_role"]),
    phone: nullableStr(row["phone"]),
    email: nullableStr(row["email"]),
    website: nullableStr(row["website"]),
    marketId: str(row["market_id"]),
    marketCode: str(row["market_code"]),
    marketName: str(row["market_name"]),
    currencyCode: str(row["currency_code"]),
    currencyLabel: str(row["currency_label"]),
    nicheCategoryId: nullableStr(row["niche_category_id"]),
    nicheName: nullableStr(row["niche_name"]),
    city: nullableStr(row["city"]),
    address: nullableStr(row["address"]),
    source: nullableStr(row["source"]),
    status: isLeadStatus(status) ? status : "new",
    notes: str(row["notes"]),
    estimatedValueAmount: nullableNum(row["estimated_value_amount"]),
    doNotContact: bool(row["do_not_contact"]),
    archivedAt: nullableStr(row["archived_at"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

function toLeadWithActivity(row: Row): LeadWithActivity {
  return {
    ...toLead(row),
    callCount: num(row["call_count"]),
    lastContactAt: nullableStr(row["last_contact_at"]),
    nextFollowUpAt: nullableStr(row["next_follow_up_at"]),
    openFollowUpCount: num(row["open_follow_up_count"]),
  };
}

function toLeadCall(row: Row): LeadCall {
  return {
    id: str(row["id"]),
    leadId: str(row["lead_id"]),
    callbookId: nullableStr(row["callbook_id"]),
    callbookTitle: nullableStr(row["callbook_title"]),
    packageId: nullableStr(row["package_id"]),
    packageName: nullableStr(row["package_name"]),
    calledAt: str(row["called_at"]),
    outcomeKey: str(row["outcome_key"]),
    notes: str(row["notes"]),
    nextAction: nullableStr(row["next_action"]),
    followUpAt: nullableStr(row["follow_up_at"]),
    createdAt: str(row["created_at"]),
  };
}

function toFollowUp(row: Row): FollowUp {
  const type = row["type"];
  const status = row["status"];
  return {
    id: str(row["id"]),
    leadId: str(row["lead_id"]),
    leadCallId: nullableStr(row["lead_call_id"]),
    callSessionId: nullableStr(row["call_session_id"]),
    dueAt: str(row["due_at"]),
    type: isFollowUpType(type) ? type : "other",
    notes: str(row["notes"]),
    status: isFollowUpStatus(status) ? status : "scheduled",
    completedAt: nullableStr(row["completed_at"]),
    createdAt: str(row["created_at"]),
  };
}

/* Lead reads ---------------------------------------------------------------- */

export type LeadListFilters = {
  query?: string;
  marketCode?: string | null;
  nicheCategoryId?: string | null;
  status?: LeadStatus | null;
  /** known = a website URL is recorded, unknown = nothing recorded. */
  website?: "known" | "unknown" | null;
  contact?: "never" | "contacted" | null;
  followUp?: "scheduled" | "due" | "overdue" | "none" | null;
  includeArchived?: boolean;
  sort?:
    | "updated"
    | "name"
    | "next_follow_up"
    | "last_contact"
    | "value"
    | "oldest_uncontacted"
    | null;
  page?: number;
  pageSize?: number;
};

export const LEAD_PAGE_SIZE = 25;

function buildLeadWhere(filters: LeadListFilters): { sql: string; params: SqlValue[] } {
  const where: string[] = [];
  const params: SqlValue[] = [];

  if (!filters.includeArchived) where.push("t.archived_at IS NULL");
  if (filters.marketCode) {
    where.push("t.market_code = ?");
    params.push(filters.marketCode);
  }
  if (filters.nicheCategoryId) {
    where.push("t.niche_category_id = ?");
    params.push(filters.nicheCategoryId);
  }
  if (filters.status) {
    where.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters.website === "known") where.push("COALESCE(t.website, '') <> ''");
  if (filters.website === "unknown") where.push("COALESCE(t.website, '') = ''");
  if (filters.contact === "never") where.push("t.last_contact_at IS NULL");
  if (filters.contact === "contacted") where.push("t.last_contact_at IS NOT NULL");

  const today = new Date().toISOString().slice(0, 10);
  if (filters.followUp === "scheduled") where.push("t.next_follow_up_at IS NOT NULL");
  if (filters.followUp === "none") where.push("t.next_follow_up_at IS NULL");
  if (filters.followUp === "due") {
    where.push("t.next_follow_up_at IS NOT NULL AND substr(t.next_follow_up_at, 1, 10) <= ?");
    params.push(today);
  }
  if (filters.followUp === "overdue") {
    where.push("t.next_follow_up_at IS NOT NULL AND substr(t.next_follow_up_at, 1, 10) < ?");
    params.push(today);
  }

  const needle = filters.query?.trim().toLowerCase();
  if (needle) {
    const like = `%${needle}%`;
    where.push(
      `(lower(t.business_name) LIKE ?
        OR lower(COALESCE(t.contact_name, '')) LIKE ?
        OR lower(COALESCE(t.phone, '')) LIKE ?
        OR lower(COALESCE(t.email, '')) LIKE ?
        OR lower(COALESCE(t.website, '')) LIKE ?
        OR lower(COALESCE(t.city, '')) LIKE ?
        OR lower(COALESCE(t.notes, '')) LIKE ?)`,
    );
    params.push(like, like, like, like, like, like, like);
  }

  return { sql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "", params };
}

function leadOrderBy(sort: LeadListFilters["sort"]): string {
  switch (sort) {
    case "name":
      return "lower(t.business_name) ASC, t.id ASC";
    case "next_follow_up":
      return "t.next_follow_up_at IS NULL ASC, t.next_follow_up_at ASC, t.id ASC";
    case "last_contact":
      return "t.last_contact_at IS NULL ASC, t.last_contact_at DESC, t.id ASC";
    case "value":
      return "t.estimated_value_amount IS NULL ASC, t.estimated_value_amount DESC, t.id ASC";
    case "oldest_uncontacted":
      return "t.last_contact_at IS NOT NULL ASC, t.created_at ASC, t.id ASC";
    default:
      return "t.updated_at DESC, t.id ASC";
  }
}

export async function listLeads(filters: LeadListFilters = {}): Promise<{
  leads: LeadWithActivity[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = await getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? LEAD_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const { sql: where, params } = buildLeadWhere(filters);

  const totalRow = await db.first<Row>(
    `SELECT COUNT(*) AS total FROM (${LEAD_SELECT}) AS t ${where}`,
    params,
  );

  const rows = await db.all<Row>(
    `SELECT * FROM (${LEAD_SELECT}) AS t ${where}
      ORDER BY ${leadOrderBy(filters.sort)}
      LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );

  return {
    leads: rows.map(toLeadWithActivity),
    total: num(totalRow?.["total"]),
    page,
    pageSize,
  };
}

export async function getLead(id: string): Promise<Lead | null> {
  const db = await getDb();
  const row = await db.first<Row>(`SELECT * FROM (${LEAD_SELECT}) AS t WHERE t.id = ?`, [id]);
  return row ? toLead(row) : null;
}

/* Duplicate detection ------------------------------------------------------- */

export async function findPossibleDuplicates(
  input: {
    businessName: string;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  },
  options: { marketId: string; excludeId?: string | null },
): Promise<Lead[]> {
  const db = await getDb();
  const keys = leadMatchKeys(input);
  const conditions: string[] = [];
  const params: SqlValue[] = [options.marketId, options.excludeId ?? ""];

  if (keys.phone) {
    conditions.push("phone_normalized = ?");
    params.push(keys.phone);
  }
  if (keys.email) {
    conditions.push("email_normalized = ?");
    params.push(keys.email);
  }
  if (keys.domain) {
    conditions.push("website_domain = ?");
    params.push(keys.domain);
  }
  if (keys.name) {
    // A business name alone is a weak signal, so the city must also match.
    conditions.push("(name_normalized = ? AND ? <> '' AND lower(COALESCE(city, '')) = ?)");
    params.push(keys.name, keys.city, keys.city);
  }
  if (conditions.length === 0) return [];

  const rows = await db.all<Row>(
    `SELECT * FROM (${LEAD_SELECT}) AS t
      WHERE t.market_id = ? AND t.archived_at IS NULL AND t.id <> ?
        AND (${conditions.join(" OR ")})
      ORDER BY t.updated_at DESC
      LIMIT 10`,
    params,
  );

  return rows.map(toLead);
}

/* Lead writes --------------------------------------------------------------- */

export type LeadWriteInput = {
  businessName: string;
  contactName?: string | null;
  contactRole?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  marketId: string;
  nicheCategoryId?: string | null;
  city?: string | null;
  address?: string | null;
  source?: string | null;
  status?: LeadStatus;
  notes?: string;
  estimatedValueAmount?: number | null;
  doNotContact?: boolean;
};

function nullableTrim(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertEstimatedValue(value: number | null | undefined): void {
  if (value === null || value === undefined) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new RepositoryError(
      "invalid_amount",
      "The estimated value must be a whole, non-negative amount.",
    );
  }
}

export async function createLead(input: LeadWriteInput): Promise<Lead> {
  if (!input.businessName.trim()) {
    throw new RepositoryError("invalid_input", "A business name is required.");
  }
  if (!input.marketId) {
    throw new RepositoryError("invalid_reference", "Choose a market for this lead.");
  }
  if (input.status && !isLeadStatus(input.status)) {
    throw new RepositoryError("invalid_input", "That lead status is not recognised.");
  }
  assertEstimatedValue(input.estimatedValueAmount);
  await assertMarketAndNiche(input.marketId, input.nicheCategoryId ?? null);

  const db = await getDb();
  const id = createId("lead");
  const now = nowIso();
  const website = normalizeWebsiteUrl(input.website);
  const keys = leadMatchKeys({ ...input, website });

  await db.run(
    `INSERT INTO leads (id, business_name, contact_name, contact_role, phone, email, website,
                        market_id, niche_category_id, city, address, source, status, notes,
                        estimated_value_amount, do_not_contact, name_normalized, phone_normalized,
                        email_normalized, website_domain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.businessName.trim(),
      nullableTrim(input.contactName),
      nullableTrim(input.contactRole),
      nullableTrim(input.phone),
      nullableTrim(input.email),
      website,
      input.marketId,
      input.nicheCategoryId ?? null,
      nullableTrim(input.city),
      nullableTrim(input.address),
      nullableTrim(input.source),
      input.status ?? "new",
      (input.notes ?? "").trim(),
      input.estimatedValueAmount ?? null,
      input.doNotContact ? 1 : 0,
      keys.name,
      keys.phone,
      keys.email,
      keys.domain,
      now,
      now,
    ],
  );

  const created = await getLead(id);
  if (!created) {
    throw new RepositoryError("not_saved", "The lead could not be read back after saving.");
  }
  return created;
}

export async function updateLead(id: string, patch: Partial<LeadWriteInput>): Promise<Lead> {
  const db = await getDb();
  const existing = await getLead(id);
  if (!existing) throw new RepositoryError("not_found", "That lead no longer exists.");

  const nextMarket = patch.marketId ?? existing.marketId;
  const nextNiche =
    patch.nicheCategoryId !== undefined
      ? (patch.nicheCategoryId ?? null)
      : existing.nicheCategoryId;
  if (patch.marketId !== undefined || patch.nicheCategoryId !== undefined) {
    await assertMarketAndNiche(nextMarket, nextNiche);
  }
  assertEstimatedValue(patch.estimatedValueAmount);

  const assignments: string[] = [];
  const params: SqlValue[] = [];
  const set = (column: string, value: SqlValue) => {
    assignments.push(`${column} = ?`);
    params.push(value);
  };

  if (patch.businessName !== undefined) {
    if (!patch.businessName.trim()) {
      throw new RepositoryError("invalid_input", "A business name is required.");
    }
    set("business_name", patch.businessName.trim());
  }
  if (patch.contactName !== undefined) set("contact_name", nullableTrim(patch.contactName));
  if (patch.contactRole !== undefined) set("contact_role", nullableTrim(patch.contactRole));
  if (patch.phone !== undefined) set("phone", nullableTrim(patch.phone));
  if (patch.email !== undefined) set("email", nullableTrim(patch.email));
  if (patch.website !== undefined) set("website", normalizeWebsiteUrl(patch.website));
  if (patch.marketId !== undefined) set("market_id", nextMarket);
  if (patch.nicheCategoryId !== undefined) set("niche_category_id", nextNiche);
  if (patch.city !== undefined) set("city", nullableTrim(patch.city));
  if (patch.address !== undefined) set("address", nullableTrim(patch.address));
  if (patch.source !== undefined) set("source", nullableTrim(patch.source));
  if (patch.status !== undefined) {
    if (!isLeadStatus(patch.status)) {
      throw new RepositoryError("invalid_input", "That lead status is not recognised.");
    }
    set("status", patch.status);
  }
  if (patch.notes !== undefined) set("notes", patch.notes);
  if (patch.estimatedValueAmount !== undefined) {
    set("estimated_value_amount", patch.estimatedValueAmount ?? null);
  }
  if (patch.doNotContact !== undefined) set("do_not_contact", patch.doNotContact ? 1 : 0);

  if (assignments.length === 0) {
    throw new RepositoryError("invalid_input", "Nothing to update.");
  }

  // Recompute the dedupe keys whenever an identifying field changes.
  const identityTouched =
    patch.businessName !== undefined ||
    patch.phone !== undefined ||
    patch.email !== undefined ||
    patch.website !== undefined ||
    patch.city !== undefined;
  if (identityTouched) {
    const keys = leadMatchKeys({
      businessName: patch.businessName ?? existing.businessName,
      city: patch.city !== undefined ? patch.city : existing.city,
      phone: patch.phone !== undefined ? patch.phone : existing.phone,
      email: patch.email !== undefined ? patch.email : existing.email,
      website: patch.website !== undefined ? patch.website : existing.website,
    });
    assignments.push(
      "name_normalized = ?",
      "phone_normalized = ?",
      "email_normalized = ?",
      "website_domain = ?",
    );
    params.push(keys.name, keys.phone, keys.email, keys.domain);
  }

  assignments.push("updated_at = ?");
  params.push(nowIso(), id);
  await db.run(`UPDATE leads SET ${assignments.join(", ")} WHERE id = ?`, params);

  const updated = await getLead(id);
  if (!updated) throw new RepositoryError("not_saved", "The lead could not be read back.");
  return updated;
}

/**
 * Archiving is the safe default. It keeps the lead out of the working list while
 * every call, follow-up and session reference stays intact.
 */
export async function setLeadArchived(id: string, archived: boolean): Promise<Lead> {
  const db = await getDb();
  const existing = await getLead(id);
  if (!existing) throw new RepositoryError("not_found", "That lead no longer exists.");

  await db.run("UPDATE leads SET archived_at = ?, updated_at = ? WHERE id = ?", [
    archived ? nowIso() : null,
    nowIso(),
    id,
  ]);

  const updated = await getLead(id);
  if (!updated) throw new RepositoryError("not_saved", "The lead could not be read back.");
  return updated;
}

/**
 * Permanent deletion is refused while the lead has call history. The FK on
 * `lead_calls` also blocks it; this check turns the database error into a message
 * the UI can act on.
 */
export async function deleteLead(id: string): Promise<void> {
  const db = await getDb();
  const existing = await getLead(id);
  if (!existing) throw new RepositoryError("not_found", "That lead no longer exists.");

  const calls = await db.first<Row>(
    `SELECT (SELECT COUNT(*) FROM lead_calls WHERE lead_id = ?)
          + (SELECT COUNT(*) FROM call_sessions WHERE lead_id = ?) AS total`,
    [id, id],
  );
  if (num(calls?.["total"]) > 0) {
    throw new RepositoryError(
      "has_calls",
      "This lead has call history. Archive it instead so the calls stay in Call History.",
    );
  }

  await db.run("DELETE FROM leads WHERE id = ?", [id]);
}

/* Logged calls and follow-ups ------------------------------------------------ */

export type LogCallInput = {
  calledAt?: string | null;
  outcomeKey: string;
  notes?: string;
  nextAction?: string | null;
  callbookId?: string | null;
  packageId?: string | null;
  markDoNotContact?: boolean;
  /** Explicit user choice only — logging a call never changes status silently. */
  status?: LeadStatus | null;
  followUp?: { dueAt: string; type: FollowUpType; notes?: string } | null;
};

function assertDueAt(value: string): void {
  if (Number.isNaN(new Date(value).getTime())) {
    throw new RepositoryError("invalid_follow_up", "Choose a valid follow-up date.");
  }
}

async function requireLead(id: string): Promise<Lead> {
  const lead = await getLead(id);
  if (!lead) throw new RepositoryError("not_found", "That lead no longer exists.");
  return lead;
}

/**
 * Records a call made without running a Callbook.
 *
 * The call, the optional follow-up and the optional lead change are written in one
 * D1 batch, so the UI never reports "call saved" while its follow-up failed.
 */
export async function logLeadCall(
  leadId: string,
  input: LogCallInput,
): Promise<{ call: LeadCall; followUp: FollowUp | null }> {
  const lead = await requireLead(leadId);
  if (!isOutcomeKey(input.outcomeKey)) {
    throw new RepositoryError("invalid_outcome", "Choose the outcome of this call.");
  }
  if (input.status && !isLeadStatus(input.status)) {
    throw new RepositoryError("invalid_input", "That lead status is not recognised.");
  }

  const db = await getDb();
  const now = nowIso();
  const calledAt = input.calledAt ?? now;
  assertDueAt(calledAt);

  if (input.callbookId) {
    const callbook = await db.first<Row>("SELECT id FROM callbooks WHERE id = ?", [
      input.callbookId,
    ]);
    if (!callbook) {
      throw new RepositoryError("invalid_reference", "That Callbook no longer exists.");
    }
  }

  if (input.packageId) {
    const product = await db.first<Row>("SELECT id, market_id FROM packages WHERE id = ?", [
      input.packageId,
    ]);
    if (!product) {
      throw new RepositoryError("invalid_reference", "That package no longer exists.");
    }
    if (str(product["market_id"]) !== lead.marketId) {
      throw new RepositoryError(
        "invalid_reference",
        "That package belongs to a different market than this lead.",
      );
    }
  }

  let followUp: FollowUp | null = null;
  if (input.followUp) {
    if (lead.doNotContact) {
      throw new RepositoryError(
        "do_not_contact",
        "This lead asked not to be contacted. Clear the do-not-contact flag before scheduling a follow-up.",
      );
    }
    assertDueAt(input.followUp.dueAt);
    if (!isFollowUpType(input.followUp.type)) {
      throw new RepositoryError("invalid_follow_up", "Choose a follow-up type.");
    }
    followUp = {
      id: createId("fu"),
      leadId,
      leadCallId: null,
      callSessionId: null,
      dueAt: input.followUp.dueAt,
      type: input.followUp.type,
      notes: (input.followUp.notes ?? "").trim(),
      status: "scheduled",
      completedAt: null,
      createdAt: now,
    };
  }

  const call: LeadCall = {
    id: createId("call"),
    leadId,
    callbookId: input.callbookId ?? null,
    callbookTitle: null,
    packageId: input.packageId ?? null,
    packageName: null,
    calledAt,
    outcomeKey: input.outcomeKey,
    notes: (input.notes ?? "").trim(),
    nextAction: nullableTrim(input.nextAction),
    followUpAt: followUp?.dueAt ?? null,
    createdAt: now,
  };

  const statements = [
    {
      sql: `INSERT INTO lead_calls (id, lead_id, callbook_id, package_id, called_at, outcome_key,
                                    notes, next_action, follow_up_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        call.id,
        leadId,
        call.callbookId,
        call.packageId,
        call.calledAt,
        call.outcomeKey,
        call.notes,
        call.nextAction,
        call.followUpAt,
        now,
        now,
      ],
    },
    {
      sql: `UPDATE leads
               SET updated_at = ?,
                   do_not_contact = CASE WHEN ? = 1 THEN 1 ELSE do_not_contact END,
                   status = COALESCE(?, status)
             WHERE id = ?`,
      params: [now, input.markDoNotContact ? 1 : 0, input.status ?? null, leadId],
    },
  ];

  if (followUp) {
    const created: FollowUp = { ...followUp, leadCallId: call.id };
    statements.push({
      sql: `INSERT INTO follow_ups (id, lead_id, lead_call_id, call_session_id, due_at, type,
                                    notes, status, completed_at, created_at, updated_at)
            VALUES (?, ?, ?, NULL, ?, ?, ?, 'scheduled', NULL, ?, ?)`,
      params: [
        created.id,
        leadId,
        created.leadCallId,
        created.dueAt,
        created.type,
        created.notes,
        now,
        now,
      ],
    });
  }

  await db.batch(statements);

  const savedCall = await db.first<Row>(
    `SELECT lc.*, cb.title AS callbook_title, p.name AS package_name
       FROM lead_calls lc
       LEFT JOIN callbooks cb ON cb.id = lc.callbook_id
       LEFT JOIN packages p ON p.id = lc.package_id
      WHERE lc.id = ?`,
    [call.id],
  );
  if (!savedCall) {
    throw new RepositoryError("not_saved", "The call could not be read back after saving.");
  }

  let savedFollowUp: FollowUp | null = null;
  if (followUp) {
    const row = await db.first<Row>("SELECT * FROM follow_ups WHERE lead_call_id = ?", [call.id]);
    if (!row) {
      throw new RepositoryError("not_saved", "The follow-up could not be read back after saving.");
    }
    savedFollowUp = toFollowUp(row);
  }

  return { call: toLeadCall(savedCall), followUp: savedFollowUp };
}

export async function listFollowUps(leadId: string): Promise<FollowUp[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    `SELECT * FROM follow_ups WHERE lead_id = ?
      ORDER BY CASE status WHEN 'scheduled' THEN 0 ELSE 1 END, due_at ASC`,
    [leadId],
  );
  return rows.map(toFollowUp);
}

export type FollowUpInput = {
  dueAt: string;
  type: FollowUpType;
  notes?: string;
};

export async function createFollowUp(leadId: string, input: FollowUpInput): Promise<FollowUp> {
  const lead = await requireLead(leadId);
  if (lead.doNotContact) {
    throw new RepositoryError(
      "do_not_contact",
      "This lead asked not to be contacted. Clear the do-not-contact flag first.",
    );
  }
  assertDueAt(input.dueAt);
  if (!isFollowUpType(input.type)) {
    throw new RepositoryError("invalid_follow_up", "Choose a follow-up type.");
  }

  const db = await getDb();
  const id = createId("fu");
  const now = nowIso();
  await db.run(
    `INSERT INTO follow_ups (id, lead_id, lead_call_id, call_session_id, due_at, type, notes,
                             status, completed_at, created_at, updated_at)
     VALUES (?, ?, NULL, NULL, ?, ?, ?, 'scheduled', NULL, ?, ?)`,
    [id, leadId, input.dueAt, input.type, (input.notes ?? "").trim(), now, now],
  );

  const row = await db.first<Row>("SELECT * FROM follow_ups WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_saved", "The follow-up could not be saved.");
  return toFollowUp(row);
}

export async function setFollowUpStatus(id: string, status: FollowUpStatus): Promise<FollowUp> {
  if (!isFollowUpStatus(status)) {
    throw new RepositoryError("invalid_input", "That follow-up status is not recognised.");
  }
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM follow_ups WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That follow-up no longer exists.");

  const now = nowIso();
  await db.run(
    "UPDATE follow_ups SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?",
    [status, status === "completed" ? now : null, now, id],
  );

  const updated = await db.first<Row>("SELECT * FROM follow_ups WHERE id = ?", [id]);
  if (!updated) throw new RepositoryError("not_saved", "The follow-up could not be read back.");
  return toFollowUp(updated);
}

export async function deleteFollowUp(id: string): Promise<void> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT id FROM follow_ups WHERE id = ?", [id]);
  if (!row) throw new RepositoryError("not_found", "That follow-up no longer exists.");
  await db.run("DELETE FROM follow_ups WHERE id = ?", [id]);
}

/* Lead detail --------------------------------------------------------------- */

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const db = await getDb();
  const row = await db.first<Row>(`SELECT * FROM (${LEAD_SELECT}) AS t WHERE t.id = ?`, [id]);
  if (!row) return null;
  const lead = toLeadWithActivity(row);

  const [callRows, sessionRows, followRows] = await Promise.all([
    db.all<Row>(
      `SELECT lc.*, cb.title AS callbook_title, p.name AS package_name
         FROM lead_calls lc
         LEFT JOIN callbooks cb ON cb.id = lc.callbook_id
         LEFT JOIN packages p ON p.id = lc.package_id
        WHERE lc.lead_id = ?
        ORDER BY lc.called_at DESC`,
      [id],
    ),
    db.all<Row>(
      `SELECT s.id, s.status, s.outcome_key, s.started_at, s.ended_at, s.notes, s.next_action,
              s.follow_up_at, c.title AS callbook_title,
              (SELECT COUNT(*) FROM call_session_steps st WHERE st.session_id = s.id) AS step_count
         FROM call_sessions s
         JOIN callbooks c ON c.id = s.callbook_id
        WHERE s.lead_id = ?
        ORDER BY s.started_at DESC`,
      [id],
    ),
    db.all<Row>("SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY due_at ASC", [id]),
  ]);

  const calls = callRows.map(toLeadCall);
  const followUps = followRows.map(toFollowUp);
  const callSessions = sessionRows.map((session) => ({
    id: str(session["id"]),
    callbookTitle: str(session["callbook_title"]),
    status: str(session["status"]),
    outcomeKey: nullableStr(session["outcome_key"]),
    startedAt: str(session["started_at"]),
    endedAt: nullableStr(session["ended_at"]),
    notes: str(session["notes"]),
    nextAction: nullableStr(session["next_action"]),
    followUpAt: nullableStr(session["follow_up_at"]),
    stepCount: num(session["step_count"]),
  }));

  const timeline: LeadTimelineEntry[] = [
    {
      id: `${lead.id}-created`,
      kind: "lead_created",
      at: lead.createdAt,
      title: "Lead created",
      detail: lead.source ? `Source: ${lead.source}` : null,
    },
  ];

  if (lead.updatedAt !== lead.createdAt) {
    timeline.push({
      id: `${lead.id}-updated`,
      kind: "lead_updated",
      at: lead.updatedAt,
      title: "Lead details updated",
      detail: null,
    });
  }

  for (const call of calls) {
    timeline.push({
      id: call.id,
      kind: "call",
      at: call.calledAt,
      title: `Call logged · ${outcomeLabel(call.outcomeKey)}`,
      detail: call.notes || call.nextAction || null,
      outcomeKey: call.outcomeKey,
    });
  }

  for (const session of callSessions) {
    timeline.push({
      id: session.id,
      kind: "callbook_run",
      at: session.startedAt,
      title: `Callbook call · ${session.callbookTitle}`,
      detail:
        [session.outcomeKey ? outcomeLabel(session.outcomeKey) : "No outcome recorded", session.notes]
          .filter(Boolean)
          .join(" · ") || null,
      outcomeKey: session.outcomeKey,
      href: `/calls/${session.id}`,
    });
  }

  for (const followUp of followUps) {
    timeline.push({
      id: `${followUp.id}-scheduled`,
      kind: "follow_up",
      at: followUp.createdAt,
      title: `Follow-up scheduled · ${followUp.dueAt.slice(0, 10)}`,
      detail: followUp.notes || null,
    });
    if (followUp.completedAt) {
      timeline.push({
        id: `${followUp.id}-completed`,
        kind: "follow_up",
        at: followUp.completedAt,
        title: "Follow-up completed",
        detail: followUp.notes || null,
      });
    }
  }

  // Quotations raised for this lead. Read defensively: a deployment that has not
  // applied the Phase 4 migration still renders the lead, just without quotes.
  let quoteRows: Row[] = [];
  try {
    quoteRows = await db.all<Row>(
      `SELECT id, quote_number, status, total_minor, currency_code, currency_label, created_at
         FROM quotes WHERE lead_id = ? ORDER BY created_at ASC`,
      [id],
    );
  } catch {
    quoteRows = [];
  }

  for (const quoteRow of quoteRows) {
    timeline.push({
      id: str(quoteRow["id"]),
      kind: "quote",
      at: str(quoteRow["created_at"]),
      title: `Quotation created · ${str(quoteRow["quote_number"])}`,
      detail: formatMinorUnits(num(quoteRow["total_minor"]), {
        currencyCode: str(quoteRow["currency_code"]),
        currencyLabel: str(quoteRow["currency_label"]),
      }),
      href: `/quotes/${str(quoteRow["id"])}`,
    });
  }

  timeline.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return { ...lead, calls, callSessions, followUps, timeline };
}

/* Unified call history ------------------------------------------------------ */

const CALL_HISTORY_SELECT = `
  SELECT 'session' AS kind, s.id AS id, s.lead_id AS lead_id, l.business_name AS lead_name,
         s.prospect_name AS prospect_name, m.code AS market_code, m.name AS market_name,
         nc.name AS niche_name, c.title AS title, s.outcome_key AS outcome_key,
         s.status AS status, s.notes AS notes, s.next_action AS next_action,
         s.follow_up_at AS follow_up_at, s.started_at AS at, s.ended_at AS ended_at,
         (SELECT COUNT(*) FROM call_session_steps st WHERE st.session_id = s.id) AS step_count
    FROM call_sessions s
    JOIN callbooks c ON c.id = s.callbook_id
    LEFT JOIN leads l ON l.id = s.lead_id
    LEFT JOIN markets m ON m.id = COALESCE(l.market_id, c.market_id)
    LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
  UNION ALL
  SELECT 'log', lc.id, lc.lead_id, l.business_name, l.business_name,
         m.code, m.name, nc.name, COALESCE(cb.title, 'Logged call'), lc.outcome_key,
         'logged', lc.notes, lc.next_action, lc.follow_up_at, lc.called_at, NULL, 0
    FROM lead_calls lc
    JOIN leads l ON l.id = lc.lead_id
    JOIN markets m ON m.id = l.market_id
    LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
    LEFT JOIN callbooks cb ON cb.id = lc.callbook_id
`;

export type CallHistoryFilters = {
  query?: string;
  marketCode?: string | null;
  outcomeKey?: string | null;
  source?: "all" | "session" | "log";
  from?: string | null;
  to?: string | null;
  leadId?: string | null;
  page?: number;
  pageSize?: number;
};

export type CallHistoryItem = {
  kind: "session" | "log";
  id: string;
  leadId: string | null;
  leadName: string | null;
  prospectName: string | null;
  marketCode: string | null;
  marketName: string | null;
  nicheName: string | null;
  title: string;
  outcomeKey: string | null;
  status: string;
  notes: string;
  nextAction: string | null;
  followUpAt: string | null;
  at: string;
  endedAt: string | null;
  stepCount: number;
};

function toCallHistoryItem(row: Row): CallHistoryItem {
  const kind = row["kind"] === "log" ? "log" : "session";
  return {
    kind,
    id: str(row["id"]),
    leadId: nullableStr(row["lead_id"]),
    leadName: nullableStr(row["lead_name"]),
    prospectName: nullableStr(row["prospect_name"]),
    marketCode: nullableStr(row["market_code"]),
    marketName: nullableStr(row["market_name"]),
    nicheName: nullableStr(row["niche_name"]),
    title: str(row["title"]),
    outcomeKey: nullableStr(row["outcome_key"]),
    status: str(row["status"]),
    notes: str(row["notes"]),
    nextAction: nullableStr(row["next_action"]),
    followUpAt: nullableStr(row["follow_up_at"]),
    at: str(row["at"]),
    endedAt: nullableStr(row["ended_at"]),
    stepCount: num(row["step_count"]),
  };
}

export const CALL_HISTORY_PAGE_SIZE = 25;

export async function listCallHistory(filters: CallHistoryFilters = {}): Promise<{
  items: CallHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = await getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? CALL_HISTORY_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);

  const where: string[] = [];
  const params: SqlValue[] = [];

  if (filters.source === "session") where.push("h.kind = 'session'");
  if (filters.source === "log") where.push("h.kind = 'log'");
  if (filters.marketCode) {
    where.push("h.market_code = ?");
    params.push(filters.marketCode);
  }
  if (filters.leadId) {
    where.push("h.lead_id = ?");
    params.push(filters.leadId);
  }
  if (filters.outcomeKey === "none") {
    where.push("h.outcome_key IS NULL");
  } else if (filters.outcomeKey) {
    where.push("h.outcome_key = ?");
    params.push(filters.outcomeKey);
  }
  if (filters.from) {
    where.push("substr(h.at, 1, 10) >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("substr(h.at, 1, 10) <= ?");
    params.push(filters.to);
  }

  const needle = filters.query?.trim().toLowerCase();
  if (needle) {
    const like = `%${needle}%`;
    where.push(
      `(lower(COALESCE(h.lead_name, '')) LIKE ?
        OR lower(COALESCE(h.prospect_name, '')) LIKE ?
        OR lower(h.title) LIKE ?
        OR lower(h.notes) LIKE ?)`,
    );
    params.push(like, like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await db.first<Row>(
    `SELECT COUNT(*) AS total FROM (${CALL_HISTORY_SELECT}) AS h ${whereSql}`,
    params,
  );

  const rows = await db.all<Row>(
    `SELECT * FROM (${CALL_HISTORY_SELECT}) AS h ${whereSql}
      ORDER BY h.at DESC, h.id ASC
      LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );

  return {
    items: rows.map(toCallHistoryItem),
    total: num(totalRow?.["total"]),
    page,
    pageSize,
  };
}

/** Outcome and market options for the Call History filters. */
export async function listCallHistoryFilterOptions(): Promise<{
  markets: Array<{ code: string; name: string }>;
}> {
  const db = await getDb();
  const rows = await db.all<Row>(
    "SELECT code, name FROM markets WHERE is_active = 1 ORDER BY sort_order",
  );
  return { markets: rows.map((row) => ({ code: str(row["code"]), name: str(row["name"]) })) };
}

/* Dashboard ---------------------------------------------------------------- */

export type MarketValueRow = {
  marketCode: string;
  marketName: string;
  currencyCode: string;
  currencyLabel: string;
  leadCount: number;
  amount: number;
};

export type LeadStats = {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  neverContacted: number;
  totalCalls: number;
  openFollowUps: number;
  dueToday: number;
  overdue: number;
  pipelineByMarket: MarketValueRow[];
  wonByMarket: MarketValueRow[];
};

/**
 * Every figure below is counted from stored records. Currencies are never summed
 * across markets: the money rows are grouped by market and keep their own currency.
 */
export async function getLeadStats(): Promise<LeadStats> {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const activeStatuses = [
    "new",
    "researching",
    "ready_to_contact",
    "contacted",
    "interested",
    "follow_up_required",
    "qualified",
    "proposal",
  ];
  const placeholders = activeStatuses.map(() => "?").join(", ");

  const [statusRows, counters, followRows, pipelineRows, wonRows] = await Promise.all([
    db.all<Row>(
      "SELECT status, COUNT(*) AS total FROM leads WHERE archived_at IS NULL GROUP BY status",
    ),
    db.first<Row>(
      `SELECT
         (SELECT COUNT(*) FROM leads WHERE archived_at IS NULL) AS total_leads,
         (SELECT COUNT(*) FROM leads l WHERE l.archived_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM lead_calls lc WHERE lc.lead_id = l.id)
            AND NOT EXISTS (SELECT 1 FROM call_sessions s WHERE s.lead_id = l.id)) AS never_contacted,
         (SELECT COUNT(*) FROM lead_calls)
           + (SELECT COUNT(*) FROM call_sessions WHERE status <> 'abandoned') AS total_calls`,
    ),
    db.first<Row>(
      `SELECT
         (SELECT COUNT(*) FROM follow_ups WHERE status = 'scheduled') AS open_follow_ups,
         (SELECT COUNT(*) FROM follow_ups
           WHERE status = 'scheduled' AND substr(due_at, 1, 10) = ?) AS due_today,
         (SELECT COUNT(*) FROM follow_ups
           WHERE status = 'scheduled' AND substr(due_at, 1, 10) < ?) AS overdue`,
      [today, today],
    ),
    db.all<Row>(
      `SELECT m.code, m.name, m.currency_code, m.currency_label,
              COUNT(l.id) AS lead_count,
              COALESCE(SUM(l.estimated_value_amount), 0) AS amount
         FROM markets m
         JOIN leads l ON l.market_id = m.id AND l.archived_at IS NULL
        WHERE l.status IN (${placeholders})
        GROUP BY m.id
        ORDER BY m.sort_order`,
      activeStatuses,
    ),
    db.all<Row>(
      `SELECT m.code, m.name, m.currency_code, m.currency_label,
              COUNT(l.id) AS lead_count,
              COALESCE(SUM(l.estimated_value_amount), 0) AS amount
         FROM markets m
         JOIN leads l ON l.market_id = m.id AND l.archived_at IS NULL AND l.status = 'won'
        GROUP BY m.id
        ORDER BY m.sort_order`,
    ),
  ]);

  const countFor = (status: LeadStatus): number =>
    num(statusRows.find((row) => str(row["status"]) === status)?.["total"]);

  const toMarketRows = (rows: Row[]): MarketValueRow[] =>
    rows.map((row) => ({
      marketCode: str(row["code"]),
      marketName: str(row["name"]),
      currencyCode: str(row["currency_code"]),
      currencyLabel: str(row["currency_label"]),
      leadCount: num(row["lead_count"]),
      amount: num(row["amount"]),
    }));

  return {
    totalLeads: num(counters?.["total_leads"]),
    newLeads: countFor("new"),
    interestedLeads: countFor("interested"),
    qualifiedLeads: countFor("qualified"),
    wonLeads: countFor("won"),
    neverContacted: num(counters?.["never_contacted"]),
    totalCalls: num(counters?.["total_calls"]),
    openFollowUps: num(followRows?.["open_follow_ups"]),
    dueToday: num(followRows?.["due_today"]),
    overdue: num(followRows?.["overdue"]),
    pipelineByMarket: toMarketRows(pipelineRows),
    wonByMarket: toMarketRows(wonRows),
  };
}

async function assertMarketAndNiche(
  marketId: string,
  nicheCategoryId: string | null,
): Promise<void> {
  const db = await getDb();
  const market = await db.first<Row>("SELECT id FROM markets WHERE id = ?", [marketId]);
  if (!market) {
    throw new RepositoryError("invalid_reference", "That market no longer exists.");
  }
  if (!nicheCategoryId) return;
  const niche = await db.first<Row>(
    "SELECT id, market_id FROM niche_categories WHERE id = ?",
    [nicheCategoryId],
  );
  if (!niche) {
    throw new RepositoryError("invalid_reference", "That niche no longer exists.");
  }
  if (str(niche["market_id"]) !== marketId) {
    throw new RepositoryError("invalid_reference", "That niche belongs to a different market.");
  }
}