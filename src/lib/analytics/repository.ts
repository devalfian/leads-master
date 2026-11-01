/**
 * Server-only data access for analytics and automation.
 *
 * Everything here is a **read** of records the rest of the application already
 * owns. There is no analytics table and no duplicated lead/call/quote copy:
 * `loadAnalyticsSnapshot()` assembles the same rows the Leads, Call History and
 * Quotes pages read, filtered to a period, and the pure functions in
 * `metrics.ts` / `automation/rules.ts` turn them into figures and reminders.
 *
 * The only writes in this module are automation bookkeeping (rule settings,
 * alert queue, run log) — never a lead, call, follow-up or quote.
 */

import { getDb } from "@/lib/db";
import type { SqlValue } from "@/lib/db";
import { isOutcomeKey } from "@/lib/callbooks/outcomes";
import { isLeadStatus, type LeadStatus } from "@/lib/leads/types";
import { isQuoteStatus } from "@/lib/quotes/types";
import type { AnalyticsPeriod } from "./period";
import type {
  AnalyticsSnapshot,
  CallEvent,
  FollowUpSnapshot,
  LeadSnapshot,
  QuoteSnapshot,
} from "./types";

type Row = Record<string, unknown>;

/** Safety cap: a period is a window, not an export. */
export const EVENT_ROW_CAP = 20_000;

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

function bool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export type AnalyticsFilters = {
  marketCode?: string | null;
  nicheCategoryId?: string | null;
};

/**
 * Call events for one half-open window.
 *
 * Two shapes are stored, so both are read:
 *  - `lead_calls` — a call logged by hand. Every row is a completed attempt.
 *  - `call_sessions` — a run through a published Callbook. Only `completed`
 *    runs count as attempts: an `in_progress` run is not a finished call, and an
 *    `abandoned` one was explicitly discarded.
 *
 * The event time is the call itself (`called_at` / `started_at`), never the row
 * creation time, so back-dated logging lands in the right period.
 */
