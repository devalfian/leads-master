/**
 * Server-only automation persistence.
 *
 * The only tables written anywhere in Phase 5. An evaluation:
 *   1. reads the current rule settings (creating default rows if they are absent),
 *   2. computes the reminders that *should* exist (pure, in `rules.ts`),
 *   3. upserts them by their idempotency key,
 *   4. resolves the reminders whose condition no longer holds,
 *   5. writes one run-log row.
 *
 * Steps 3–5 happen in batched statements, so a run either records its bookkeeping
 * or leaves the previous state intact. No lead, call, follow-up or quotation is
 * touched at any point.
 */

import { getDb, RepositoryError } from "@/lib/db";
import type { SqlStatement } from "@/lib/db";
import { loadRuleSnapshot } from "@/lib/analytics/repository";
import type { DesiredAlert } from "@/lib/analytics/types";
import {
  AUTOMATION_RULES,
  defaultRuleStates,
  isAutomationRuleKey,
  normaliseConfig,
  type AutomationAlert,
  type AutomationRuleKey,
  type AutomationRun,
  type EvaluationSummary,
  type RuleConfig,
  type RuleState,
} from "./types";
import { evaluateAllRules } from "./rules";

type Row = Record<string, unknown>;

const STATUS_BATCH_SIZE = 40;

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

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function parseConfig(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string" || raw.length === 0) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toAlert(row: Row): AutomationAlert {
  const priority = row["priority"];
  const status = row["status"];
  const entityType = row["entity_type"];
  return {
    id: str(row["id"]),
    ruleKey: str(row["rule_key"]),
    entityType:
      entityType === "follow_up" || entityType === "quote" ? entityType : "lead",
    entityId: str(row["entity_id"]),
    leadId: nullableStr(row["lead_id"]),
    title: str(row["title"]),
    message: str(row["message"]),
    priority: priority === "high" || priority === "low" ? priority : "medium",
    dueAt: nullableStr(row["due_at"]),
    status: status === "resolved" ? "resolved" : "open",
    firstSeenAt: str(row["first_seen_at"]),
    lastSeenAt: str(row["last_seen_at"]),
    resolvedAt: nullableStr(row["resolved_at"]),
  };
}

function toRun(row: Row): AutomationRun {
  return {
    id: str(row["id"]),
    startedAt: str(row["started_at"]),
    finishedAt: str(row["finished_at"]),
    status: row["status"] === "error" ? "error" : "success",
    rulesEvaluated: num(row["rules_evaluated"]),
    alertsOpened: num(row["alerts_opened"]),
    alertsResolved: num(row["alerts_resolved"]),
    errorMessage: nullableStr(row["error_message"]),
  };
}

/* Rule settings ------------------------------------------------------------ */

async function ensureRuleRows(): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.batch(
    AUTOMATION_RULES.map((rule) => ({
      sql: `INSERT OR IGNORE INTO automation_rules
              (rule_key, is_enabled, config_json, created_at, updated_at)
            VALUES (?, 1, ?, ?, ?)`,
      params: [rule.key, JSON.stringify(rule.defaultConfig), now, now],
    })),
  );
}

/**
 * Current rule state. A rule added to the catalogue after a workspace was set up
 * appears with its defaults instead of being missing.
 */
export async function loadRuleStates(): Promise<RuleState[]> {
  await ensureRuleRows();
  const db = await getDb();
  const rows = await db.all<Row>(
    "SELECT rule_key, is_enabled, config_json, updated_at FROM automation_rules",
  );

  const stored = new Map(
    rows.map((row) => [
      str(row["rule_key"]),
      { enabled: num(row["is_enabled"]) === 1, config: parseConfig(row["config_json"]), updatedAt: nullableStr(row["updated_at"]) },
    ]),
  );

  return defaultRuleStates().map((fallback) => {
    const row = stored.get(fallback.key);
    if (!row) return fallback;
    return {
      key: fallback.key,
      enabled: row.enabled,
      config: normaliseConfig(fallback.key, row.config),
      updatedAt: row.updatedAt,
    };
  });
}

export async function saveRuleState(
  key: string,
  patch: { enabled?: boolean; config?: RuleConfig | Record<string, unknown> },
): Promise<RuleState> {
  if (!isAutomationRuleKey(key)) {
    throw new RepositoryError("not_found", "That automation rule does not exist.");
  }

  await ensureRuleRows();
  const db = await getDb();
  const current = (await loadRuleStates()).find((state) => state.key === key);
  if (!current) throw new RepositoryError("not_found", "That automation rule does not exist.");

  const enabled = typeof patch.enabled === "boolean" ? patch.enabled : current.enabled;
  const config = normaliseConfig(key, { ...current.config, ...(patch.config ?? {}) });
  const now = new Date().toISOString();

  await db.run(
    "UPDATE automation_rules SET is_enabled = ?, config_json = ?, updated_at = ? WHERE rule_key = ?",
    [enabled ? 1 : 0, JSON.stringify(config), now, key],
  );

  return { key, enabled, config, updatedAt: now };
}

/* Alert queue and run log -------------------------------------------------- */

export async function loadOpenAlerts(): Promise<AutomationAlert[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    `SELECT * FROM automation_alerts
      WHERE status = 'open'
      ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
               COALESCE(due_at, '9999') ASC,
               first_seen_at ASC`,
  );
  return rows.map(toAlert);
}

