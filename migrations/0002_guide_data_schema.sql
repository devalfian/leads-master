-- Pricing Library + Session Planner — schema.
--
-- The three source guides (Indonesia, Australia, United States) are stored as
-- normalised master data. All prices are integers in the market's native
-- currency; display strings ("A$1,200") are produced by the application from
-- these numbers (see src/lib/guides/currency.ts).
--
-- Seeding lives in 0003_seed_source_guides.sql and is idempotent (INSERT OR
-- IGNORE), so re-running it never duplicates rows and never overwrites a price
-- that an operator has edited.

CREATE TABLE IF NOT EXISTS markets (
  id                          TEXT PRIMARY KEY,
  code                        TEXT NOT NULL UNIQUE,
  name                        TEXT NOT NULL,
  currency_code               TEXT NOT NULL,
  currency_label              TEXT NOT NULL,
  -- Circular reference to packages; resolved at run time, guarded by a trigger.
  recommended_package_id      TEXT REFERENCES packages (id) ON DELETE SET NULL,
  target_price_amount         INTEGER NOT NULL CHECK (target_price_amount >= 0),
  target_price_is_minimum     INTEGER NOT NULL DEFAULT 0
                                CHECK (target_price_is_minimum IN (0, 1)),
  -- Source schedule note (e.g. the USA daylight-saving-time caveat), verbatim.
  timezone_note               TEXT,
  -- When 1 the UI shows a non-blocking "verify the timezone" warning. The flag is
  -- data, so an administrator can clear it after reviewing the schedule.
  schedule_note_review_required INTEGER NOT NULL DEFAULT 0
                                CHECK (schedule_note_review_required IN (0, 1)),
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  is_active                   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at                  TEXT NOT NULL,
  updated_at                  TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_markets_code ON markets (code);
CREATE INDEX IF NOT EXISTS idx_markets_sort ON markets (is_active, sort_order);

CREATE TABLE IF NOT EXISTS packages (
  id                TEXT PRIMARY KEY,
  market_id         TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  slug              TEXT NOT NULL,
  name              TEXT NOT NULL,
  price_amount      INTEGER NOT NULL CHECK (price_amount >= 0),
  -- "+" pricing: the amount is a floor, not a quote. Kept separate from the
  -- amount so formatting never has to guess.
  is_starting_price INTEGER NOT NULL DEFAULT 0
                      CHECK (is_starting_price IN (0, 1)),
  timeline          TEXT NOT NULL,
  is_recommended    INTEGER NOT NULL DEFAULT 0 CHECK (is_recommended IN (0, 1)),
  display_order     INTEGER NOT NULL DEFAULT 0,
  is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_packages_market_slug ON packages (market_id, slug);
CREATE INDEX IF NOT EXISTS idx_packages_market_order ON packages (market_id, display_order);

-- At most one recommended package per market.
CREATE UNIQUE INDEX IF NOT EXISTS ux_packages_one_recommended
  ON packages (market_id) WHERE is_recommended = 1;

CREATE TABLE IF NOT EXISTS package_features (
  id           TEXT PRIMARY KEY,
  package_id   TEXT NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_package_features_package
  ON package_features (package_id, sort_order);

CREATE TABLE IF NOT EXISTS market_schedules (
  id                  TEXT PRIMARY KEY,
  market_id           TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  schedule_code       TEXT NOT NULL,
  title               TEXT NOT NULL,
  -- Source-guide schedule is always expressed in WIB (UTC+7), 24h "HH:MM".
  start_time_wib      TEXT NOT NULL CHECK (start_time_wib GLOB '[0-2][0-9]:[0-5][0-9]'),
  end_time_wib        TEXT NOT NULL CHECK (end_time_wib GLOB '[0-2][0-9]:[0-5][0-9]'),
  -- Source local-time label, stored exactly as supplied (never recomputed).
  local_time_label    TEXT,
  timezone_label      TEXT,
  city_labels_json    TEXT NOT NULL DEFAULT '[]',
  priority_labels_json TEXT NOT NULL DEFAULT '[]',
  schedule_note       TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_active           INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_market_schedules_code
  ON market_schedules (market_id, schedule_code);
CREATE INDEX IF NOT EXISTS idx_market_schedules_market_order
  ON market_schedules (market_id, sort_order);

CREATE TABLE IF NOT EXISTS niche_categories (
  id          TEXT PRIMARY KEY,
  market_id   TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_niche_categories_market_slug
  ON niche_categories (market_id, slug);
CREATE INDEX IF NOT EXISTS idx_niche_categories_market_order
  ON niche_categories (market_id, sort_order);

CREATE TABLE IF NOT EXISTS niche_services (
  id                TEXT PRIMARY KEY,
  niche_category_id TEXT NOT NULL REFERENCES niche_categories (id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_niche_services_category_name
  ON niche_services (niche_category_id, name);
CREATE INDEX IF NOT EXISTS idx_niche_services_category_order
  ON niche_services (niche_category_id, sort_order);

-- One record per (source niche label x package). The source guide presents these
-- as a grid (31 niche rows across three markets); each cell is stored here so a
-- specialty price can differ from the package base price without touching it.
CREATE TABLE IF NOT EXISTS niche_price_rows (
  id                TEXT PRIMARY KEY,
  market_id         TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  -- Nullable on purpose: some source labels ("Cleaning Company",
  -- "Accounting / Consulting") do not match a category-card title exactly.
  niche_category_id TEXT REFERENCES niche_categories (id) ON DELETE SET NULL,
  niche_label       TEXT NOT NULL,
  package_id        TEXT NOT NULL REFERENCES packages (id) ON DELETE RESTRICT,
  price_amount      INTEGER NOT NULL CHECK (price_amount >= 0),
  source_order      INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_niche_price_rows_label_package
  ON niche_price_rows (market_id, niche_label, package_id);
CREATE INDEX IF NOT EXISTS idx_niche_price_rows_market_order
  ON niche_price_rows (market_id, source_order);
CREATE INDEX IF NOT EXISTS idx_niche_price_rows_category
  ON niche_price_rows (niche_category_id, source_order);

CREATE TABLE IF NOT EXISTS market_call_goals (
  id         TEXT PRIMARY KEY,
  market_id  TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  -- 'call_objective' feeds the Session Planner objective selector.
  -- 'session_goal' is the Indonesia guide's own "Session goals" list.
  goal_kind  TEXT NOT NULL DEFAULT 'call_objective'
               CHECK (goal_kind IN ('call_objective', 'session_goal')),
  goal_text  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_market_call_goals
  ON market_call_goals (market_id, goal_kind, goal_text);
CREATE INDEX IF NOT EXISTS idx_market_call_goals_market
  ON market_call_goals (market_id, goal_kind, sort_order);

CREATE TABLE IF NOT EXISTS market_call_checklist_items (
  id         TEXT PRIMARY KEY,
  market_id  TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  item_text  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_market_call_checklist_items
  ON market_call_checklist_items (market_id, item_text);
CREATE INDEX IF NOT EXISTS idx_market_call_checklist_market
  ON market_call_checklist_items (market_id, sort_order);

CREATE TABLE IF NOT EXISTS market_objections (
  id                 TEXT PRIMARY KEY,
  market_id          TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  objection_text     TEXT NOT NULL,
  suggested_response TEXT NOT NULL,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_market_objections
  ON market_objections (market_id, objection_text);
CREATE INDEX IF NOT EXISTS idx_market_objections_market
  ON market_objections (market_id, sort_order);

CREATE TABLE IF NOT EXISTS market_recommended_tools (
  id               TEXT PRIMARY KEY,
  market_id        TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  tool_name        TEXT NOT NULL,
  tool_description TEXT NOT NULL DEFAULT '',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_market_recommended_tools
  ON market_recommended_tools (market_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_market_recommended_tools_market
  ON market_recommended_tools (market_id, sort_order);

-- A planned calling session. snapshot_json freezes the guide data that was shown
-- when the session was saved, so later master-data edits never rewrite history.
CREATE TABLE IF NOT EXISTS sessions (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  market_id            TEXT NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  schedule_id          TEXT REFERENCES market_schedules (id) ON DELETE RESTRICT,
  session_date         TEXT NOT NULL
                         CHECK (session_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  selected_niche_label TEXT,
  objective            TEXT NOT NULL,
  custom_notes         TEXT NOT NULL DEFAULT '',
  snapshot_json        TEXT NOT NULL,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (session_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_market_date
  ON sessions (market_id, session_date DESC);

-- Integrity guards that a plain foreign key cannot express ---------------------

-- A market's recommended package must belong to that market.
CREATE TRIGGER IF NOT EXISTS trg_markets_recommended_package_market
BEFORE UPDATE OF recommended_package_id ON markets
WHEN NEW.recommended_package_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM packages p
     WHERE p.id = NEW.recommended_package_id AND p.market_id = NEW.id
  )
BEGIN
  SELECT RAISE(ABORT, 'recommended_package_id must reference a package in the same market');
END;

-- A niche price row (and its package) must belong to the same market.
CREATE TRIGGER IF NOT EXISTS trg_niche_price_rows_insert_market
BEFORE INSERT ON niche_price_rows
WHEN NOT EXISTS (
  SELECT 1 FROM packages p
   WHERE p.id = NEW.package_id AND p.market_id = NEW.market_id
)
BEGIN
  SELECT RAISE(ABORT, 'niche price row package must belong to the same market');
END;

CREATE TRIGGER IF NOT EXISTS trg_niche_price_rows_update_market
BEFORE UPDATE OF package_id, market_id ON niche_price_rows
WHEN NOT EXISTS (
  SELECT 1 FROM packages p
   WHERE p.id = NEW.package_id AND p.market_id = NEW.market_id
)
BEGIN
  SELECT RAISE(ABORT, 'niche price row package must belong to the same market');
END;

-- A schedule referenced by a session must belong to the session's market.
CREATE TRIGGER IF NOT EXISTS trg_sessions_schedule_market
BEFORE INSERT ON sessions
WHEN NEW.schedule_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM market_schedules s
     WHERE s.id = NEW.schedule_id AND s.market_id = NEW.market_id
  )
BEGIN
  SELECT RAISE(ABORT, 'session schedule must belong to the session market');
END;

CREATE TRIGGER IF NOT EXISTS trg_sessions_schedule_market_update
BEFORE UPDATE OF schedule_id, market_id ON sessions
WHEN NEW.schedule_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM market_schedules s
     WHERE s.id = NEW.schedule_id AND s.market_id = NEW.market_id
  )
BEGIN
  SELECT RAISE(ABORT, 'session schedule must belong to the session market');
END;