async function loadCallEvents(
  period: AnalyticsPeriod,
  filters: AnalyticsFilters,
): Promise<{ events: CallEvent[]; truncated: boolean }> {
  const db = await getDb();

  const where: string[] = [];
  const params: SqlValue[] = [];

  if (filters.marketCode) {
    where.push("h.market_code = ?");
    params.push(filters.marketCode);
  }
  if (filters.nicheCategoryId) {
    where.push("h.niche_category_id = ?");
    params.push(filters.nicheCategoryId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await db.all<Row>(
    `SELECT * FROM (
       SELECT 'log' AS kind, lc.id AS id, lc.called_at AS at, lc.outcome_key AS outcome_key,
              lc.lead_id AS lead_id, m.code AS market_code, m.name AS market_name,
              nc.name AS niche_name, l.niche_category_id AS niche_category_id
         FROM lead_calls lc
         LEFT JOIN leads l ON l.id = lc.lead_id
         LEFT JOIN markets m ON m.id = l.market_id
         LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
        WHERE lc.called_at >= ? AND lc.called_at < ?
       UNION ALL
       SELECT 'session', s.id, s.started_at, s.outcome_key,
              s.lead_id, m.code, m.name, nc.name, l.niche_category_id
         FROM call_sessions s
         JOIN callbooks cb ON cb.id = s.callbook_id
         LEFT JOIN leads l ON l.id = s.lead_id
         LEFT JOIN markets m ON m.id = COALESCE(l.market_id, cb.market_id)
         LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
        WHERE s.started_at >= ? AND s.started_at < ?
          AND s.status = 'completed'
     ) AS h
     ${whereSql}
     ORDER BY h.at ASC
     LIMIT ?`,
    [period.startIso, period.endIso, period.startIso, period.endIso, ...params, EVENT_ROW_CAP + 1],
  );

  const truncated = rows.length > EVENT_ROW_CAP;
  const capped = truncated ? rows.slice(0, EVENT_ROW_CAP) : rows;

  return {
    truncated,
    events: capped.map((row) => ({
      at: str(row["at"]),
      outcomeKey: isOutcomeKey(row["outcome_key"]) ? row["outcome_key"] : null,
      leadId: nullableStr(row["lead_id"]),
      marketCode: nullableStr(row["market_code"]),
      marketName: nullableStr(row["market_name"]),
      nicheName: nullableStr(row["niche_name"]),
    })),
  };
}


/**
 * Leads with the aggregates the funnel and the rules need.
 *
 * `hasInterest` / `hasConversation` are derived from the structured outcomes of
 * every call ever recorded for the lead, not from free text. A lead that was
 * never called simply has `false` for both.
 */
async function loadLeads(filters: AnalyticsFilters): Promise<LeadSnapshot[]> {
  const db = await getDb();

  const where: string[] = ["l.archived_at IS NULL"];
  const params: SqlValue[] = [];

  if (filters.marketCode) {
    where.push("m.code = ?");
    params.push(filters.marketCode);
  }
  if (filters.nicheCategoryId) {
    where.push("l.niche_category_id = ?");
    params.push(filters.nicheCategoryId);
  }

  const rows = await db.all<Row>(
    `SELECT l.id, l.business_name, l.market_id, l.niche_category_id, l.city, l.status,
            l.do_not_contact, l.archived_at, l.created_at, l.updated_at,
            m.code AS market_code, m.name AS market_name, nc.name AS niche_name,
            (SELECT COUNT(*) FROM lead_calls lc WHERE lc.lead_id = l.id) AS call_count,
            (SELECT COUNT(*) FROM call_sessions s
              WHERE s.lead_id = l.id AND s.status <> 'abandoned') AS session_count,
            NULLIF(MAX(
              COALESCE((SELECT MAX(lc.called_at) FROM lead_calls lc WHERE lc.lead_id = l.id), ''),
              COALESCE((SELECT MAX(s.started_at) FROM call_sessions s
                         WHERE s.lead_id = l.id AND s.status <> 'abandoned'), '')
            ), '') AS last_contact_at,
            (SELECT MIN(f.due_at) FROM follow_ups f
              WHERE f.lead_id = l.id AND f.status = 'scheduled') AS next_follow_up_at,
            (SELECT lc.outcome_key FROM lead_calls lc
              WHERE lc.lead_id = l.id ORDER BY lc.called_at DESC LIMIT 1) AS last_outcome_key,
            (SELECT COUNT(*) FROM lead_calls lc
              WHERE lc.lead_id = l.id
                AND lc.outcome_key IN ('meeting_booked', 'interested_no_meeting')) AS interest_calls,
            (SELECT COUNT(*) FROM lead_calls lc
              WHERE lc.lead_id = l.id
                AND lc.outcome_key IN ('meeting_booked', 'follow_up_later',
                                       'interested_no_meeting', 'not_interested',
                                       'disqualified')) AS conversation_calls,
            (SELECT COUNT(*) FROM call_sessions s
              WHERE s.lead_id = l.id AND s.status = 'completed'
                AND s.outcome_key IN ('meeting_booked', 'interested_no_meeting')) AS interest_runs,
            (SELECT COUNT(*) FROM call_sessions s
              WHERE s.lead_id = l.id AND s.status = 'completed'
                AND s.outcome_key IN ('meeting_booked', 'follow_up_later',
                                      'interested_no_meeting', 'not_interested',
                                      'disqualified')) AS conversation_runs
       FROM leads l
       JOIN markets m ON m.id = l.market_id
       LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
      WHERE ${where.join(" AND ")}
      ORDER BY l.created_at DESC`,
    params,
  );

  return rows.map((row) => {
    const status = row["status"];
    return {
      id: str(row["id"]),
      businessName: str(row["business_name"]),
      marketId: str(row["market_id"]),
      marketCode: str(row["market_code"]),
      marketName: str(row["market_name"]),
      nicheCategoryId: nullableStr(row["niche_category_id"]),
      nicheName: nullableStr(row["niche_name"]),
      city: nullableStr(row["city"]),
      status: (isLeadStatus(status) ? status : "new") as LeadStatus,
      doNotContact: bool(row["do_not_contact"]),
      archivedAt: nullableStr(row["archived_at"]),
      createdAt: str(row["created_at"]),
      updatedAt: str(row["updated_at"]),
      callCount: num(row["call_count"]),
      sessionCount: num(row["session_count"]),
      lastContactAt: nullableStr(row["last_contact_at"]),
      nextFollowUpAt: nullableStr(row["next_follow_up_at"]),
      lastOutcomeKey: isOutcomeKey(row["last_outcome_key"]) ? row["last_outcome_key"] : null,
      hasInterest: num(row["interest_calls"]) + num(row["interest_runs"]) > 0,
      hasConversation: num(row["conversation_calls"]) + num(row["conversation_runs"]) > 0,
    };
  });
}

/** Every scheduled/completed follow-up, for the rules and the due/overdue counts. */
async function loadFollowUps(filters: AnalyticsFilters): Promise<FollowUpSnapshot[]> {
  const db = await getDb();

  const where: string[] = [];
  const params: SqlValue[] = [];

  if (filters.marketCode) {
    where.push("m.code = ?");
    params.push(filters.marketCode);
  }
  if (filters.nicheCategoryId) {
    where.push("l.niche_category_id = ?");
    params.push(filters.nicheCategoryId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await db.all<Row>(
    `SELECT f.id, f.lead_id, f.due_at, f.type, f.notes, f.status, f.created_at,
            l.business_name, m.code AS market_code, m.name AS market_name, nc.name AS niche_name
       FROM follow_ups f
       JOIN leads l ON l.id = f.lead_id
       JOIN markets m ON m.id = l.market_id
       LEFT JOIN niche_categories nc ON nc.id = l.niche_category_id
      ${whereSql}
      ORDER BY f.due_at ASC`,
    params,
  );

  return rows.map((row) => {
    const status = row["status"];
    return {
      id: str(row["id"]),
      leadId: str(row["lead_id"]),
      leadName: str(row["business_name"]),
      marketCode: str(row["market_code"]),
      marketName: str(row["market_name"]),
      nicheName: nullableStr(row["niche_name"]),
      dueAt: str(row["due_at"]),
      type: str(row["type"]),
      notes: str(row["notes"]),
      status:
        status === "completed" || status === "cancelled"
          ? (status as FollowUpSnapshot["status"])
          : "scheduled",
      createdAt: str(row["created_at"]),
    };
  });
}

/** All quotations, with the lead's market for the breakdown. */
async function loadQuotes(filters: AnalyticsFilters): Promise<QuoteSnapshot[]> {
  const db = await getDb();

  const where: string[] = [];
  const params: SqlValue[] = [];

  if (filters.marketCode) {
    where.push("COALESCE(q.market_code, m.code) = ?");
    params.push(filters.marketCode);
  }
  if (filters.nicheCategoryId) {
    where.push("l.niche_category_id = ?");
    params.push(filters.nicheCategoryId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await db.all<Row>(
    `SELECT q.id, q.quote_number, q.lead_id, q.status, q.currency_code, q.currency_label,
            q.total_minor, q.project_title, q.created_at, q.sent_at, q.accepted_at,
            q.rejected_at, q.cancelled_at, q.valid_until,
            q.market_code, q.market_name, l.business_name,
            COALESCE(q.market_code, m.code) AS market_code_resolved,
            COALESCE(q.market_name, m.name) AS market_name_resolved
       FROM quotes q
       JOIN leads l ON l.id = q.lead_id
       LEFT JOIN markets m ON m.id = l.market_id
      ${whereSql}
      ORDER BY q.created_at DESC`,
    params,
  );

  return rows.map((row) => {
    const status = row["status"];
    return {
      id: str(row["id"]),
      quoteNumber: str(row["quote_number"]),
      leadId: str(row["lead_id"]),
      leadName: str(row["business_name"]),
      marketCode: nullableStr(row["market_code_resolved"]),
      marketName: nullableStr(row["market_name_resolved"]),
      status: (isQuoteStatus(status) ? status : "draft") as QuoteSnapshot["status"],
      currencyCode: str(row["currency_code"]),
      currencyLabel: str(row["currency_label"]),
      totalMinor: num(row["total_minor"]),
      projectTitle: str(row["project_title"]),
      createdAt: str(row["created_at"]),
      sentAt: nullableStr(row["sent_at"]),
      acceptedAt: nullableStr(row["accepted_at"]),
      rejectedAt: nullableStr(row["rejected_at"]),
      cancelledAt: nullableStr(row["cancelled_at"]),
      validUntil: nullableStr(row["valid_until"]),
    };
  });
}

/**
 * Assembles the whole snapshot in one place.
 *
 * The period drives the **event** queries only. Leads, follow-ups and quotes are
 * read in full because they describe current state (a pipeline, a queue, an
 * outstanding balance) rather than a window of activity — filtering them by the
 * period would silently empty the pipeline card for a short range.
 */
export async function loadAnalyticsSnapshot({
  period,
  previous,
  filters = {},
}: {
  period: AnalyticsPeriod;
  previous: AnalyticsPeriod;
  filters?: AnalyticsFilters;
}): Promise<AnalyticsSnapshot> {
  const [current, comparison, leads, followUps, quotes] = await Promise.all([
    loadCallEvents(period, filters),
    loadCallEvents(previous, filters),
    loadLeads(filters),
    loadFollowUps(filters),
    loadQuotes(filters),
  ]);

  return {
    events: current.events,
    previousEvents: comparison.events,
    leads,
    followUps,
    quotes,
    eventsTruncated: current.truncated || comparison.truncated,
  };
}

/**
 * The subset an automation evaluation needs. Rules only read leads, follow-ups
 * and quotations, so the call-event query is skipped entirely.
 */
export async function loadRuleSnapshot(
  filters: AnalyticsFilters = {},
): Promise<Pick<AnalyticsSnapshot, "leads" | "followUps" | "quotes">> {
  const [leads, followUps, quotes] = await Promise.all([
    loadLeads(filters),
    loadFollowUps(filters),
    loadQuotes(filters),
  ]);
  return { leads, followUps, quotes };
}