export async function loadRecentRuns(limit = 10): Promise<AutomationRun[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    "SELECT * FROM automation_runs ORDER BY started_at DESC LIMIT ?",
    [Math.min(Math.max(limit, 1), 50)],
  );
  return rows.map(toRun);
}

async function chunkedBatch(statements: SqlStatement[]): Promise<void> {
  if (statements.length === 0) return;
  const db = await getDb();
  for (let index = 0; index < statements.length; index += STATUS_BATCH_SIZE) {
    await db.batch(statements.slice(index, index + STATUS_BATCH_SIZE));
  }
}

type ExistingAlert = { id: string; status: string; ruleKey: string };

async function loadExistingAlerts(): Promise<Map<string, ExistingAlert>> {
  const db = await getDb();
  const rows = await db.all<Row>("SELECT id, dedupe_key, status, rule_key FROM automation_alerts");
  return new Map(
    rows.map((row) => [
      str(row["dedupe_key"]),
      { id: str(row["id"]), status: str(row["status"]), ruleKey: str(row["rule_key"]) },
    ]),
  );
}

/**
 * Evaluates every enabled rule and reconciles the stored queue.
 *
 * Idempotency: the unique `dedupe_key` is the whole strategy. Re-running with
 * the same data updates `last_seen_at` on the existing row and opens nothing new;
 * a reminder whose condition has cleared is marked `resolved` and its row is kept
 * so the history is auditable rather than deleted.
 */
export async function evaluateAutomation({
  now = new Date(),
}: {
  now?: Date;
} = {}): Promise<EvaluationSummary> {
  const startedAt = now.toISOString();
  const today = startedAt.slice(0, 10);

  const states = await loadRuleStates();
  const configs = {} as Record<AutomationRuleKey, RuleConfig>;
  const enabled = {} as Record<AutomationRuleKey, boolean>;
  for (const state of states) {
    configs[state.key] = state.config;
    enabled[state.key] = state.enabled;
  }

  const snapshot = await loadRuleSnapshot();
  const { alerts: desired, skipped } = evaluateAllRules(
    { snapshot, now, today, configs },
    enabled,
  );

  const existing = await loadExistingAlerts();
  const desiredKeys = new Set(desired.map((alert) => alert.dedupeKey));

  const statements: SqlStatement[] = [];
  let opened = 0;

  for (const alert of desired) {
    const current = existing.get(alert.dedupeKey);
    if (!current) {
      opened += 1;
      statements.push(insertAlert(alert, startedAt));
      continue;
    }
    if (current.status !== "open") {
      // The condition came back after being resolved: re-open the same row
      // instead of creating a duplicate. The row keeps its original first_seen_at.
      opened += 1;
    }
    statements.push(refreshAlert(alert, current.id, startedAt));
  }

  const toResolve: string[] = [];
  for (const [dedupeKey, row] of existing) {
    if (row.status !== "open") continue;
    if (desiredKeys.has(dedupeKey)) continue;
    toResolve.push(row.id);
  }

  for (const id of toResolve) {
    statements.push({
      sql: "UPDATE automation_alerts SET status = 'resolved', resolved_at = ?, last_seen_at = ? WHERE id = ?",
      params: [startedAt, startedAt, id],
    });
  }

  const finishedAt = new Date().toISOString();
  statements.push({
    sql: `INSERT INTO automation_runs
            (id, started_at, finished_at, status, rules_evaluated, alerts_opened,
             alerts_resolved, error_message)
          VALUES (?, ?, ?, 'success', ?, ?, ?, NULL)`,
    params: [
      createId("arun"),
      startedAt,
      finishedAt,
      AUTOMATION_RULES.length - skipped.length,
      opened,
      toResolve.length,
    ],
  });

  await chunkedBatch(statements);

  const db = await getDb();
  const runRow = await db.first<Row>(
    "SELECT * FROM automation_runs ORDER BY started_at DESC LIMIT 1",
  );
  if (!runRow) {
    throw new RepositoryError("not_saved", "The evaluation could not be recorded.");
  }

  return {
    run: toRun(runRow),
    openAlerts: await loadOpenAlerts(),
    skippedRules: skipped,
  };
}

function insertAlert(alert: DesiredAlert, now: string): SqlStatement {
  return {
    sql: `INSERT INTO automation_alerts
            (id, rule_key, entity_type, entity_id, lead_id, dedupe_key, title, message,
             priority, due_at, status, first_seen_at, last_seen_at, resolved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, NULL)`,
    params: [
      createId("alert"),
      alert.ruleKey,
      alert.entityType,
      alert.entityId,
      alert.leadId,
      alert.dedupeKey,
      alert.title,
      alert.message,
      alert.priority,
      alert.dueAt,
      now,
      now,
    ],
  };
}

function refreshAlert(alert: DesiredAlert, id: string, now: string): SqlStatement {
  return {
    sql: `UPDATE automation_alerts
             SET last_seen_at = ?, status = 'open', resolved_at = NULL, message = ?,
                 priority = ?, due_at = ?, title = ?
           WHERE id = ?`,
    params: [now, alert.message, alert.priority, alert.dueAt, alert.title, id],
  };
}