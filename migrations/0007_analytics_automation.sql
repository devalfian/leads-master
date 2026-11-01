-- Phase 5 — Analytics and automation.
--
-- Additive only. The analytics dashboard is derived from the records that
-- already exist (leads, lead_calls, call_sessions, follow_ups, quotes), so it
-- adds no tables at all.
--
-- Only the automation layer needs persistence, because nothing in this
-- application could previously remember "this reminder was already shown":
--   * automation_rules  — one row per rule: enabled flag + JSON config.
--   * automation_alerts — the deduplicated reminder queue (one row per
--                         condition, re-opened rather than duplicated).
--   * automation_runs   — one row per evaluation, for transparency.
--
-- No lead, call, follow-up or quote is ever written by an evaluation.

CREATE TABLE IF NOT EXISTS automation_rules (
  rule_key    TEXT PRIMARY KEY,
  is_enabled  INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_alerts (
  id            TEXT PRIMARY KEY,
  rule_key      TEXT NOT NULL,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('follow_up', 'quote', 'lead')),
  entity_id     TEXT NOT NULL,
  -- Kept so the queue can link to the lead even when the entity is a quote.
  lead_id       TEXT REFERENCES leads (id) ON DELETE CASCADE,
  -- The idempotency key: one open reminder per condition, forever.
  dedupe_key    TEXT NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  priority      TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_at        TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  resolved_at   TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_alerts_dedupe
  ON automation_alerts (dedupe_key);
CREATE INDEX IF NOT EXISTS idx_automation_alerts_queue
  ON automation_alerts (status, priority, due_at);
CREATE INDEX IF NOT EXISTS idx_automation_alerts_rule
  ON automation_alerts (rule_key, status);
CREATE INDEX IF NOT EXISTS idx_automation_alerts_lead
  ON automation_alerts (lead_id, status);

CREATE TABLE IF NOT EXISTS automation_runs (
  id              TEXT PRIMARY KEY,
  started_at      TEXT NOT NULL,
  finished_at     TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('success', 'error')),
  rules_evaluated INTEGER NOT NULL DEFAULT 0,
  alerts_opened   INTEGER NOT NULL DEFAULT 0,
  alerts_resolved INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_started
  ON automation_runs (started_at DESC);
