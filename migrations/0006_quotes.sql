-- Phase 4 — Quote Builder.
--
-- Additive only: new tables, no changes to existing ones. Leads, packages,
-- call history and sessions are referenced, never duplicated.
--
-- Money is stored in integer *minor units* of the quote currency (IDR exponent 0,
-- AUD/USD exponent 2), so totals are exact and never depend on floating point.
-- No tax table or tax rate exists anywhere in this application, so quotes are
-- explicitly "no tax calculated" rather than carrying an invented rate.

CREATE TABLE IF NOT EXISTS quote_number_counters (
  year       TEXT PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0 CHECK (last_value >= 0)
);

CREATE TABLE IF NOT EXISTS quotes (
  id                     TEXT PRIMARY KEY,
  quote_number           TEXT NOT NULL UNIQUE,
  lead_id                TEXT NOT NULL REFERENCES leads (id) ON DELETE RESTRICT,
  -- Provenance, when the quote was started from a call or a planned session.
  source_call_id         TEXT REFERENCES lead_calls (id) ON DELETE SET NULL,
  source_session_id      TEXT REFERENCES call_sessions (id) ON DELETE SET NULL,
  status                 TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled')),
  currency_code          TEXT NOT NULL,
  currency_label         TEXT NOT NULL,
  -- Market context snapshotted from the lead at creation time.
  market_id              TEXT REFERENCES markets (id) ON DELETE SET NULL,
  market_code            TEXT,
  market_name            TEXT,
  niche_label            TEXT,
  project_title          TEXT NOT NULL DEFAULT '',
  project_description    TEXT NOT NULL DEFAULT '',
  -- The source package of the primary line (nullable for a fully custom quote).
  package_id             TEXT REFERENCES packages (id) ON DELETE SET NULL,
  client_snapshot_json   TEXT NOT NULL DEFAULT '{}',
  package_snapshot_json  TEXT,
  terms_json             TEXT NOT NULL DEFAULT '{}',
  subtotal_minor         INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  discount_type          TEXT NOT NULL DEFAULT 'none'
                           CHECK (discount_type IN ('none', 'fixed', 'percent')),
  -- Percentages are basis points (1000 = 10%) so no float is ever stored.
  discount_percent_bp    INTEGER NOT NULL DEFAULT 0
                           CHECK (discount_percent_bp >= 0 AND discount_percent_bp <= 10000),
  discount_amount_minor  INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount_minor >= 0),
  total_minor            INTEGER NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  valid_until            TEXT,
  sent_at                TEXT,
  accepted_at            TEXT,
  rejected_at            TEXT,
  cancelled_at           TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status_created ON quotes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_market ON quotes (market_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes (valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes (created_at DESC);

CREATE TABLE IF NOT EXISTS quote_line_items (
  id                TEXT PRIMARY KEY,
  quote_id          TEXT NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  position          INTEGER NOT NULL DEFAULT 0,
  line_type         TEXT NOT NULL CHECK (line_type IN ('package', 'custom')),
  -- Only set for package lines: the pricing record the amount came from.
  source_package_id TEXT REFERENCES packages (id) ON DELETE SET NULL,
  description       TEXT NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor  INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  line_total_minor  INTEGER NOT NULL CHECK (line_total_minor >= 0),
  currency_code     TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote
  ON quote_line_items (quote_id, position);

CREATE TABLE IF NOT EXISTS quote_status_events (
  id          TEXT PRIMARY KEY,
  quote_id    TEXT NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_status_events_quote
  ON quote_status_events (quote_id, created_at);

-- A quote uses exactly one currency, so a line item can never carry another one.
CREATE TRIGGER IF NOT EXISTS trg_quote_line_items_currency_insert
BEFORE INSERT ON quote_line_items
WHEN NOT EXISTS (
  SELECT 1 FROM quotes q
   WHERE q.id = NEW.quote_id AND q.currency_code = NEW.currency_code
)
BEGIN
  SELECT RAISE(ABORT, 'quote line item currency must match the quote currency');
END;

CREATE TRIGGER IF NOT EXISTS trg_quote_line_items_currency_update
BEFORE UPDATE OF currency_code, quote_id ON quote_line_items
WHEN NOT EXISTS (
  SELECT 1 FROM quotes q
   WHERE q.id = NEW.quote_id AND q.currency_code = NEW.currency_code
)
BEGIN
  SELECT RAISE(ABORT, 'quote line item currency must match the quote currency');
END;

-- A line total is quantity x unit price. Enforced here as well as in the
-- application so a wrong total can never be persisted by another code path.
CREATE TRIGGER IF NOT EXISTS trg_quote_line_items_total_insert
BEFORE INSERT ON quote_line_items
WHEN NEW.line_total_minor <> NEW.quantity * NEW.unit_price_minor
BEGIN
  SELECT RAISE(ABORT, 'quote line total must equal quantity x unit price');
END;

CREATE TRIGGER IF NOT EXISTS trg_quote_line_items_total_update
BEFORE UPDATE OF quantity, unit_price_minor, line_total_minor ON quote_line_items
WHEN NEW.line_total_minor <> NEW.quantity * NEW.unit_price_minor
BEGIN
  SELECT RAISE(ABORT, 'quote line total must equal quantity x unit price');
END;