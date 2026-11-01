-- Phase 3 — Leads, logged calls and follow-ups.
--
-- Purely additive. The existing Call History (`call_sessions`, its steps and
-- notes) is untouched apart from one nullable `lead_id` reference, so every call
-- record that exists today keeps working and stays visible.
--
-- Two call shapes are stored, because they are genuinely different records:
--   * `call_sessions` — a run through a published Callbook (unchanged workflow).
--   * `lead_calls`    — a call logged manually against a lead, with or without a
--                       Callbook reference. No snapshot is invented for it.
-- Call History reads both through one query, so there is a single history view.

CREATE TABLE IF NOT EXISTS leads (
  id                       TEXT PRIMARY KEY,
  business_name            TEXT NOT NULL,
  contact_name             TEXT,
  contact_role             TEXT,
  phone                    TEXT,
  email                    TEXT,
  website                  TEXT,
  market_id                TEXT NOT NULL REFERENCES markets (id),
  niche_category_id        TEXT REFERENCES niche_categories (id),
  city                     TEXT,
  address                  TEXT,
  source                   TEXT,
  status                   TEXT NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'researching', 'ready_to_contact',
                                               'contacted', 'interested', 'follow_up_required',
                                               'qualified', 'proposal', 'won', 'lost',
                                               'not_a_fit')),
  notes                    TEXT NOT NULL DEFAULT '',
  estimated_value_amount   INTEGER
                             CHECK (estimated_value_amount IS NULL OR estimated_value_amount >= 0),
  do_not_contact           INTEGER NOT NULL DEFAULT 0 CHECK (do_not_contact IN (0, 1)),
  -- Normalised copies used only for duplicate detection (indexed lookups).
  name_normalized          TEXT NOT NULL DEFAULT '',
  phone_normalized         TEXT NOT NULL DEFAULT '',
  email_normalized         TEXT NOT NULL DEFAULT '',
  website_domain           TEXT NOT NULL DEFAULT '',
  archived_at              TEXT,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_market_status ON leads (market_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads (name_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads (website_domain);

CREATE TABLE IF NOT EXISTS lead_calls (
  id            TEXT PRIMARY KEY,
  lead_id       TEXT NOT NULL REFERENCES leads (id) ON DELETE RESTRICT,
  callbook_id   TEXT REFERENCES callbooks (id) ON DELETE SET NULL,
  package_id    TEXT REFERENCES packages (id) ON DELETE SET NULL,
  called_at     TEXT NOT NULL,
  outcome_key   TEXT NOT NULL,
  notes         TEXT NOT NULL DEFAULT '',
  next_action   TEXT,
  follow_up_at  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_calls_lead ON lead_calls (lead_id, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_calls_called_at ON lead_calls (called_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS follow_ups (
  id              TEXT PRIMARY KEY,
  lead_id         TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  lead_call_id    TEXT REFERENCES lead_calls (id) ON DELETE SET NULL,
  call_session_id TEXT REFERENCES call_sessions (id) ON DELETE SET NULL,
  due_at          TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'call_back'
                    CHECK (type IN ('call_back', 'review_demo', 'send_info',
                                    'quote_follow_up', 'meeting', 'other')),
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_at    TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups (lead_id, due_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups (status, due_at);

-- A callbook run may belong to a lead. Existing rows keep `NULL`, which is exactly
-- what they were: calls not attached to a lead.
ALTER TABLE call_sessions ADD COLUMN lead_id TEXT REFERENCES leads (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_call_sessions_lead
  ON call_sessions (lead_id, started_at DESC);