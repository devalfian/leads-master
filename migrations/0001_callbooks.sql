-- Call Playbooks — initial schema.
-- Single-user workspace: there is no authentication layer in this application,
-- so records are not partitioned by owner. See README "Access model".

CREATE TABLE IF NOT EXISTS callbooks (
  id                    TEXT PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  target_audience       TEXT NOT NULL DEFAULT '',
  primary_goal          TEXT NOT NULL
                          CHECK (primary_goal IN ('book_meeting', 'qualify_prospect', 'sell_service', 'follow_up')),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'archived')),
  start_node_id         TEXT,
  published_version     INTEGER NOT NULL DEFAULT 0,
  published_snapshot_json TEXT,
  published_graph_hash  TEXT,
  published_at          TEXT,
  archived_at           TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_callbooks_status_updated
  ON callbooks (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS call_nodes (
  id             TEXT PRIMARY KEY,
  callbook_id    TEXT NOT NULL REFERENCES callbooks (id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('message', 'outcome')),
  title          TEXT NOT NULL DEFAULT '',
  script         TEXT NOT NULL DEFAULT '',
  internal_note  TEXT,
  position_x     REAL NOT NULL DEFAULT 0,
  position_y     REAL NOT NULL DEFAULT 0,
  outcome_key    TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_nodes_callbook
  ON call_nodes (callbook_id, sort_order);

CREATE TABLE IF NOT EXISTS call_branches (
  id                   TEXT PRIMARY KEY,
  callbook_id          TEXT NOT NULL REFERENCES callbooks (id) ON DELETE CASCADE,
  from_node_id         TEXT NOT NULL REFERENCES call_nodes (id) ON DELETE CASCADE,
  label                TEXT NOT NULL DEFAULT '',
  example_phrases_json TEXT NOT NULL DEFAULT '[]',
  next_node_id         TEXT REFERENCES call_nodes (id) ON DELETE SET NULL,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_branches_callbook
  ON call_branches (callbook_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_call_branches_from_node
  ON call_branches (from_node_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_call_branches_next_node
  ON call_branches (next_node_id);

-- A call session stores the immutable published snapshot it started with, so
-- later edits or re-publishes of the callbook never rewrite an active or past call.
CREATE TABLE IF NOT EXISTS call_sessions (
  id               TEXT PRIMARY KEY,
  callbook_id      TEXT NOT NULL REFERENCES callbooks (id),
  callbook_title   TEXT NOT NULL,
  published_version INTEGER NOT NULL,
  snapshot_json    TEXT NOT NULL,
  prospect_name    TEXT,
  status           TEXT NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_node_id  TEXT,
  path_json        TEXT NOT NULL DEFAULT '[]',
  notes            TEXT NOT NULL DEFAULT '',
  outcome_key      TEXT,
  next_action      TEXT,
  follow_up_at     TEXT,
  started_at       TEXT NOT NULL,
  ended_at         TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_callbook
  ON call_sessions (callbook_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status_started
  ON call_sessions (status, started_at DESC);

-- Append-only log of navigation. It is the canonical record of the route taken:
-- call_sessions.path_json / current_node_id are derived caches written in the
-- same batch, and are recomputed by folding this log when it is read back.
CREATE TABLE IF NOT EXISTS call_session_steps (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES call_sessions (id) ON DELETE CASCADE,
  kind         TEXT NOT NULL
                 CHECK (kind IN ('start', 'advance', 'back', 'unexpected', 'restart')),
  from_node_id TEXT,
  branch_id    TEXT,
  to_node_id   TEXT,
  label        TEXT,
  response_text TEXT,
  sort_order   INTEGER NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_session_steps_session
  ON call_session_steps (session_id, sort_order);

CREATE TABLE IF NOT EXISTS call_session_notes (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES call_sessions (id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_session_notes_session
  ON call_session_notes (session_id, created_at);